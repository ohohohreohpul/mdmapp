'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check, X, ChevronDown, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface BunnyVideo { guid: string; title: string; length: number; embed_url: string }
interface LessonItem { id: string; title: string; module_title: string; course_title: string; current_video_url?: string }
interface MatchRow {
  lesson: LessonItem;
  video_guid: string | null;
  video_title: string | null;
  embed_url: string | null;
  confidence: number;
  status: 'pending' | 'confirmed' | 'skipped';
}

type Phase = 'idle' | 'loading' | 'review' | 'applying'

function confidenceColor(c: number) {
  if (c >= 0.75) return '#10B981';
  if (c >= 0.45) return '#F59E0B';
  return '#EF4444';
}

function confidenceLabel(c: number) {
  if (c >= 0.75) return 'สูง';
  if (c >= 0.45) return 'กลาง';
  return 'ต่ำ';
}

export default function BunnyMatcherPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [allVideos, setAllVideos] = useState<BunnyVideo[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);

  const confirmedCount = matches.filter(m => m.status === 'confirmed').length;
  const skippedCount = matches.filter(m => m.status === 'skipped').length;

  const runMatcher = useCallback(async () => {
    try {
      setPhase('loading');

      setLoadingMsg('กำลังดึงวิดีโอจาก Bunny.net…');
      const bunnyRes = await axios.get(`${API_URL}/api/bunny/videos`);
      const videos: BunnyVideo[] = bunnyRes.data.videos || [];
      setAllVideos(videos);

      if (!videos.length) {
        toast.error('ไม่พบวิดีโอใน Bunny.net Library กรุณาตรวจสอบ API Key');
        setPhase('idle');
        return;
      }

      setLoadingMsg('กำลังโหลดบทเรียนทั้งหมด…');
      const coursesRes = await axios.get(`${API_URL}/api/courses`);
      const courses: any[] = coursesRes.data || [];

      const lessonItems: LessonItem[] = [];
      for (const course of courses) {
        const modsRes = await axios.get(`${API_URL}/api/modules/course/${course._id}`);
        for (const mod of (modsRes.data || [])) {
          const lesRes = await axios.get(`${API_URL}/api/lessons/module/${mod._id}`);
          for (const lesson of (lesRes.data || [])) {
            if (lesson.content_type === 'video') {
              lessonItems.push({ id: lesson._id, title: lesson.title, module_title: mod.title, course_title: course.title, current_video_url: lesson.video_url });
            }
          }
        }
      }

      setLoadingMsg('กำลังจับคู่…');
      // Simple fuzzy match: normalize titles, find best video match
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9ก-๙]/g, ' ').replace(/\s+/g, ' ').trim();

      const rows: MatchRow[] = lessonItems.map(lesson => {
        const lNorm = normalize(lesson.title);
        let best: BunnyVideo | null = null;
        let bestScore = 0;

        for (const v of videos) {
          const vNorm = normalize(v.title.replace(/\.[^.]+$/, ''));
          const lWords = new Set(lNorm.split(' ').filter(w => w.length > 2));
          const vWords = vNorm.split(' ').filter(w => w.length > 2);
          const matches = vWords.filter(w => lWords.has(w)).length;
          const score = lWords.size > 0 ? matches / Math.max(lWords.size, vWords.length) : 0;
          if (score > bestScore) { bestScore = score; best = v; }
        }

        return {
          lesson,
          video_guid: best?.guid ?? null,
          video_title: best?.title ?? null,
          embed_url: best?.embed_url ?? null,
          confidence: bestScore,
          status: bestScore >= 0.3 ? 'pending' : 'skipped',
        };
      });

      setMatches(rows);
      setPhase('review');
    } catch (e: any) {
      toast.error(e?.message ?? 'เกิดข้อผิดพลาด');
      setPhase('idle');
    }
  }, []);

  const setStatus = (idx: number, status: MatchRow['status']) => {
    setMatches(prev => prev.map((m, i) => i === idx ? { ...m, status } : m));
  };

  const openPicker = (idx: number) => { setPickerTargetIdx(idx); setPickerOpen(true); };

  const pickVideo = (v: BunnyVideo) => {
    if (pickerTargetIdx === null) return;
    setMatches(prev => prev.map((m, i) => i === pickerTargetIdx
      ? { ...m, video_guid: v.guid, video_title: v.title, embed_url: v.embed_url, status: 'pending' }
      : m));
    setPickerOpen(false);
  };

  const applyMatches = async () => {
    const toApply = matches.filter(m => m.status === 'confirmed' && m.embed_url);
    if (!toApply.length) { toast.error('ยืนยันการจับคู่อย่างน้อย 1 รายการก่อน'); return; }
    if (!confirm(`อัปเดต ${toApply.length} บทเรียน?`)) return;

    setPhase('applying');
    let ok = 0, fail = 0;
    for (const row of toApply) {
      try {
        await axios.put(`${API_URL}/api/lessons/${row.lesson.id}`, { video_url: row.embed_url, video_id: row.video_guid });
        ok++;
      } catch { fail++; }
    }
    toast.success(`อัปเดตสำเร็จ ${ok} บทเรียน${fail ? ` (ล้มเหลว ${fail})` : ''}`);
    router.back();
  };

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="text-[17px] font-bold text-text-primary">Bunny Matcher</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 pb-16">
        {/* IDLE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center py-20 gap-6 text-center">
            <div className="w-24 h-24 bg-[#FFF7ED] rounded-full flex items-center justify-center text-5xl">🎯</div>
            <div>
              <p className="text-[18px] font-bold text-text-primary mb-2">จับคู่วิดีโอกับบทเรียน</p>
              <p className="text-[14px] text-text-secondary leading-6">ดึงวิดีโอจาก Bunny.net แล้วจับคู่กับบทเรียนโดยอัตโนมัติ</p>
            </div>
            <button onClick={runMatcher} className="bg-[#F97316] text-white font-bold px-8 py-3.5 rounded-2xl hover:opacity-90 transition-opacity">เริ่มจับคู่</button>
          </div>
        )}

        {/* LOADING / APPLYING */}
        {(phase === 'loading' || phase === 'applying') && (
          <div className="flex flex-col items-center py-24 gap-4">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-text-secondary text-[14px]">{phase === 'applying' ? 'กำลังอัปเดตบทเรียน...' : loadingMsg}</p>
          </div>
        )}

        {/* REVIEW */}
        {phase === 'review' && (
          <>
            {/* Summary bar */}
            <div className="bg-white rounded-2xl border border-separator p-4 mb-4 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[20px] font-bold text-[#10B981]">{confirmedCount}</p>
                  <p className="text-[11px] text-text-secondary">ยืนยัน</p>
                </div>
                <div className="text-center">
                  <p className="text-[20px] font-bold text-text-secondary">{skippedCount}</p>
                  <p className="text-[11px] text-text-secondary">ข้าม</p>
                </div>
                <div className="text-center">
                  <p className="text-[20px] font-bold text-[#F59E0B]">{matches.filter(m => m.status === 'pending').length}</p>
                  <p className="text-[11px] text-text-secondary">รอดำเนินการ</p>
                </div>
              </div>
              <button onClick={applyMatches} disabled={confirmedCount === 0} className="bg-[#F97316] text-white font-bold px-4 py-2.5 rounded-xl text-[13px] disabled:opacity-40 hover:opacity-90 transition-opacity">
                อัปเดต {confirmedCount} รายการ
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {matches.map((row, idx) => (
                <div key={row.lesson.id} className={`bg-white rounded-2xl border-2 p-4 transition-colors ${row.status === 'confirmed' ? 'border-[#10B981]' : row.status === 'skipped' ? 'border-gray-200 opacity-50' : 'border-separator'}`}>
                  {/* Lesson info */}
                  <p className="text-[13px] text-text-secondary mb-0.5">{row.lesson.course_title} › {row.lesson.module_title}</p>
                  <p className="text-[14px] font-semibold text-text-primary mb-3">{row.lesson.title}</p>

                  {/* Match */}
                  {row.video_guid ? (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${confidenceColor(row.confidence)}20`, color: confidenceColor(row.confidence) }}>
                        {confidenceLabel(row.confidence)} ({Math.round(row.confidence * 100)}%)
                      </span>
                      <p className="text-[13px] text-text-secondary flex-1 truncate">{row.video_title}</p>
                      <button onClick={() => openPicker(idx)} className="shrink-0">
                        <ChevronDown size={16} className="text-text-tertiary" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[12px] text-text-tertiary">ไม่พบวิดีโอที่ตรงกัน</span>
                      <button onClick={() => openPicker(idx)} className="text-[12px] text-primary font-semibold">เลือกเอง</button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(idx, row.status === 'confirmed' ? 'pending' : 'confirmed')}
                      disabled={!row.video_guid}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-bold transition-colors disabled:opacity-30 ${row.status === 'confirmed' ? 'bg-[#10B981] text-white' : 'bg-[#D1FAE5] text-[#065F46]'}`}
                    >
                      <Check size={15} /> ยืนยัน
                    </button>
                    <button
                      onClick={() => setStatus(idx, row.status === 'skipped' ? 'pending' : 'skipped')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-bold transition-colors ${row.status === 'skipped' ? 'bg-gray-400 text-white' : 'bg-gray-100 text-text-secondary'}`}
                    >
                      <X size={15} /> ข้าม
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Video picker */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-separator shrink-0">
              <h2 className="text-[17px] font-bold text-text-primary">เลือกวิดีโอ</h2>
              <button onClick={() => setPickerOpen(false)}><X size={22} className="text-text-secondary" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3">
              {allVideos.map(v => (
                <button key={v.guid} onClick={() => pickVideo(v)} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left border-b border-separator/50 last:border-0">
                  <div className="w-9 h-9 bg-[#FFF7ED] rounded-lg flex items-center justify-center text-lg shrink-0">🐰</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-text-primary truncate">{v.title}</p>
                    <p className="text-[11px] text-text-tertiary">{Math.round(v.length / 60)} นาที</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check, ChevronRight, ArrowUpDown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface BunnyCollection { guid: string; name: string; video_count: number }
interface ImportRow { guid: string; embedUrl: string; rawTitle: string; cleanTitle: string; order: number; durationMin: number; selected: boolean }

type Phase = 'idle' | 'loadingCollections' | 'collections' | 'loadingVideos' | 'select' | 'configure' | 'creating'

function parseTitle(raw: string): { cleanTitle: string; order: number } {
  let t = raw.replace(/\.[^.]+$/, '').trim();
  let order = 0;
  const m = t.match(/^(\d+)[_.\s]/);
  if (m) { order = parseInt(m[1], 10); t = t.slice(m[0].length); }
  const isWk = /_wk$/i.test(t);
  if (isWk) t = t.replace(/_wk$/i, '');
  t = t.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  t = t.replace(/[_-]+/g, ' ').trim();
  const small = new Set(['in', 'on', 'of', 'and', 'or', 'to', 'the', 'a', 'an', 'for', 'with']);
  t = t.split(/\s+/).map((w, i) => (!i || !small.has(w.toLowerCase())) ? w.charAt(0).toUpperCase() + w.slice(1) : w.toLowerCase()).join(' ');
  if (isWk) t += ' (Workshop)';
  return { cleanTitle: t || raw, order };
}

export default function BunnyImportPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [collections, setCollections] = useState<BunnyCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<BunnyCollection | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [sortByNum, setSortByNum] = useState(true);

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelCourse] = useState('');
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelModule] = useState('');
  const [loadingMods, setLoadingMods] = useState(false);

  const selectedRows = useMemo(() => rows.filter(r => r.selected), [rows]);
  const sortedRows = useMemo(() => [...rows].sort((a, b) =>
    sortByNum ? (a.order - b.order || a.rawTitle.localeCompare(b.rawTitle)) : a.rawTitle.localeCompare(b.rawTitle)
  ), [rows, sortByNum]);

  const loadCollections = useCallback(async () => {
    try {
      setPhase('loadingCollections');
      const res = await axios.get(`${API_URL}/api/bunny/collections`);
      setCollections(res.data?.collections ?? []);
      setPhase('collections');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail ?? 'โหลด Collections ไม่สำเร็จ\nตรวจสอบ Bunny API Key ใน Admin → ตั้งค่าระบบ');
      setPhase('idle');
    }
  }, []);

  const loadVideos = useCallback(async (col: BunnyCollection) => {
    try {
      setActiveCollection(col);
      setPhase('loadingVideos');
      const [videosRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/api/bunny/videos?collection_id=${col.guid}`),
        axios.get(`${API_URL}/api/courses`),
      ]);
      const videos = videosRes.data?.videos ?? [];
      if (!videos.length) { toast.error('Collection นี้ว่างเปล่า'); setPhase('collections'); return; }
      setRows(videos.map((v: any) => {
        const { cleanTitle, order } = parseTitle(v.title);
        return { guid: v.guid, embedUrl: v.embed_url, rawTitle: v.title, cleanTitle, order, durationMin: Math.round(v.length / 60), selected: false };
      }));
      setCourses(coursesRes.data ?? []);
      setPhase('select');
    } catch (e: any) {
      toast.error(e?.response?.data?.Message ?? 'โหลดวิดีโอไม่สำเร็จ');
      setPhase('collections');
    }
  }, []);

  const toggle = (guid: string) => setRows(p => p.map(r => r.guid === guid ? { ...r, selected: !r.selected } : r));
  const selectAll = () => setRows(p => p.map(r => ({ ...r, selected: true })));
  const clearAll = () => setRows(p => p.map(r => ({ ...r, selected: false })));
  const editTitle = (guid: string, v: string) => setRows(p => p.map(r => r.guid === guid ? { ...r, cleanTitle: v } : r));

  const onSelectCourse = async (id: string) => {
    setSelCourse(id); setSelModule(''); setModules([]);
    if (!id) return;
    try {
      setLoadingMods(true);
      const res = await axios.get(`${API_URL}/api/modules/course/${id}`);
      setModules(res.data ?? []);
    } catch { toast.error('โหลดโมดูลไม่สำเร็จ'); }
    finally { setLoadingMods(false); }
  };

  const createLessons = useCallback(async () => {
    if (!selectedModuleId) { toast.error('กรุณาเลือก Module ก่อน'); return; }
    if (!confirm(`สร้าง ${selectedRows.length} บทเรียน?`)) return;

    const toCreate = [...selectedRows].sort((a, b) => a.order - b.order || a.rawTitle.localeCompare(b.rawTitle));
    setPhase('creating');
    let ok = 0, fail = 0, base = 1;
    try {
      const ex = await axios.get(`${API_URL}/api/lessons/module/${selectedModuleId}`);
      base = (ex.data ?? []).length + 1;
    } catch {}

    for (let i = 0; i < toCreate.length; i++) {
      const r = toCreate[i];
      try {
        await axios.post(`${API_URL}/api/lessons`, {
          module_id: selectedModuleId, title: r.cleanTitle.trim() || r.rawTitle,
          description: '', order: base + i, content_type: 'video',
          video_url: r.embedUrl, video_id: r.guid,
          duration_minutes: r.durationMin || undefined,
        });
        ok++;
      } catch { fail++; }
    }

    toast.success(`สร้างสำเร็จ ${ok} บทเรียน${fail ? ` (ล้มเหลว ${fail})` : ''} 🎉`);
    router.back();
  }, [selectedRows, selectedModuleId, router]);

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="text-[17px] font-bold text-text-primary">Import จาก Bunny.net</h1>
        <div className="w-10" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 pb-16">
        {/* IDLE */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center py-20 gap-6 text-center">
            <div className="w-24 h-24 bg-[#FFF7ED] rounded-full flex items-center justify-center text-5xl">🐰</div>
            <div>
              <p className="text-[18px] font-bold text-text-primary mb-2">Import วิดีโอจาก Bunny.net</p>
              <p className="text-[14px] text-text-secondary leading-6">โหลด Collections → เลือกวิดีโอ → สร้างบทเรียนอัตโนมัติ<br />ต้องตั้งค่า Bunny API Key ใน Admin → ตั้งค่าระบบก่อน</p>
            </div>
            <button onClick={loadCollections} className="bg-[#F97316] text-white font-bold px-8 py-3.5 rounded-2xl hover:opacity-90 transition-opacity">โหลด Collections</button>
          </div>
        )}

        {/* LOADING */}
        {(phase === 'loadingCollections' || phase === 'loadingVideos' || phase === 'creating') && (
          <div className="flex flex-col items-center py-24 gap-4">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-text-secondary">
              {phase === 'creating' ? `กำลังสร้างบทเรียน... (${selectedRows.length} รายการ)` : 'กำลังโหลด...'}
            </p>
          </div>
        )}

        {/* COLLECTIONS */}
        {phase === 'collections' && (
          <>
            <p className="text-[14px] font-semibold text-text-primary mb-3">{collections.length} Collections</p>
            <div className="flex flex-col gap-2">
              {collections.map(col => (
                <button key={col.guid} onClick={() => loadVideos(col)} className="bg-white rounded-2xl border border-separator p-4 flex items-center gap-3 text-left hover:border-primary/30 transition-colors">
                  <div className="w-11 h-11 bg-[#FFF7ED] rounded-xl flex items-center justify-center text-2xl shrink-0">🐰</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-text-primary truncate">{col.name}</p>
                    <p className="text-[13px] text-text-secondary">{col.video_count} วิดีโอ</p>
                  </div>
                  <ChevronRight size={18} className="text-text-tertiary shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* SELECT */}
        {phase === 'select' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] font-semibold text-text-primary">{activeCollection?.name} — เลือกวิดีโอ</p>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[12px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">เลือกทั้งหมด</button>
                <button onClick={clearAll} className="text-[12px] font-bold text-text-secondary bg-gray-100 px-2.5 py-1 rounded-lg">ล้าง</button>
                <button onClick={() => setSortByNum(p => !p)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
                  <ArrowUpDown size={14} className="text-text-secondary" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {sortedRows.map(row => (
                <div key={row.guid} onClick={() => toggle(row.guid)} className={`bg-white rounded-xl border-2 p-3 flex items-start gap-3 cursor-pointer transition-colors ${row.selected ? 'border-primary bg-primary/5' : 'border-separator'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${row.selected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                    {row.selected && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      value={row.cleanTitle}
                      onChange={e => { e.stopPropagation(); editTitle(row.guid, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className="w-full text-[14px] font-medium text-text-primary bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                    />
                    <p className="text-[11px] text-text-tertiary mt-0.5">{row.rawTitle} {row.durationMin ? `· ${row.durationMin}m` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedRows.length > 0 && (
              <button onClick={() => setPhase('configure')} className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity">
                ถัดไป ({selectedRows.length} วิดีโอ) →
              </button>
            )}
          </>
        )}

        {/* CONFIGURE */}
        {phase === 'configure' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setPhase('select')} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ArrowLeft size={18} className="text-text-primary" />
              </button>
              <p className="text-[15px] font-bold text-text-primary">{selectedRows.length} วิดีโอที่เลือก</p>
            </div>

            <p className="text-[13px] font-semibold text-[#374151] mb-2">เลือกคอร์ส</p>
            <div className="flex flex-col gap-2 mb-4">
              {courses.map(c => (
                <button key={c._id} onClick={() => onSelectCourse(c._id)} className={`py-3 px-4 rounded-xl border-2 text-[14px] text-left transition-colors ${selectedCourseId === c._id ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-gray-200 text-text-secondary'}`}>{c.title}</button>
              ))}
            </div>

            {selectedCourseId && (
              <>
                <p className="text-[13px] font-semibold text-[#374151] mb-2">เลือกโมดูล</p>
                {loadingMods ? (
                  <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-primary" /></div>
                ) : (
                  <div className="flex flex-col gap-2 mb-4">
                    {modules.map(m => (
                      <button key={m._id} onClick={() => setSelModule(m._id)} className={`py-3 px-4 rounded-xl border-2 text-[14px] text-left transition-colors ${selectedModuleId === m._id ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-gray-200 text-text-secondary'}`}>{m.title}</button>
                    ))}
                  </div>
                )}
              </>
            )}

            {selectedModuleId && (
              <button onClick={createLessons} className="w-full bg-[#F97316] text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity">
                สร้าง {selectedRows.length} บทเรียน 🎉
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

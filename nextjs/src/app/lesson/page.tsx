'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, PlayCircle, Headphones, FileText, Clock, Info, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { stripHtml } from '@shared/contentUtils';
import { NavHeader } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

function LessonPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const lessonId = params.get('id') ?? '';
  const courseId = params.get('courseId') ?? '';
  const { user, updateProgress, getUserProgress } = useUser();

  const [lesson, setLesson]         = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => { if (lessonId) loadLesson(); }, [lessonId]);

  useEffect(() => {
    if (user && courseId) {
      const progress = getUserProgress(courseId);
      setIsCompleted(progress?.completed_lessons?.includes(lessonId) || false);
    }
  }, [user, courseId, lessonId]);

  const loadLesson = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/lessons/${lessonId}`);
      setLesson(res.data);
    } catch { setError('ไม่สามารถโหลดบทเรียนได้'); }
    finally   { setLoading(false); }
  };

  const markAsComplete = async () => {
    if (!user) { toast.error('กรุณาเข้าสู่ระบบเพื่อบันทึกความคืบหน้า'); return; }
    setCompleting(true);
    try {
      await updateProgress(courseId, lessonId);
      setIsCompleted(true);
      toast.success('เรียนจบบทเรียนนี้แล้ว!');
    } catch { toast.error('ไม่สามารถบันทึกความคืบหน้าได้'); }
    finally   { setCompleting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  );

  if (error || !lesson) return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertCircle size={64} className="text-[#EF4444]" />
      <p className="font-semibold text-ink">{error || 'ไม่พบบทเรียน'}</p>
      <button onClick={loadLesson} className="bg-brand text-white px-6 py-3 rounded-2xl font-semibold">ลองอีกครั้ง</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      <NavHeader
        title={lesson.title}
        right={isCompleted ? <CheckCircle size={22} className="text-[#10B981]" /> : undefined}
      />

      <div className="max-w-lg mx-auto pb-10">
        {/* Video */}
        {lesson.content_type === 'video' && (
          <div className="w-full bg-black" style={{ aspectRatio: '16/9' }}>
            {lesson.video_url ? (
              <iframe
                src={lesson.video_url}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-900">
                <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center">
                  <PlayCircle size={36} className="text-white" />
                </div>
                <p className="text-white/70 text-sm">วิดีโอจะพร้อมใช้งานเร็วๆ นี้</p>
              </div>
            )}
          </div>
        )}

        {/* Audio */}
        {lesson.content_type === 'audio' && (
          <div>
            <div className="px-5 py-8 flex flex-col items-center text-center"
                 style={{ background: 'linear-gradient(160deg, #f06bba, #e8409b, #c7357f)' }}>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <Headphones size={40} className="text-white" />
              </div>
              <h2 className="text-white font-bold text-[18px]">{lesson.title}</h2>
              <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full mt-2">Podcast Mode</span>
            </div>
            {lesson.audio_url ? (
              <div className="px-5 py-4">
                <audio controls className="w-full" src={lesson.audio_url}>Your browser does not support audio.</audio>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-ink-2 gap-2">
                <Headphones size={40} className="text-ink-3" />
                <p className="text-sm">Audio กำลังสร้าง...</p>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Info card */}
          <div className="bg-bg rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={18} className="text-brand" />
              <p className="text-[15px] font-bold text-ink">เกี่ยวกับบทเรียนนี้</p>
            </div>
            <p className="text-[14px] text-ink-2 leading-relaxed mb-3">{stripHtml(lesson.description)}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-ink-2">
                {lesson.content_type === 'video' ? <PlayCircle size={16} /> : lesson.content_type === 'audio' ? <Headphones size={16} /> : <FileText size={16} />}
                <span className="text-[13px]">
                  {lesson.content_type === 'video' ? 'วิดีโอ' : lesson.content_type === 'audio' ? 'เสียง' : 'บทความ'}
                </span>
              </div>
              {lesson.duration_minutes > 0 && (
                <div className="flex items-center gap-1.5 text-ink-2">
                  <Clock size={16} />
                  <span className="text-[13px]">{lesson.duration_minutes} นาที</span>
                </div>
              )}
            </div>
          </div>

          {/* Text content */}
          {lesson.content_type === 'text' && lesson.content && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p className="text-[15px] text-ink leading-[1.75] whitespace-pre-line">
                {stripHtml(lesson.content)}
              </p>
            </div>
          )}

          {/* Complete button */}
          {!isCompleted ? (
            <button
              onClick={markAsComplete}
              disabled={completing}
              className="w-full flex items-center justify-center gap-2 bg-[#10B981] text-white font-bold text-[16px] py-4 rounded-2xl shadow-[0_6px_14px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
              {completing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
              {completing ? 'กำลังบันทึก...' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-[#10B981]/10 rounded-2xl py-4">
              <CheckCircle size={24} className="text-[#10B981]" />
              <span className="text-[#10B981] font-bold text-[16px]">เรียนจบแล้ว</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LessonPage() {
  return <Suspense><LessonPageInner /></Suspense>;
}

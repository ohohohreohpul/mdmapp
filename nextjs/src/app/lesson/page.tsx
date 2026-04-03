'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, PlayCircle, Headphones, FileText, Clock, Info, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { stripHtml } from '@shared/contentUtils';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LessonPage() {
  const router = useRouter();
  const params = useSearchParams();
  const lessonId = params.get('id') ?? '';
  const courseId = params.get('courseId') ?? '';
  const { user, updateProgress, getUserProgress } = useUser();

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (lessonId) loadLesson();
  }, [lessonId]);

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
    } catch {
      setError('ไม่สามารถโหลดบทเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อบันทึกความคืบหน้า');
      return;
    }
    setCompleting(true);
    try {
      await updateProgress(courseId, lessonId);
      setIsCompleted(true);
      toast.success('🎉 เรียนจบบทเรียนนี้แล้ว!');
    } catch {
      toast.error('ไม่สามารถบันทึกความคืบหน้าได้');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  if (error || !lesson) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertCircle size={64} className="text-error" />
      <p className="font-semibold text-text-primary">{error || 'ไม่พบบทเรียน'}</p>
      <button onClick={loadLesson} className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold">ลองอีกครั้ง</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-separator px-4 py-3 flex items-center gap-3 sticky top-0 z-10 pt-safe">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="flex-1 text-[16px] font-bold text-text-primary truncate">{lesson.title}</h1>
        {isCompleted && <CheckCircle size={24} className="text-[#10B981] shrink-0" />}
      </header>

      <div className="max-w-lg mx-auto pb-10">
        {/* Video content */}
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
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <PlayCircle size={36} className="text-white" />
                </div>
                <p className="text-white/70 text-sm">วิดีโอจะพร้อมใช้งานเร็วๆ นี้</p>
              </div>
            )}
          </div>
        )}

        {/* Audio content */}
        {lesson.content_type === 'audio' && (
          <div>
            <div className="bg-primary px-5 py-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <Headphones size={40} className="text-white" />
              </div>
              <h2 className="text-white font-bold text-[18px]">{lesson.title}</h2>
              <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full mt-2">Podcast Mode</span>
            </div>
            {lesson.audio_url ? (
              <div className="px-5 py-4">
                <audio controls className="w-full" src={lesson.audio_url}>
                  Your browser does not support audio.
                </audio>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-text-secondary gap-2">
                <Headphones size={40} className="text-text-tertiary" />
                <p className="text-sm">Audio กำลังสร้าง...</p>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Info card */}
          <div className="bg-ios-bg rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={18} className="text-primary" />
              <p className="text-[15px] font-bold text-text-primary">เกี่ยวกับบทเรียนนี้</p>
            </div>
            <p className="text-[14px] text-text-secondary leading-relaxed mb-3">{stripHtml(lesson.description)}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-text-secondary">
                {lesson.content_type === 'video' ? <PlayCircle size={16} /> : lesson.content_type === 'audio' ? <Headphones size={16} /> : <FileText size={16} />}
                <span className="text-[13px]">
                  {lesson.content_type === 'video' ? 'วิดีโอ' : lesson.content_type === 'audio' ? 'เสียง' : 'บทความ'}
                </span>
              </div>
              {lesson.duration_minutes > 0 && (
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Clock size={16} />
                  <span className="text-[13px]">{lesson.duration_minutes} นาที</span>
                </div>
              )}
            </div>
          </div>

          {/* Text/article content */}
          {lesson.content_type === 'text' && lesson.content && (
            <div className="bg-white rounded-2xl p-4 border border-separator">
              <p className="text-[15px] text-text-primary leading-[1.75] whitespace-pre-line">
                {stripHtml(lesson.content)}
              </p>
            </div>
          )}

          {/* Mark complete / completed badge */}
          {!isCompleted ? (
            <button
              onClick={markAsComplete}
              disabled={completing}
              className="w-full flex items-center justify-center gap-2 bg-[#10B981] text-white font-bold text-[16px] py-4 rounded-2xl shadow-[0_6px_14px_rgba(16,185,129,0.3)] disabled:opacity-65 hover:opacity-90 transition-opacity"
            >
              {completing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
              {completing ? 'กำลังบันทึก...' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-[#10B981]/10 rounded-2xl py-4">
              <CheckCircle size={24} className="text-[#10B981]" />
              <span className="text-[#10B981] font-bold text-[16px]">🎉 เรียนจบแล้ว</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

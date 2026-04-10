'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, PlayCircle, Headphones, FileText, Clock, Info, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { stripHtml } from '@shared/contentUtils';
import { NavHeader } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF', green: '#10B981' };

function LessonPageInner() {
  const router   = useRouter();
  const params   = useSearchParams();
  const lessonId  = params.get('id') ?? '';
  const courseId  = params.get('courseId') ?? '';
  const { user, updateProgress, getUserProgress } = useUser();

  const [lesson, setLesson]           = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting]   = useState(false);

  // Video-specific state: buttons only appear after video ends
  const [videoEnded, setVideoEnded]   = useState(false);
  const [nextLesson, setNextLesson]   = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (lessonId) loadLesson(); }, [lessonId]);

  useEffect(() => {
    if (user && courseId) {
      const progress = getUserProgress(courseId);
      setIsCompleted(progress?.completed_lessons?.includes(lessonId) || false);
    }
  }, [user, courseId, lessonId]);

  // Listen for Bunny.net (and generic) video-end postMessage events
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (
          d?.event === 'ended' || d?.type === 'ended' ||
          d?.action === 'playerended' || d?.name === 'ended'
        ) {
          setVideoEnded(true);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const loadLesson = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/lessons/${lessonId}`);
      const data = res.data;
      setLesson(data);

      // For non-video lessons the buttons are always available
      if (data.content_type !== 'video') {
        setVideoEnded(true);
      } else {
        // Timer fallback: unlock buttons after 90% of the stated duration
        // so the page still works even if postMessage never fires
        const mins = Number(data.duration_minutes) || 0;
        if (mins > 0) {
          const ms = mins * 60 * 1000 * 0.9;
          timerRef.current = setTimeout(() => setVideoEnded(true), ms);
        }
        // No duration? Unlock after 60 s as a last resort
        else {
          timerRef.current = setTimeout(() => setVideoEnded(true), 60_000);
        }
      }

      // Load the module's lesson list to find the next lesson
      if (data.module_id) {
        try {
          const modRes = await axios.get(`${API_URL}/api/lessons/module/${data.module_id}`);
          const list: any[] = modRes.data || [];
          const idx = list.findIndex((l: any) => l._id === lessonId);
          if (idx >= 0 && idx < list.length - 1) setNextLesson(list[idx + 1]);
        } catch {}
      }
    } catch { setError('ไม่สามารถโหลดบทเรียนได้'); }
    finally   { setLoading(false); }
  };

  // Clean up the fallback timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

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

  const markAndNext = async () => {
    if (!isCompleted) await markAsComplete();
    if (nextLesson) {
      router.push(`/lesson?id=${nextLesson._id}&courseId=${courseId}`);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color={C.brand} className="animate-spin" />
    </div>
  );

  if (error || !lesson) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', textAlign: 'center' }}>
      <AlertCircle size={64} color="#EF4444" />
      <p style={{ fontWeight: 600, color: C.ink }}>{error || 'ไม่พบบทเรียน'}</p>
      <button onClick={loadLesson} style={{ backgroundColor: C.brand, color: '#fff', padding: '12px 24px', borderRadius: 16, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
        ลองอีกครั้ง
      </button>
    </div>
  );

  const isVideo = lesson.content_type === 'video';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.surface }}>
      <NavHeader
        title={lesson.title}
        right={isCompleted ? <CheckCircle size={22} color={C.green} /> : undefined}
      />

      <div style={{ maxWidth: 512, margin: '0 auto', paddingBottom: 40 }}>

        {/* Video */}
        {isVideo && (
          <div style={{ width: '100%', backgroundColor: '#000', aspectRatio: '16/9' }}>
            {lesson.video_url ? (
              <iframe
                src={lesson.video_url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#111' }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlayCircle size={36} color="#fff" />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>วิดีโอจะพร้อมใช้งานเร็วๆ นี้</p>
              </div>
            )}
          </div>
        )}

        {/* Audio */}
        {lesson.content_type === 'audio' && (
          <div>
            <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', backgroundColor: C.brand }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Headphones size={40} color="#fff" />
              </div>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{lesson.title}</h2>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.20)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999 }}>Podcast Mode</span>
            </div>
            {lesson.audio_url ? (
              <div style={{ padding: '16px 20px' }}>
                <audio controls style={{ width: '100%' }} src={lesson.audio_url}>Your browser does not support audio.</audio>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 8, color: C.ink2 }}>
                <Headphones size={40} color={C.ink3} />
                <p style={{ fontSize: 14 }}>Audio กำลังสร้าง...</p>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Info card */}
          <div style={{ backgroundColor: C.bg, borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Info size={18} color={C.brand} />
              <p style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>เกี่ยวกับบทเรียนนี้</p>
            </div>
            <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.65, marginBottom: 12 }}>{stripHtml(lesson.description)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.ink2 }}>
                {lesson.content_type === 'video' ? <PlayCircle size={16} color={C.ink2} /> : lesson.content_type === 'audio' ? <Headphones size={16} color={C.ink2} /> : <FileText size={16} color={C.ink2} />}
                <span style={{ fontSize: 13, color: C.ink2 }}>
                  {lesson.content_type === 'video' ? 'วิดีโอ' : lesson.content_type === 'audio' ? 'เสียง' : 'บทความ'}
                </span>
              </div>
              {lesson.duration_minutes > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} color={C.ink2} />
                  <span style={{ fontSize: 13, color: C.ink2 }}>{lesson.duration_minutes} นาที</span>
                </div>
              )}
            </div>
          </div>

          {/* Text content */}
          {lesson.content_type === 'text' && lesson.content && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 15, color: C.ink, lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                {stripHtml(lesson.content)}
              </p>
            </div>
          )}

          {/* ── Action buttons ───────────────────────────────────── */}

          {isCompleted ? (
            /* Already completed — show status + optional next */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.10)', borderRadius: 16, padding: '16px 0' }}>
                <CheckCircle size={24} color={C.green} />
                <span style={{ color: C.green, fontWeight: 700, fontSize: 16 }}>เรียนจบแล้ว</span>
              </div>
              {nextLesson && (
                <button
                  onClick={() => router.push(`/lesson?id=${nextLesson._id}&courseId=${courseId}`)}
                  style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', boxShadow: '0px 6px 14px rgba(239,94,168,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  บทเรียนถัดไป <ChevronRight size={20} />
                </button>
              )}
            </div>
          ) : videoEnded ? (
            /* Video finished (or non-video) — show action buttons */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={markAsComplete}
                disabled={completing}
                style={{ width: '100%', backgroundColor: C.green, color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px 0', borderRadius: 16, border: 'none', cursor: completing ? 'not-allowed' : 'pointer', opacity: completing ? 0.6 : 1, boxShadow: '0px 6px 14px rgba(16,185,129,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {completing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} color="#fff" />}
                {completing ? 'กำลังบันทึก...' : 'ทำเครื่องหมายว่าเสร็จแล้ว'}
              </button>
              {nextLesson && (
                <button
                  onClick={markAndNext}
                  disabled={completing}
                  style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px 0', borderRadius: 16, border: 'none', cursor: completing ? 'not-allowed' : 'pointer', boxShadow: '0px 6px 14px rgba(239,94,168,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  บทเรียนถัดไป <ChevronRight size={20} />
                </button>
              )}
            </div>
          ) : (
            /* Video still playing — placeholder + manual unlock */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, backgroundColor: C.bg, borderRadius: 16, padding: '20px 16px' }}>
                <PlayCircle size={28} color={C.ink3} />
                <p style={{ fontSize: 14, color: C.ink2, fontWeight: 600, margin: 0 }}>ดูวิดีโอจนจบเพื่อทำเครื่องหมายว่าเสร็จแล้ว</p>
                <p style={{ fontSize: 12, color: C.ink3, margin: 0 }}>ปุ่มจะปรากฏอัตโนมัติเมื่อวิดีโอเล่นจบ</p>
              </div>
              {/* Manual fallback — always available in case auto-detect doesn't fire */}
              <button
                onClick={() => setVideoEnded(true)}
                style={{ width: '100%', backgroundColor: 'transparent', color: C.ink2, fontWeight: 600,
                         fontSize: 14, padding: '12px 0', borderRadius: 16, cursor: 'pointer',
                         border: '1.5px solid rgba(0,0,0,0.08)' }}
              >
                ฉันดูจบแล้ว →
              </button>
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

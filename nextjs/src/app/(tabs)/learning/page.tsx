'use client';

import { useState, useEffect } from 'react';
import { PlayCircle, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { PrimaryBtn, Skel, EmptyState, ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const PATH_META: Record<string, { emoji: string; color: string; bg: string }> = {
  'UX Design':          { emoji: '🎨', color: '#6366F1', bg: '#EEF2FF' },
  'Data Analysis':      { emoji: '📊', color: '#10B981', bg: '#ECFDF5' },
  'Digital Marketing':  { emoji: '📣', color: '#F59E0B', bg: '#FFFBEB' },
  'Project Management': { emoji: '📋', color: '#e8409b', bg: '#fce7f3' },
  'Learning Designer':  { emoji: '🎓', color: '#8B5CF6', bg: '#F5F3FF' },
  'QA Tester':          { emoji: '🐛', color: '#D946EF', bg: '#FDF4FF' },
};

function pathMeta(careerPath?: string) {
  if (!careerPath) return { emoji: '📚', color: '#6366F1', bg: '#EEF2FF' };
  for (const [key, val] of Object.entries(PATH_META)) {
    if (careerPath.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return { emoji: '📚', color: '#6366F1', bg: '#EEF2FF' };
}

export default function LearningPage() {
  const { user } = useUser();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadEnrolledCourses();
    else setLoading(false);
  }, [user]);

  const loadEnrolledCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/courses`);
      const all = Array.isArray(res.data) ? res.data : [];
      setEnrolledCourses(all.filter((c: any) => user?.progress?.[c._id]));
    } catch {
      setEnrolledCourses([]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Unauthenticated ────────────────────────────── */
  if (!user) {
    return (
      <div className="min-h-screen bg-bg">
        {/* Gradient hero */}
        <div
          className="header-shell px-4 pb-8 flex flex-col items-center text-center"
          style={{ background: 'linear-gradient(160deg, #818cf8 0%, #6366f1 55%, #4f46e5 100%)', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)' }}
        >
          <div className="w-[72px] h-[72px] rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center mb-4">
            <PlayCircle size={34} className="text-white" />
          </div>
          <h1 className="text-[22px] font-extrabold text-white mb-1">คอร์สเรียนของฉัน</h1>
          <p className="text-white/70 text-[13px]">ติดตามความคืบหน้าและเรียนต่อได้เลย</p>
        </div>

        <div className="max-w-lg mx-auto px-5 py-8 flex flex-col items-center text-center gap-5">
          <div className="bg-surface rounded-3xl p-7 w-full" style={{ boxShadow: '0 2px 24px rgba(99,102,241,0.12), 0 1px 0 #e8e8f0' }}>
            <p className="text-[16px] font-bold text-ink mb-2">เริ่มต้นการเรียนรู้</p>
            <p className="text-[14px] text-ink-2 leading-relaxed mb-6">
              เข้าสู่ระบบเพื่อบันทึกความคืบหน้า<br/>ติดตามคอร์ส และรับใบประกาศนียบัตร
            </p>
            <PrimaryBtn href="/auth">เข้าสู่ระบบ</PrimaryBtn>
          </div>
        </div>
      </div>
    );
  }

  /* ── Totals for hero ─────────────────────────────────── */
  const totalCompleted = enrolledCourses.reduce((sum, c) => {
    const p = user?.progress?.[c._id];
    return sum + (p?.completed_lessons?.length ?? 0);
  }, 0);
  const totalLessons = enrolledCourses.reduce((sum, c) => sum + (c.total_lessons ?? 0), 0);
  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg">
      {/* ── Gradient hero ───────────────────────────────────── */}
      <div
        className="header-shell px-4 pb-8"
        style={{ background: 'linear-gradient(160deg, #818cf8 0%, #6366f1 55%, #4f46e5 100%)', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 18px)' }}
      >
        <h1 className="text-[22px] font-extrabold text-white mb-4">คอร์สเรียนของฉัน</h1>

        {/* Stat pills */}
        <div className="flex gap-2 flex-wrap">
          {[
            { icon: '📚', val: enrolledCourses.length, label: 'คอร์ส' },
            { icon: '✅', val: totalCompleted,          label: 'บทเรียน' },
            { icon: '📈', val: `${overallPct}%`,        label: 'รวม' },
          ].map((s, i) => (
            <div key={i}
                 className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                 style={{ background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span className="text-[14px]">{s.icon}</span>
              <span className="text-[14px] font-bold text-white">{s.val}</span>
              <span className="text-[11px] text-white/65">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-2xl p-4 flex gap-3" style={{ boxShadow: '0 1px 0 #e8e8f0, 0 4px 16px rgba(0,0,0,0.06)' }}>
                <Skel className="w-[60px] h-[60px] shrink-0 rounded-xl" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skel className="h-3.5 w-3/4 rounded-lg" />
                  <Skel className="h-2 w-full rounded-full" />
                  <Skel className="h-2 w-1/3 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Sparkles}
              title="ยังไม่มีคอร์สที่กำลังเรียน"
              body="เริ่มเรียนคอร์สแรกของคุณได้เลย สำรวจคอร์สที่เหมาะกับเป้าหมายของคุณ"
              action={<PrimaryBtn href="/explore">สำรวจคอร์ส</PrimaryBtn>}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-bold text-ink-3 uppercase tracking-wider mb-1">
              กำลังเรียน {enrolledCourses.length} คอร์ส
            </p>
            {enrolledCourses.map((course: any) => {
              const progress   = user?.progress?.[course._id];
              const completed  = progress?.completed_lessons?.length ?? 0;
              const total      = course.total_lessons ?? 1;
              const pct        = Math.round((completed / total) * 100);
              const meta       = pathMeta(course.career_path);

              return (
                <Link
                  key={course._id}
                  href={`/course-detail?id=${course._id}`}
                  className="bg-surface rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
                  style={{ boxShadow: '0 1px 0 #e8e8f0, 0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #e8e8f0' }}
                >
                  {/* Emoji thumbnail */}
                  <div
                    className="w-[60px] h-[60px] rounded-xl flex items-center justify-center text-[28px] shrink-0"
                    style={{ backgroundColor: meta.bg }}
                  >
                    {meta.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-ink line-clamp-2 mb-2 leading-snug">{course.title}</p>
                    <ProgressBar pct={pct} className="mb-1.5" />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-ink-3">{completed}/{total} บทเรียน</p>
                      <p className="text-[12px] font-bold" style={{ color: meta.color }}>{pct}%</p>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-ink-3 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

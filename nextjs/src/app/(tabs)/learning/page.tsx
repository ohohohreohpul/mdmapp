'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { PrimaryBtn, Skel, EmptyState, ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const C = {
  primary:  '#ef5ea8',
  bg:       '#F2F2F7',
  surface:  '#FFFFFF',
  ink:      '#1C1C1E',
  ink2:     '#8E8E93',
  ink3:     '#C7C7CC',
  card:     { boxShadow: '0px 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)' },
};

const PATH_META: Record<string, { emoji: string; color: string; bg: string }> = {
  'UX Design':         { emoji: '🎨', color: '#6366F1', bg: '#EEF2FF' },
  'Data Analysis':     { emoji: '📊', color: '#10B981', bg: '#ECFDF5' },
  'Digital Marketing': { emoji: '📣', color: '#F59E0B', bg: '#FFFBEB' },
  'Project Management':{ emoji: '📋', color: '#ef5ea8', bg: '#FFF0F7' },
  'Learning Designer': { emoji: '🎓', color: '#8B5CF6', bg: '#F5F3FF' },
  'QA Tester':         { emoji: '🐛', color: '#D946EF', bg: '#FDF4FF' },
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
    } catch { setEnrolledCourses([]); } finally { setLoading(false); }
  };

  const Header = () => (
    <div
      className="sticky top-0 z-20 header-shell"
      style={{ background: 'rgba(242,242,247,0.85)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.10)' }}
    >
      <div className="flex items-center px-6 h-[54px] max-w-lg mx-auto">
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>คอร์สเรียนของฉัน</h1>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <Header />
      <div className="max-w-lg mx-auto flex flex-col items-center text-center px-6 py-16 gap-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,94,168,0.10)' }}>
          <span className="text-[40px]">📚</span>
        </div>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }} className="mb-2">เข้าสู่ระบบ</h2>
          <p style={{ fontSize: '15px', color: C.ink2, lineHeight: '1.55' }}>
            บันทึกความคืบหน้า ติดตามคอร์ส<br/>และรับใบประกาศนียบัตรได้เลย
          </p>
        </div>
        <PrimaryBtn href="/auth">เข้าสู่ระบบ</PrimaryBtn>
      </div>
    </div>
  );

  const totalCompleted = enrolledCourses.reduce((sum, c) => sum + (user?.progress?.[c._id]?.completed_lessons?.length ?? 0), 0);
  const totalLessons   = enrolledCourses.reduce((sum, c) => sum + (c.total_lessons ?? 0), 0);
  const overallPct     = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
      <Header />

      <div className="max-w-lg mx-auto px-6 py-5">

        {/* Summary strip */}
        {enrolledCourses.length > 0 && !loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { val: enrolledCourses.length, label: 'คอร์ส', emoji: '📚' },
              { val: totalCompleted,         label: 'บทเรียน', emoji: '✅' },
              { val: `${overallPct}%`,        label: 'รวม', emoji: '📈' },
            ].map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center py-4 rounded-[20px]"
                style={{ backgroundColor: C.surface, ...C.card }}
              >
                <span className="text-[22px]">{s.emoji}</span>
                <p className="text-[18px] font-bold mt-1" style={{ color: C.ink }}>{s.val}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.ink3 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-[20px] p-4 flex gap-3" style={{ backgroundColor: C.surface, ...C.card }}>
                <Skel className="w-[60px] h-[60px] shrink-0 rounded-[14px]" />
                <div className="flex-1 flex flex-col gap-2.5">
                  <Skel className="h-3.5 w-3/4 rounded-lg" />
                  <Skel className="h-2 w-full rounded-full" />
                  <Skel className="h-2 w-1/3 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : enrolledCourses.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="ยังไม่มีคอร์สที่กำลังเรียน"
            body="เริ่มเรียนคอร์สแรกของคุณได้เลย"
            action={<PrimaryBtn href="/explore">สำรวจคอร์ส</PrimaryBtn>}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-bold uppercase tracking-widest mb-1" style={{ color: C.ink3 }}>
              กำลังเรียน {enrolledCourses.length} คอร์ส
            </p>
            {enrolledCourses.map((course: any) => {
              const progress  = user?.progress?.[course._id];
              const completed = progress?.completed_lessons?.length ?? 0;
              const total     = course.total_lessons ?? 1;
              const pct       = Math.round((completed / total) * 100);
              const meta      = pathMeta(course.career_path);

              return (
                <Link
                  key={course._id}
                  href={`/course-detail?id=${course._id}`}
                  className="rounded-[20px] p-4 flex items-center gap-3 active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: C.surface, ...C.card }}
                >
                  <div className="w-[60px] h-[60px] rounded-[14px] flex items-center justify-center text-[28px] shrink-0" style={{ backgroundColor: meta.bg }}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold line-clamp-2 mb-2 leading-snug" style={{ color: C.ink }}>{course.title}</p>
                    <ProgressBar pct={pct} className="mb-1.5" />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px]" style={{ color: C.ink3 }}>{completed}/{total} บทเรียน</p>
                      <p className="text-[12px] font-bold" style={{ color: meta.color }}>{pct}%</p>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: C.ink3 }} className="shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

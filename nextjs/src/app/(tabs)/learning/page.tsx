'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { PrimaryBtn, Skel, ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const C = {
  primary: '#ef5ea8',
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

const PATH_META: Record<string, { emoji: string; color: string; bg: string }> = {
  'UX Design':          { emoji: '🎨', color: '#6366F1', bg: '#EEF2FF' },
  'Data Analysis':      { emoji: '📊', color: '#10B981', bg: '#ECFDF5' },
  'Digital Marketing':  { emoji: '📣', color: '#F59E0B', bg: '#FFFBEB' },
  'Project Management': { emoji: '📋', color: '#ef5ea8', bg: '#FFF0F7' },
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

const GlassHeader = () => (
  <div
    className="sticky top-0 z-20 header-shell"
    style={{
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
    }}
  >
    <div
      className="flex items-center max-w-lg mx-auto"
      style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
        คอร์สเรียนของฉัน
      </h1>
    </div>
  </div>
);

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

  if (!user) return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      <GlassHeader />
      <div
        className="max-w-lg mx-auto flex flex-col items-center text-center"
        style={{ padding: '64px 20px', gap: 20 }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 88, height: 88, backgroundColor: 'rgba(239,94,168,0.10)', fontSize: 36 }}
        >
          📚
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 8 }}>เข้าสู่ระบบ</h2>
          <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.55 }}>
            บันทึกความคืบหน้า ติดตามคอร์ส<br />และรับใบประกาศนียบัตรได้เลย
          </p>
        </div>
        <PrimaryBtn href="/auth">เข้าสู่ระบบ</PrimaryBtn>
      </div>
    </div>
  );

  const totalCompleted = enrolledCourses.reduce(
    (sum, c) => sum + (user?.progress?.[c._id]?.completed_lessons?.length ?? 0), 0
  );
  const totalLessons = enrolledCourses.reduce((sum, c) => sum + (c.total_lessons ?? 0), 0);
  const overallPct   = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      <GlassHeader />

      <div className="max-w-lg mx-auto flex flex-col" style={{ padding: '20px 20px 0', gap: 20 }}>

        {/* Stats — one card, 3 columns */}
        {enrolledCourses.length > 0 && !loading && (
          <div style={{ ...cardStyle, display: 'flex', overflow: 'hidden' }}>
            {[
              { emoji: '📚', val: enrolledCourses.length, label: 'คอร์ส' },
              { emoji: '✅', val: totalCompleted,          label: 'บทเรียน' },
              { emoji: '📈', val: `${overallPct}%`,         label: 'ภาพรวม' },
            ].map((s, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center"
                style={{
                  padding: '16px 0',
                  borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 4, lineHeight: 1 }}>{s.val}</span>
                <span style={{ fontSize: 11, color: C.ink3, marginTop: 3 }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Course list */}
        <div style={{ paddingBottom: 24 }}>
          {loading ? (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex" style={{ ...cardStyle, padding: 14, gap: 12 }}>
                  <Skel style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 12 }} />
                  <div className="flex-1 flex flex-col" style={{ gap: 8 }}>
                    <Skel style={{ height: 14, width: '70%', borderRadius: 7 }} />
                    <Skel style={{ height: 6, width: '100%', borderRadius: 3 }} />
                    <Skel style={{ height: 11, width: '30%', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="flex flex-col items-center" style={{ paddingTop: 64, gap: 16 }}>
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 80, height: 80, backgroundColor: 'rgba(239,94,168,0.10)' }}
              >
                <Sparkles size={32} style={{ color: C.primary }} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                  ยังไม่มีคอร์สที่กำลังเรียน
                </p>
                <p style={{ fontSize: 14, color: C.ink2 }}>เริ่มเรียนคอร์สแรกของคุณได้เลย</p>
              </div>
              <PrimaryBtn href="/explore">สำรวจคอร์ส</PrimaryBtn>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 14, color: C.ink2, fontWeight: 500, marginBottom: 12 }}>
                กำลังเรียน {enrolledCourses.length} คอร์ส
              </p>
              <div className="flex flex-col" style={{ gap: 10 }}>
                {enrolledCourses.map((course: any) => {
                  const progress  = user?.progress?.[course._id];
                  const completed = progress?.completed_lessons?.length ?? 0;
                  const total     = (course.total_lessons || 0) > 0 ? course.total_lessons : 1;
                  const pct       = Math.round((completed / total) * 100);
                  const meta      = pathMeta(course.career_path);
                  return (
                    <Link
                      key={course._id}
                      href={`/course-detail?id=${course._id}`}
                      className="active:scale-[0.97] transition-transform"
                      style={{ ...cardStyle, display: 'flex', alignItems: 'center', padding: 14, gap: 12 }}
                    >
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 56, height: 56,
                          borderRadius: 12,
                          backgroundColor: meta.bg,
                          flexShrink: 0, fontSize: 26,
                        }}
                      >
                        {meta.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="line-clamp-2" style={{ fontSize: 14, fontWeight: 600, color: C.ink, lineHeight: 1.35, marginBottom: 8 }}>
                          {course.title}
                        </p>
                        <ProgressBar pct={pct} />
                        <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
                          <p style={{ fontSize: 11, color: C.ink3 }}>{completed}/{course.total_lessons ?? 0} บทเรียน</p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{pct}%</p>
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: C.ink3, flexShrink: 0 }} />
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

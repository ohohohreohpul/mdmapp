'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { School, CheckCircle2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Spinner, EmptyState, PrimaryBtn, ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function MyCoursesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [user?._id]);

  const load = async () => {
    if (!user?._id) { setLoading(false); return; }
    try {
      const res = await axios.get(`${API_URL}/api/courses`, { params: { user_id: user._id, enrolled: true } });
      const all: any[] = res.data || [];
      const withProgress = all.map(c => {
        const prog      = user.progress?.[c._id];
        const total     = c.total_lessons || 0;
        const completed = prog ? Object.values(prog).filter(Boolean).length : 0;
        return { ...c, completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
      });
      setCourses(withProgress);
    } catch { setCourses([]); }
    finally   { setLoading(false); }
  };

  const completedCount = courses.filter(c => c.pct === 100).length;
  const totalLessons   = courses.reduce((sum, c) => sum + (c.completed || 0), 0);

  if (!user) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
      <School size={48} className="text-ink-3" />
      <p className="font-bold text-ink">กรุณาเข้าสู่ระบบ</p>
      <PrimaryBtn href="/auth">เข้าสู่ระบบ</PrimaryBtn>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      <NavHeader title="คอร์สของฉัน" />

      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: courses.length, label: 'กำลังเรียน' },
                { value: completedCount, label: 'เรียนจบ' },
                { value: totalLessons,   label: 'บทเรียน' },
              ].map((s, i) => (
                <div key={i} className="bg-surface rounded-2xl p-4 flex flex-col items-center card-shadow">
                  <p className="text-[26px] font-extrabold text-brand">{s.value}</p>
                  <p className="text-[12px] text-ink-2 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {courses.length === 0 ? (
              <EmptyState icon={School} title="ยังไม่มีคอร์สที่ลงทะเบียน"
                action={<PrimaryBtn href="/explore">สำรวจคอร์ส</PrimaryBtn>} />
            ) : (
              <>
                <p className="text-[14px] font-bold text-ink mb-3">กำลังเรียน</p>
                <div className="flex flex-col gap-3">
                  {courses.map(course => (
                    <button
                      key={course._id}
                      onClick={() => router.push(`/course-detail?id=${course._id}`)}
                      className="bg-surface rounded-2xl p-4 flex items-center gap-3 text-left card-shadow active:scale-[0.98] transition-transform"
                    >
                      <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center shrink-0">
                        <School size={22} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-ink truncate">{course.title}</p>
                        <p className="text-[12px] text-ink-3 mb-2">{course.completed}/{course.total} บทเรียน</p>
                        <ProgressBar pct={course.pct} />
                        <p className="text-[11px] text-brand font-semibold mt-1">{course.pct}% เสร็จแล้ว</p>
                      </div>
                      {course.pct === 100 && <CheckCircle2 size={24} className="text-[#10B981] shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

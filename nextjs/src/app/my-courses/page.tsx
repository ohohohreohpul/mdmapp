'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, School, CheckCircle2, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function MyCoursesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [user?._id]);

  const load = async () => {
    if (!user?._id) { setLoading(false); return; }
    try {
      const res = await axios.get(`${API_URL}/api/courses`, {
        params: { user_id: user._id, enrolled: true },
      });
      const all: any[] = res.data || [];

      // Attach progress from user context
      const withProgress = all.map(c => {
        const prog = user.progress?.[c._id];
        const total = c.total_lessons || 0;
        const completed = prog ? Object.values(prog).filter(Boolean).length : 0;
        return { ...c, completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
      });

      setCourses(withProgress);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = courses.filter(c => c.pct === 100).length;
  const totalLessons = courses.reduce((sum, c) => sum + (c.completed || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
        <School size={48} className="text-text-tertiary" />
        <p className="font-bold text-text-primary">กรุณาเข้าสู่ระบบ</p>
        <button onClick={() => router.push('/auth')} className="bg-primary text-white font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity">
          เข้าสู่ระบบ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator sticky top-0 z-10 header-safe">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ios-bg transition-colors">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="text-[17px] font-bold text-text-primary">คอร์สของฉัน</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: courses.length, label: 'กำลังเรียน' },
                { value: completedCount, label: 'เรียนจบ' },
                { value: totalLessons, label: 'บทเรียน' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-separator p-4 flex flex-col items-center">
                  <p className="text-[26px] font-extrabold text-primary">{s.value}</p>
                  <p className="text-[12px] text-text-secondary mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {courses.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-4 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <School size={36} className="text-primary" />
                </div>
                <p className="font-bold text-text-primary">ยังไม่มีคอร์สที่ลงทะเบียน</p>
                <button onClick={() => router.push('/explore')} className="bg-primary text-white font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity">
                  สำรวจคอร์ส
                </button>
              </div>
            ) : (
              <>
                <p className="text-[14px] font-semibold text-text-primary mb-3">กำลังเรียน</p>
                <div className="flex flex-col gap-3">
                  {courses.map(course => (
                    <button
                      key={course._id}
                      onClick={() => router.push(`/course-detail?id=${course._id}`)}
                      className="bg-white rounded-2xl border border-separator p-4 flex items-center gap-3 text-left hover:border-primary/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        <School size={22} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-text-primary truncate">{course.title}</p>
                        <p className="text-[12px] text-text-tertiary mb-2">{course.completed}/{course.total} บทเรียน</p>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${course.pct}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-primary font-semibold mt-1">{course.pct}% เสร็จแล้ว</p>
                      </div>
                      {course.pct === 100 && (
                        <CheckCircle2 size={24} className="text-[#10B981] shrink-0" />
                      )}
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

'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, PlayCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function LearningPage() {
  const { user } = useUser();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  // ── Guest ────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-ios-bg">
        <PageHeader title="คอร์สเรียนของฉัน" />
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
          <div
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5"
            style={{ animation: mounted ? 'fadeScaleIn 0.4s ease-out forwards' : 'none' }}
          >
            <BookOpen size={36} className="text-primary" />
          </div>
          <h2 className="text-[20px] font-bold text-text-primary mb-2">เข้าสู่ระบบเพื่อเรียน</h2>
          <p className="text-[14px] text-text-secondary leading-relaxed mb-6">
            บันทึกความคืบหน้า ติดตามคอร์สของคุณ<br/>และรับใบประกาศนียบัตรได้เลย
          </p>
          <Link
            href="/auth"
            className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg">
      <PageHeader title="คอร์สเรียนของฉัน" />

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          // Skeleton loader
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-separator/60 flex items-center gap-3 shadow-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0 animate-pulse" />
                <div className="flex-1 gap-2 flex flex-col">
                  <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-3/4" />
                  <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
                  <div className="h-2 bg-gray-100 rounded-full animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div
            className="flex flex-col items-center text-center py-16 px-4 gap-4"
            style={{ animation: mounted ? 'slideUpFade 0.4s ease-out forwards' : 'none' }}
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles size={36} className="text-primary" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-text-primary mb-1">ยังไม่มีคอร์สที่กำลังเรียน</h2>
              <p className="text-[13px] text-text-secondary">เริ่มเรียนคอร์สแรกของคุณได้เลย!</p>
            </div>
            <Link
              href="/explore"
              className="bg-primary text-white font-bold px-7 py-3 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm mt-1"
            >
              สำรวจคอร์ส
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-text-secondary">{enrolledCourses.length} คอร์สที่กำลังเรียน</p>
            {enrolledCourses.map((course: any, idx) => {
              const progress  = user?.progress?.[course._id];
              const completed = progress?.completed_lessons?.length ?? 0;
              const total     = course.total_lessons ?? 1;
              const pct       = Math.round((completed / total) * 100);
              return (
                <Link
                  key={course._id}
                  href={`/course-detail?id=${course._id}`}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-separator/60 hover:border-primary/30 active:scale-[0.98] transition-all shadow-sm"
                  style={{
                    animation: mounted ? `slideUpFade 0.35s ease-out ${idx * 0.06}s both` : 'none',
                    opacity: 0,
                  }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <PlayCircle size={24} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-text-primary line-clamp-2 mb-1.5">{course.title}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-text-secondary shrink-0">{pct}%</span>
                    </div>
                    <p className="text-[11px] text-text-tertiary mt-0.5">{completed}/{total} บทเรียน</p>
                  </div>
                  <ChevronRight size={18} className="text-text-tertiary shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <div
      className="bg-white border-b border-separator sticky top-0 z-10"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-lg mx-auto px-4 py-3.5">
        <h1 className="text-[22px] font-extrabold text-text-primary">{title}</h1>
      </div>
    </div>
  );
}

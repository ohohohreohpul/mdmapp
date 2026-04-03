'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ChevronRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function LearningPage() {
  const router = useRouter();
  const { user } = useUser();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEnrolledCourses();
    } else {
      setLoading(false);
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-ios-bg">
        <header className="bg-white border-b border-separator px-5 pt-safe">
          <div className="py-4"><h1 className="text-[22px] font-extrabold text-text-primary">คอร์สเรียนของฉัน</h1></div>
        </header>
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-5">
            <BookOpen size={40} className="text-white" />
          </div>
          <h2 className="text-[20px] font-bold text-text-primary mb-2">เข้าสู่ระบบเพื่อเรียน</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            เข้าสู่ระบบเพื่อติดตามความคืบหน้าและบันทึกคอร์สของคุณ
          </p>
          <Link href="/auth" className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:opacity-90 transition-opacity">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-5 pt-safe">
        <div className="py-4"><h1 className="text-[22px] font-extrabold text-text-primary">คอร์สเรียนของฉัน</h1></div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 px-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={32} className="text-primary" />
            </div>
            <h2 className="text-[18px] font-bold text-text-primary mb-2">ยังไม่มีคอร์สที่กำลังเรียน</h2>
            <p className="text-sm text-text-secondary mb-5">เริ่มเรียนคอร์สแรกของคุณได้เลย!</p>
            <Link href="/explore" className="bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity">
              สำรวจคอร์ส
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary mb-1">{enrolledCourses.length} คอร์สที่กำลังเรียน</p>
            {enrolledCourses.map((course: any) => {
              const progress = user?.progress?.[course._id];
              const completed = progress?.completed_lessons?.length ?? 0;
              const total = course.total_lessons ?? 1;
              const pct = Math.round((completed / total) * 100);
              return (
                <Link
                  key={course._id}
                  href={`/course-detail?id=${course._id}`}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-separator hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <PlayCircle size={24} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-text-primary line-clamp-2 mb-1">{course.title}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] text-text-secondary shrink-0">{pct}%</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-0.5">{completed}/{total} บทเรียน</p>
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

'use client';

import { useState, useEffect } from 'react';
import { PlayCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { TabHeader, PrimaryBtn, Skel, EmptyState, ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

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

  if (!user) {
    return (
      <div className="min-h-screen bg-bg">
        <TabHeader title="คอร์สเรียนของฉัน" />
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
          <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-5">
            <PlayCircle size={36} className="text-brand" />
          </div>
          <h2 className="text-[20px] font-bold text-ink mb-2">เข้าสู่ระบบเพื่อเรียน</h2>
          <p className="text-[14px] text-ink-2 leading-relaxed mb-6">
            บันทึกความคืบหน้า ติดตามคอร์สของคุณ<br/>และรับใบประกาศนียบัตรได้เลย
          </p>
          <PrimaryBtn href="/auth">เข้าสู่ระบบ</PrimaryBtn>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <TabHeader title="คอร์สเรียนของฉัน" />

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-2xl p-4 card-shadow flex gap-3">
                <Skel className="w-12 h-12 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skel className="h-3.5 w-3/4" />
                  <Skel className="h-2 w-full" />
                  <Skel className="h-2 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : enrolledCourses.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="ยังไม่มีคอร์สที่กำลังเรียน"
            body="เริ่มเรียนคอร์สแรกของคุณได้เลย!"
            action={<PrimaryBtn href="/explore">สำรวจคอร์ส</PrimaryBtn>}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-ink-3">{enrolledCourses.length} คอร์สที่กำลังเรียน</p>
            {enrolledCourses.map((course: any) => {
              const progress  = user?.progress?.[course._id];
              const completed = progress?.completed_lessons?.length ?? 0;
              const total     = course.total_lessons ?? 1;
              const pct       = Math.round((completed / total) * 100);
              return (
                <Link
                  key={course._id}
                  href={`/course-detail?id=${course._id}`}
                  className="bg-surface rounded-2xl p-4 flex items-center gap-3 card-shadow active:scale-[0.98] transition-transform"
                >
                  <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center shrink-0">
                    <PlayCircle size={24} className="text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-ink line-clamp-2 mb-1.5">{course.title}</p>
                    <ProgressBar pct={pct} className="mb-1" />
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-ink-3">{completed}/{total} บทเรียน</p>
                      <p className="text-[11px] font-semibold text-brand">{pct}%</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

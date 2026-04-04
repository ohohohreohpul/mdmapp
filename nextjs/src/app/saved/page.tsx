'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkX, School } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Spinner, EmptyState, PrimaryBtn } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function SavedPage() {
  const router = useRouter();
  const { user } = useUser();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSaved(); }, [user?._id]);

  const loadSaved = async () => {
    try {
      if (user?._id) {
        const res = await axios.get(`${API_URL}/api/courses/saved`, { params: { user_id: user._id } });
        setCourses(res.data || []);
      } else {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('saved_courses') : null;
        setCourses(raw ? JSON.parse(raw) : []);
      }
    } catch { setCourses([]); }
    finally   { setLoading(false); }
  };

  const unsave = async (courseId: string) => {
    setCourses(prev => prev.filter(c => (c._id || c.id) !== courseId));
    try {
      if (user?._id) {
        await axios.delete(`${API_URL}/api/courses/${courseId}/save`, { data: { user_id: user._id } });
      } else {
        const updated = courses.filter(c => (c._id || c.id) !== courseId);
        localStorage.setItem('saved_courses', JSON.stringify(updated));
      }
    } catch { loadSaved(); }
  };

  return (
    <div className="min-h-screen bg-bg">
      <NavHeader title="บันทึกไว้" />

      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        {loading ? (
          <Spinner />
        ) : courses.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="ยังไม่มีคอร์สที่บันทึกไว้"
            body="กดบุ๊กมาร์กบนหน้าคอร์สเพื่อบันทึก"
            action={<PrimaryBtn href="/explore">สำรวจคอร์ส</PrimaryBtn>}
          />
        ) : (
          <>
            <p className="text-[13px] text-ink-3 mb-4">{courses.length} คอร์สที่บันทึกไว้</p>
            <div className="flex flex-col gap-3">
              {courses.map((course) => {
                const id = course._id || course.id;
                return (
                  <div key={id} className="bg-surface rounded-2xl p-4 flex items-center gap-3 card-shadow">
                    <button
                      onClick={() => router.push(`/course-detail?id=${id}`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center shrink-0">
                        <School size={22} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-ink truncate">{course.title}</p>
                        {course.career_path && (
                          <p className="text-[13px] text-brand font-semibold">{course.career_path}</p>
                        )}
                        {course.total_lessons != null && (
                          <p className="text-[12px] text-ink-3">{course.total_lessons} บทเรียน</p>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => unsave(id)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg transition-colors shrink-0"
                    >
                      <BookmarkX size={20} className="text-brand" />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

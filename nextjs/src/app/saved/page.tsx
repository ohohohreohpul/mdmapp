'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, BookmarkX, School } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export default function SavedPage() {
  const router = useRouter();
  const { user } = useUser();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, [user?._id]);

  const loadSaved = async () => {
    try {
      if (user?._id) {
        const res = await axios.get(`${API_URL}/api/courses/saved`, {
          params: { user_id: user._id },
        });
        setCourses(res.data || []);
      } else {
        // Guest: load from localStorage
        const raw = typeof window !== 'undefined' ? localStorage.getItem('saved_courses') : null;
        setCourses(raw ? JSON.parse(raw) : []);
      }
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const unsave = async (courseId: string) => {
    setCourses(prev => prev.filter(c => (c._id || c.id) !== courseId));
    try {
      if (user?._id) {
        await axios.delete(`${API_URL}/api/courses/${courseId}/save`, {
          data: { user_id: user._id },
        });
      } else {
        const updated = courses.filter(c => (c._id || c.id) !== courseId);
        localStorage.setItem('saved_courses', JSON.stringify(updated));
      }
    } catch {
      // revert on failure
      loadSaved();
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="text-[17px] font-bold text-text-primary">บันทึกไว้</h1>
        <div className="w-11" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Bookmark size={36} className="text-primary" />
            </div>
            <p className="font-bold text-text-primary text-lg">ยังไม่มีคอร์สที่บันทึกไว้</p>
            <p className="text-sm text-text-secondary">กด <Bookmark size={13} className="inline" /> บนหน้าคอร์สเพื่อบันทึก</p>
            <button onClick={() => router.push('/explore')} className="mt-2 bg-primary text-white font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity">
              สำรวจคอร์ส
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-text-secondary mb-4">{courses.length} คอร์สที่บันทึกไว้</p>
            <div className="flex flex-col gap-3">
              {courses.map((course) => {
                const id = course._id || course.id;
                return (
                  <div key={id} className="bg-white rounded-2xl border border-separator p-4 flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/course-detail?id=${id}`)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        <School size={22} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-text-primary truncate">{course.title}</p>
                        {course.career_path && (
                          <p className="text-[13px] text-primary font-semibold">{course.career_path}</p>
                        )}
                        {course.total_lessons != null && (
                          <p className="text-[12px] text-text-tertiary">{course.total_lessons} บทเรียน</p>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => unsave(id)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors shrink-0"
                      title="ยกเลิกบันทึก"
                    >
                      <BookmarkX size={20} className="text-primary" />
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

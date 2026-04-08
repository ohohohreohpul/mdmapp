'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, BookmarkX, School } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Spinner, EmptyState, PrimaryBtn } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF' };
const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

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
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <NavHeader title="บันทึกไว้" />

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '20px 20px 80px' }}>
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
            <p style={{ fontSize: 13, color: C.ink3, marginBottom: 16 }}>{courses.length} คอร์สที่บันทึกไว้</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {courses.map((course) => {
                const id = course._id || course.id;
                return (
                  <div key={id} style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={() => router.push(`/course-detail?id=${id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textAlign: 'left', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <School size={22} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</p>
                        {course.career_path && <p style={{ fontSize: 13, color: C.brand, fontWeight: 600 }}>{course.career_path}</p>}
                        {course.total_lessons != null && <p style={{ fontSize: 12, color: C.ink3 }}>{course.total_lessons} บทเรียน</p>}
                      </div>
                    </button>
                    <button
                      onClick={() => unsave(id)}
                      style={{ width: 40, height: 40, borderRadius: 20, border: 'none', backgroundColor: 'rgba(239,94,168,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <BookmarkX size={20} color={C.brand} />
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { School, CheckCircle2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Spinner, EmptyState, PrimaryBtn, ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF', green: '#10B981' };
const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

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
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', textAlign: 'center' }}>
      <School size={48} color={C.ink3} />
      <p style={{ fontWeight: 700, color: C.ink }}>กรุณาเข้าสู่ระบบ</p>
      <PrimaryBtn href="/auth">เข้าสู่ระบบ</PrimaryBtn>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <NavHeader title="คอร์สของฉัน" />

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '20px 20px 80px' }}>
        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* Stats row — single card with dividers */}
            <div style={{ ...card, display: 'flex', overflow: 'hidden', marginBottom: 20 }}>
              {[
                { value: courses.length, label: 'กำลังเรียน' },
                { value: completedCount, label: 'เรียนจบ' },
                { value: totalLessons,   label: 'บทเรียน' },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px 0',
                  borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                }}>
                  <p style={{ fontSize: 26, fontWeight: 800, color: C.brand }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: C.ink2, marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {courses.length === 0 ? (
              <EmptyState icon={School} title="ยังไม่มีคอร์สที่ลงทะเบียน"
                action={<PrimaryBtn href="/explore">สำรวจคอร์ส</PrimaryBtn>} />
            ) : (
              <>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>กำลังเรียน</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {courses.map(course => (
                    <button
                      key={course._id}
                      onClick={() => router.push(`/course-detail?id=${course._id}`)}
                      style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', border: card.border, cursor: 'pointer', width: '100%' }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <School size={22} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{course.title}</p>
                        <p style={{ fontSize: 12, color: C.ink3, marginBottom: 6 }}>{course.completed}/{course.total} บทเรียน</p>
                        <ProgressBar pct={course.pct} />
                        <p style={{ fontSize: 11, color: C.brand, fontWeight: 600, marginTop: 4 }}>{course.pct}% เสร็จแล้ว</p>
                      </div>
                      {course.pct === 100 && <CheckCircle2 size={24} color={C.green} style={{ flexShrink: 0 }} />}
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

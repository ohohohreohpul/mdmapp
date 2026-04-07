'use client';

import { useState, useEffect } from 'react';
import { Search, Settings, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { Skel } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

const C = {
  primary: '#ef5ea8',
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
  card:    { boxShadow: '0px 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)' },
};

const PATHS = [
  { id: 'ux-design',          name: 'UX Design',          api: 'UX Design',          emoji: '🎨', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'data-analysis',      name: 'Data Analysis',      api: 'Data Analysis',      emoji: '📊', color: '#10B981', bg: '#ECFDF5' },
  { id: 'digital-marketing',  name: 'Digital Marketing',  api: 'Digital Marketing',  emoji: '📣', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'project-management', name: 'Project Mgmt',       api: 'Project Management', emoji: '📋', color: '#ef5ea8', bg: '#FFF0F7' },
  { id: 'learning-designer',  name: 'Learning Design',    api: 'Learning Designer',  emoji: '🎓', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'qa-tester',          name: 'QA Tester',          api: 'QA Tester',          emoji: '🐛', color: '#D946EF', bg: '#FDF4FF' },
];

export default function ExplorePage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [courses, setCourses]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  useEffect(() => { loadCourses(); }, [selectedPath]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params: any = { published_only: true };
      const path = PATHS.find(p => p.id === selectedPath);
      if (path) params.career_path = path.api;
      if (user?._id) params.user_id = user._id;
      const res = await axios.get(`${API_URL}/api/courses`, { params });
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activePath = PATHS.find(p => p.id === selectedPath);

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ── Glass sticky header ─────────────────────────── */}
      <div
        className="sticky top-0 z-20 header-shell"
        style={{
          background: 'rgba(242,242,247,0.85)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '0.5px solid rgba(0,0,0,0.10)',
        }}
      >
        <div className="max-w-lg mx-auto px-6 pt-3 pb-3">
          <div className="flex items-center justify-between mb-2.5">
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
              สำรวจคอร์ส
            </h1>
            {isAdmin && (
              <Link
                href="/admin"
                className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90"
                style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
              >
                <Settings size={18} style={{ color: C.ink2 }} />
              </Link>
            )}
          </div>
          {/* Search bar */}
          <div
            className="flex items-center gap-2.5 rounded-[14px] px-3.5 py-2.5"
            style={{ backgroundColor: C.surface, boxShadow: '0px 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <Search size={16} style={{ color: C.ink3 }} className="shrink-0" />
            <input
              type="text"
              placeholder="ค้นหาคอร์ส..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: '15px', color: C.ink }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-5">

        {/* Filter breadcrumb */}
        {selectedPath && (
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => setSelectedPath(null)}
              className="text-[13px] active:opacity-70"
              style={{ color: C.ink2 }}
            >
              ← ทั้งหมด
            </button>
            <span
              className="px-3 py-1 rounded-full text-[12px] font-bold text-white"
              style={{ backgroundColor: activePath?.color }}
            >
              {activePath?.name}
            </span>
          </div>
        )}

        {/* Career path grid */}
        {!selectedPath && (
          <>
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color: C.ink3 }}>
              Career Paths
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {PATHS.map(path => (
                <button
                  key={path.id}
                  onClick={() => setSelectedPath(path.id)}
                  className="rounded-[20px] p-5 text-left active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: path.bg, border: '1px solid rgba(0,0,0,0.04)' }}
                >
                  <span className="text-[32px] mb-3 block">{path.emoji}</span>
                  <p className="text-[14px] font-bold leading-snug" style={{ color: path.color }}>{path.name}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Course count label */}
        {!selectedPath && !loading && filtered.length > 0 && (
          <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color: C.ink3 }}>
            คอร์สทั้งหมด {filtered.length} คอร์ส
          </p>
        )}

        {/* Course list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-[20px] p-4 flex gap-3 items-center" style={{ backgroundColor: C.surface, ...C.card }}>
                <Skel className="w-14 h-14 shrink-0 rounded-[14px]" />
                <div className="flex-1 flex flex-col gap-2.5">
                  <Skel className="h-3.5 w-3/4 rounded-lg" />
                  <Skel className="h-3 w-1/2 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,94,168,0.10)' }}>
              <BookOpen size={30} style={{ color: C.primary }} />
            </div>
            <p className="text-[14px] font-semibold" style={{ color: C.ink2 }}>ไม่พบคอร์สที่ตรงกัน</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((course: any) => {
              const path = PATHS.find(p => p.api === course.career_path);
              return (
                <Link
                  key={course._id}
                  href={`/course-detail?id=${course._id}`}
                  className="rounded-[20px] p-4 flex items-center gap-3 active:scale-[0.97] transition-transform"
                  style={{ backgroundColor: C.surface, ...C.card }}
                >
                  <div
                    className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[26px] shrink-0"
                    style={{ backgroundColor: path?.bg ?? '#F3F0FF' }}
                  >
                    {path?.emoji ?? '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                      style={{ backgroundColor: (path?.color ?? '#8b5cf6') + '18', color: path?.color ?? '#8b5cf6' }}
                    >
                      {course.career_path}
                    </span>
                    <p className="text-[14px] font-bold line-clamp-2 leading-snug" style={{ color: C.ink }}>{course.title}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: C.ink3 }}>{course.total_lessons ?? 0} บทเรียน</p>
                  </div>
                  <ChevronRight size={18} style={{ color: C.ink3 }} className="shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

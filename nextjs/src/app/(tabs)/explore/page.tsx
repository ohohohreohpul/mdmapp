'use client';

import { useState, useEffect } from 'react';
import { Search, Settings, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { Skel } from '@/lib/ui';
import axios from 'axios';
import { getCached, setCached, isFresh } from '@/lib/apiCache';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

const C = {
  primary: '#ef5ea8',
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

const PATHS = [
  { id: 'ux-design',          name: 'UX Design',        api: 'UX Design',          emoji: '🎨', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'data-analysis',      name: 'Data Analysis',    api: 'Data Analysis',      emoji: '📊', color: '#10B981', bg: '#ECFDF5' },
  { id: 'digital-marketing',  name: 'Digital Marketing',api: 'Digital Marketing',  emoji: '📣', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'project-management', name: 'Project Mgmt',     api: 'Project Management', emoji: '📋', color: '#ef5ea8', bg: '#FFF0F7' },
  { id: 'learning-designer',  name: 'Learning Design',  api: 'Learning Designer',  emoji: '🎓', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'qa-tester',          name: 'QA Tester',        api: 'QA Tester',          emoji: '🐛', color: '#D946EF', bg: '#FDF4FF' },
];

export default function ExplorePage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const cacheKey = (path: string | null) => {
    const params: any = { published_only: true };
    const p = PATHS.find(x => x.id === path);
    if (p) params.career_path = p.api;
    return `${API_URL}/api/courses?${new URLSearchParams(params).toString()}`;
  };

  const [courses, setCourses] = useState<any[]>(() => getCached(cacheKey(null)) ?? []);
  const [loading, setLoading] = useState(() => !getCached(cacheKey(null)));
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  useEffect(() => { loadCourses(); }, [selectedPath]);

  const loadCourses = async () => {
    const key = cacheKey(selectedPath);
    // Show cached data immediately; only block-load on cold cache
    const cached = getCached(key);
    if (cached) { setCourses(cached); setLoading(false); }
    if (isFresh(key)) return; // still fresh — skip network call
    try {
      if (!cached) setLoading(true);
      const params: any = { published_only: true };
      const path = PATHS.find(p => p.id === selectedPath);
      if (path) params.career_path = path.api;
      if (user?._id) params.user_id = user._id;
      const res = await axios.get(`${API_URL}/api/courses`, { params });
      const data = Array.isArray(res.data) ? res.data : [];
      setCached(key, data);
      setCourses(data);
    } catch {
      if (!cached) setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activePath = PATHS.find(p => p.id === selectedPath);

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>

      {/* ── Glass header ─────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 header-shell"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div className="max-w-lg mx-auto" style={{ padding: '12px 20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
              สำรวจคอร์ส
            </h1>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center justify-center rounded-full active:scale-90"
                style={{ width: 36, height: 36, backgroundColor: 'rgba(0,0,0,0.06)' }}
              >
                <Settings size={17} style={{ color: C.ink2 }} />
              </Link>
            )}
          </div>
          {/* Search bar */}
          <div
            className="flex items-center"
            style={{
              gap: 10, backgroundColor: C.bg,
              borderRadius: 12, padding: '10px 14px',
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <Search size={16} style={{ color: C.ink3, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="ค้นหาคอร์ส..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 15, color: C.ink }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto flex flex-col" style={{ padding: '20px 20px 0', gap: 24 }}>

        {/* Active filter pill */}
        {selectedPath && (
          <div className="flex items-center" style={{ gap: 10 }}>
            <button
              onClick={() => setSelectedPath(null)}
              style={{ fontSize: 14, color: C.ink2 }}
            >
              ← ทั้งหมด
            </button>
            <span
              style={{
                fontSize: 12, fontWeight: 700, color: 'white',
                backgroundColor: activePath?.color,
                borderRadius: 99, padding: '4px 12px',
              }}
            >
              {activePath?.name}
            </span>
          </div>
        )}

        {/* Career path 2-col grid */}
        {!selectedPath && (
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12 }}>Career Paths</p>
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              {PATHS.map(path => (
                <button
                  key={path.id}
                  onClick={() => setSelectedPath(path.id)}
                  className="text-left active:scale-[0.97] transition-transform"
                  style={{
                    backgroundColor: path.bg,
                    borderRadius: 16,
                    padding: 16,
                    border: '1px solid rgba(0,0,0,0.04)',
                  }}
                >
                  <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>{path.emoji}</span>
                  <p style={{ fontSize: 14, fontWeight: 700, color: path.color, lineHeight: 1.3 }}>{path.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Course list */}
        <div style={{ paddingBottom: 24 }}>
          {!selectedPath && !loading && filtered.length > 0 && (
            <p style={{ fontSize: 14, color: C.ink2, fontWeight: 500, marginBottom: 12 }}>
              คอร์สทั้งหมด {filtered.length} คอร์ส
            </p>
          )}

          {loading ? (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center" style={{ ...cardStyle, padding: 14, gap: 12 }}>
                  <Skel style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 12 }} />
                  <div className="flex-1 flex flex-col" style={{ gap: 8 }}>
                    <Skel style={{ height: 14, width: '70%', borderRadius: 7 }} />
                    <Skel style={{ height: 11, width: '40%', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center" style={{ paddingTop: 60, gap: 12 }}>
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 64, height: 64, backgroundColor: 'rgba(239,94,168,0.10)' }}
              >
                <BookOpen size={28} style={{ color: C.primary }} />
              </div>
              <p style={{ fontSize: 15, color: C.ink2, fontWeight: 500 }}>ไม่พบคอร์สที่ตรงกัน</p>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {filtered.map((course: any) => {
                const path = PATHS.find(p => p.api === course.career_path);
                return (
                  <Link
                    key={course._id}
                    href={`/course-detail?id=${course._id}`}
                    className="active:scale-[0.97] transition-transform"
                    style={{ ...cardStyle, display: 'flex', alignItems: 'center', padding: 14, gap: 12 }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 52, height: 52,
                        borderRadius: 12,
                        backgroundColor: path?.bg ?? '#F3F0FF',
                        flexShrink: 0, fontSize: 24,
                      }}
                    >
                      {path?.emoji ?? '📚'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 600,
                          color: path?.color ?? '#8b5cf6',
                          backgroundColor: (path?.color ?? '#8b5cf6') + '18',
                          borderRadius: 99, padding: '2px 8px',
                          display: 'inline-block', marginBottom: 5,
                        }}
                      >
                        {course.career_path}
                      </span>
                      <p className="line-clamp-2" style={{ fontSize: 14, fontWeight: 600, color: C.ink, lineHeight: 1.35 }}>
                        {course.title}
                      </p>
                      <p style={{ fontSize: 12, color: C.ink3, marginTop: 3 }}>{course.total_lessons ?? 0} บทเรียน</p>
                    </div>
                    <ChevronRight size={18} style={{ color: C.ink3, flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

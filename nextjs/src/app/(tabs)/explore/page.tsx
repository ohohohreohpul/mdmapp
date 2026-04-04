'use client';

import { useState, useEffect } from 'react';
import { Search, Settings, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { TabHeader, Card, Skel, EmptyState } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

const PATHS = [
  { id: 'ux-design',          name: 'UX Design',          api: 'UX Design',          emoji: '🎨', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'data-analysis',      name: 'Data Analysis',      api: 'Data Analysis',      emoji: '📊', color: '#10B981', bg: '#ECFDF5' },
  { id: 'digital-marketing',  name: 'Digital Marketing',  api: 'Digital Marketing',  emoji: '📣', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'project-management', name: 'Project Management', api: 'Project Management', emoji: '📋', color: '#e8409b', bg: '#FDF2F8' },
  { id: 'learning-designer',  name: 'Learning Design',    api: 'Learning Designer',  emoji: '🎓', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'qa-tester',          name: 'QA Tester',          api: 'QA Tester',          emoji: '🐛', color: '#D946EF', bg: '#FDF4FF' },
];

export default function ExplorePage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
    <div className="min-h-screen bg-bg">
      <TabHeader
        title="สำรวจคอร์ส"
        right={isAdmin ? (
          <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-2xl bg-bg">
            <Settings size={18} className="text-ink-2" />
          </Link>
        ) : undefined}
      />

      {/* Search bar */}
      <div className="bg-surface border-b border-rim sticky top-[54px] z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-2.5 bg-bg rounded-2xl px-3.5 py-2.5">
            <Search size={16} className="text-ink-3 shrink-0" />
            <input
              type="text"
              placeholder="ค้นหาคอร์ส..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Filter breadcrumb */}
        {selectedPath && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setSelectedPath(null)}
              className="text-[13px] text-ink-3 hover:text-ink-2 transition-colors"
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
            <p className="text-[12px] font-bold text-ink-3 uppercase tracking-wider mb-3">เลือก Career Path</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PATHS.map(path => (
                <button
                  key={path.id}
                  onClick={() => setSelectedPath(path.id)}
                  className="rounded-2xl p-4 text-left active:scale-[0.97] transition-transform card-shadow"
                  style={{ backgroundColor: path.bg }}
                >
                  <span className="text-[28px] mb-2 block">{path.emoji}</span>
                  <p className="text-[13px] font-bold leading-snug" style={{ color: path.color }}>{path.name}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Course list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-2xl p-4 card-shadow flex gap-3">
                <Skel className="w-12 h-12 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skel className="h-3.5 w-3/4" />
                  <Skel className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title="ไม่พบคอร์สที่ตรงกัน" />
        ) : (
          <div className="flex flex-col gap-3">
            {!selectedPath && (
              <p className="text-[13px] text-ink-3">คอร์สทั้งหมด {filtered.length} คอร์ส</p>
            )}
            {filtered.map((course: any) => {
              const path = PATHS.find(p => p.api === course.career_path);
              return (
                <Link
                  key={course._id}
                  href={`/course-detail?id=${course._id}`}
                  className="bg-surface rounded-2xl p-4 flex items-start gap-3 card-shadow active:scale-[0.98] transition-transform"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] shrink-0"
                    style={{ backgroundColor: path?.bg ?? '#F3F3F8' }}
                  >
                    {path?.emoji ?? '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5"
                      style={{ backgroundColor: (path?.color ?? '#a5a5c0') + '18', color: path?.color ?? '#a5a5c0' }}
                    >
                      {course.career_path}
                    </span>
                    <p className="text-[14px] font-bold text-ink line-clamp-2">{course.title}</p>
                    <p className="text-[12px] text-ink-3 mt-0.5">{course.total_lessons ?? 0} บทเรียน</p>
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

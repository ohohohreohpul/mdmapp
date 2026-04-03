'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Settings, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

const PATHS = [
  { id: 'ux-design',          name: 'UX Design',          api: 'UX Design',          emoji: '🎨', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'data-analysis',      name: 'Data Analysis',      api: 'Data Analysis',      emoji: '📊', color: '#10B981', bg: '#ECFDF5' },
  { id: 'digital-marketing',  name: 'Digital Marketing',  api: 'Digital Marketing',  emoji: '📣', color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'project-management', name: 'Project Management', api: 'Project Management', emoji: '📋', color: '#EF5EA8', bg: '#FDF2F8' },
  { id: 'learning-designer',  name: 'Learning Design',    api: 'Learning Designer',  emoji: '🎓', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'qa-tester',          name: 'QA Tester',          api: 'QA Tester',          emoji: '🐛', color: '#D946EF', bg: '#FDF4FF' },
];

export default function ExplorePage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-ios-bg">
      {/* Header */}
      <header className="bg-white border-b border-separator px-5 pt-safe">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-[22px] font-extrabold text-text-primary">สำรวจคอร์ส</h1>
          {isAdmin && (
            <Link href="/admin" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ios-bg transition-colors">
              <Settings size={20} className="text-text-secondary" />
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-ios-bg rounded-2xl px-4 py-2.5 mb-4">
          <Search size={18} className="text-text-tertiary shrink-0" />
          <input
            type="text"
            placeholder="ค้นหาคอร์ส..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Path filters — show when no path selected */}
        {!selectedPath ? (
          <>
            <h2 className="text-[15px] font-bold text-text-primary mb-3">เลือก Career Path</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {PATHS.map(path => (
                <button
                  key={path.id}
                  onClick={() => setSelectedPath(path.id)}
                  className="rounded-2xl p-4 text-left hover:scale-[1.02] transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: path.bg }}
                >
                  <span className="text-2xl mb-2 block">{path.emoji}</span>
                  <p className="text-[13px] font-bold" style={{ color: path.color }}>{path.name}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setSelectedPath(null)}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
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

        {/* Course list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-10 text-text-secondary">
            <BookOpen size={40} className="mb-3 text-text-tertiary" />
            <p className="text-sm">ไม่พบคอร์สที่ตรงกัน</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {!selectedPath && <p className="text-sm text-text-secondary">คอร์สทั้งหมด {filtered.length} คอร์ส</p>}
            {filtered.map((course: any) => {
              const path = PATHS.find(p => p.api === course.career_path);
              return (
                <Link
                  key={course._id}
                  href={`/course-detail?id=${course._id}`}
                  className="bg-white rounded-2xl p-4 border border-separator flex items-start gap-3 hover:border-primary/30 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: path?.bg ?? '#F2F2F7' }}
                  >
                    {path?.emoji ?? '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1"
                      style={{ backgroundColor: (path?.color ?? '#636366') + '15', color: path?.color ?? '#636366' }}
                    >
                      {course.career_path}
                    </span>
                    <p className="text-[14px] font-bold text-text-primary line-clamp-2">{course.title}</p>
                    <p className="text-[12px] text-text-secondary mt-0.5">{course.total_lessons} บทเรียน</p>
                  </div>
                  <ChevronRight size={18} className="text-text-tertiary shrink-0 mt-1" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

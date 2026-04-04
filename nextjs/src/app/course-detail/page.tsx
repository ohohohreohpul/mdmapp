'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Share2, BookOpen, Layers, Ribbon, Zap, Lock,
  Calendar, ChevronDown, ChevronUp, PlayCircle, Headphones,
  FileText, CheckCircle, ChevronRight, Loader2, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { stripHtml } from '@shared/contentUtils';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

function CourseDetailPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const courseId = params.get('id') ?? '';
  const { user } = useUser();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [lessonsMap, setLessonsMap] = useState<Record<string, any[]>>({});
  const [practiceModules, setPracticeModules] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (courseId) loadData(); }, [courseId, user?._id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseRes, modulesRes] = await Promise.all([
        axios.get(`${API_URL}/api/courses/${courseId}`, { params: user?._id ? { user_id: user._id } : {} }),
        axios.get(`${API_URL}/api/modules/course/${courseId}`),
      ]);
      setCourse(courseRes.data);
      setModules(modulesRes.data);

      const map: Record<string, any[]> = {};
      for (const mod of modulesRes.data) {
        try {
          const r = await axios.get(`${API_URL}/api/lessons/module/${mod._id}`);
          map[mod._id] = r.data;
        } catch { map[mod._id] = []; }
      }
      setLessonsMap(map);

      try {
        const pr = await axios.get(`${API_URL}/api/practice/course/${courseId}?user_id=${user?._id || 'demo_user'}`);
        setPracticeModules(pr.data || []);
      } catch { setPracticeModules([]); }
    } catch {
      setError('ไม่สามารถโหลดข้อมูลคอร์สได้');
    } finally {
      setLoading(false);
    }
  };

  const isLessonCompleted = (lessonId: string) =>
    user?.progress?.[courseId]?.completed_lessons?.includes(lessonId) ?? false;

  const getNextLesson = () => {
    for (const mod of modules) {
      for (const lesson of (lessonsMap[mod._id] || [])) {
        if (!isLessonCompleted(lesson._id)) return lesson;
      }
    }
    return null;
  };

  const startCourse = () => {
    if (practiceModules.length > 0 && modules.length === 0) {
      const target = practiceModules.find((pm, i) => {
        const unlocked = i === 0 || practiceModules[i - 1]?.user_completed;
        return unlocked && !pm.user_completed;
      }) || practiceModules[0];
      if (target) router.push(`/duolingo?moduleId=${target.id}&courseId=${courseId}&title=${encodeURIComponent(target.title)}`);
      return;
    }
    const next = getNextLesson();
    if (next) {
      router.push(`/lesson?id=${next._id}&courseId=${courseId}`);
    } else if (modules.length > 0 && lessonsMap[modules[0]._id]?.length > 0) {
      router.push(`/lesson?id=${lessonsMap[modules[0]._id][0]._id}&courseId=${courseId}`);
    }
  };

  const getUserProgress = () => {
    const completedLessons = user?.progress?.[courseId]?.completed_lessons?.length || 0;
    const completedPractice = practiceModules.filter((m: any) => m.user_completed).length;
    const totalLessons = course?.total_lessons || 0;
    const totalPractice = practiceModules.length;
    const totalUnits = totalLessons + totalPractice;
    const completedUnits = completedLessons + completedPractice;
    return {
      completed: completedUnits,
      percentage: totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0,
      completedLessons,
      completedPractice,
      totalPractice,
    };
  };

  const toggleModule = (id: string) =>
    setExpandedModules(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const contentTypeIcon = (type: string) => {
    if (type === 'video') return <PlayCircle size={14} className="text-text-tertiary" />;
    if (type === 'audio') return <Headphones size={14} className="text-text-tertiary" />;
    return <FileText size={14} className="text-text-tertiary" />;
  };
  const contentTypeLabel = (type: string) =>
    type === 'video' ? 'วิดีโอ' : type === 'audio' ? 'เสียง' : 'บทความ';

  if (loading) return (
    <div className="min-h-screen bg-ios-bg flex items-center justify-center gap-2 text-text-secondary">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );

  if (error || !course) return (
    <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertCircle size={64} className="text-error" />
      <p className="text-text-primary font-semibold">{error || 'ไม่พบคอร์ส'}</p>
      <button onClick={loadData} className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold">ลองอีกครั้ง</button>
    </div>
  );

  const progress = getUserProgress();
  const isInteractive = practiceModules.length > 0 && modules.length === 0;
  const isLocked = course.is_locked === true;
  const isComingSoon = course.is_coming_soon === true;
  const totalInteractiveQuestions = practiceModules.reduce((s: number, pm: any) => s + (pm.question_count || 0), 0);

  return (
    <div className="min-h-screen bg-ios-bg">
      {/* Hero */}
      <div className="relative">
        <div
          className="h-52 w-full bg-primary"
          style={course.thumbnail ? { backgroundImage: `url(${course.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Floating back button */}
        <div
          className="absolute top-0 left-0 right-0 px-4 flex items-center justify-between"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <button onClick={() => router.back()} className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ArrowLeft size={22} className="text-white" />
          </button>
          <button className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Share2 size={20} className="text-white" />
          </button>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="bg-primary/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
              {course.career_path}
            </span>
            {isInteractive && (
              <span className="bg-yellow-500/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                ⚡ Interactive
              </span>
            )}
          </div>
          <h1 className="text-white font-extrabold text-[20px] leading-tight mb-2">{course.title}</h1>
          <div className="flex flex-wrap gap-3">
            {isInteractive ? (
              <>
                <StatChip icon={<Layers size={15} />} label={`${practiceModules.length} โมดูล`} />
                <StatChip icon={<Zap size={15} />} label={`${totalInteractiveQuestions} แบบฝึกหัด`} />
              </>
            ) : (
              <>
                <StatChip icon={<BookOpen size={15} />} label={`${course.total_lessons} บทเรียน`} />
                <StatChip icon={<Layers size={15} />} label={`${modules.length} โมดูล`} />
              </>
            )}
            {course.has_final_exam && <StatChip icon={<Ribbon size={15} />} label="มีใบประกาศ" />}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4 pb-10">
        {/* Progress card */}
        {progress.completed > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[14px] font-bold text-text-primary">ความคืบหน้าของคุณ</p>
              <p className="text-[14px] font-bold text-primary">{progress.percentage}%</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progress.percentage}%` }} />
            </div>
            <p className="text-[12px] text-text-secondary">
              {isInteractive
                ? `โมดูล ${progress.completedPractice}/${progress.totalPractice} ผ่านแล้ว`
                : `บทเรียน ${progress.completedLessons}/${course.total_lessons}`}
            </p>
          </div>
        )}

        {/* CTA / locked / coming soon */}
        {isComingSoon ? (
          <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-separator">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Calendar size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-text-primary">Coming Soon</p>
              <p className="text-sm text-text-secondary">This course will be available in April 2026</p>
            </div>
          </div>
        ) : isLocked ? (
          <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-separator">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
              <Lock size={24} className="text-text-tertiary" />
            </div>
            <div>
              <p className="font-bold text-text-primary">คอร์สนี้ยังล็อกอยู่</p>
              <p className="text-sm text-text-secondary">ต้องผ่านคอร์สก่อนหน้าก่อน</p>
            </div>
          </div>
        ) : (
          <button
            onClick={startCourse}
            className="w-full bg-primary text-white font-bold text-[17px] py-4 rounded-2xl shadow-[0_6px_14px_rgba(239,94,168,0.3)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {progress.completed > 0
              ? (isInteractive ? '⚡ ฝึกต่อ' : '▶ เรียนต่อ')
              : (isInteractive ? '⚡ เริ่มฝึกทักษะ' : '🚀 เริ่มเรียน')}
          </button>
        )}

        {/* About */}
        {course.description && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[15px] font-bold text-text-primary mb-2">เกี่ยวกับคอร์สนี้</p>
            <p className="text-[14px] text-text-secondary leading-relaxed">{stripHtml(course.description)}</p>
          </div>
        )}

        {/* Curriculum */}
        <div>
          <p className="text-[15px] font-bold text-text-primary mb-2">หลักสูตร</p>
          {modules.length === 0 && practiceModules.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-text-secondary gap-2">
              <BookOpen size={40} className="text-text-tertiary" />
              <p className="text-sm">ยังไม่มีเนื้อหาในคอร์สนี้</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Traditional modules */}
              {modules.map((mod, idx) => {
                const lessons = lessonsMap[mod._id] || [];
                const completedCount = lessons.filter(l => isLessonCompleted(l._id)).length;
                const expanded = expandedModules.includes(mod._id);
                return (
                  <div key={mod._id} className="bg-white rounded-2xl overflow-hidden border border-separator">
                    <button
                      onClick={() => toggleModule(mod._id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0 ${idx === 0 ? 'bg-primary' : 'bg-[#6366F1]'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-text-primary">{mod.title}</p>
                        <p className="text-[12px] text-text-secondary">
                          {lessons.length} บทเรียน{completedCount > 0 && ` · ${completedCount} เสร็จแล้ว`}
                        </p>
                      </div>
                      {expanded ? <ChevronUp size={20} className="text-text-secondary shrink-0" /> : <ChevronDown size={20} className="text-text-secondary shrink-0" />}
                    </button>
                    {expanded && (
                      <div className="border-t border-separator">
                        {lessons.length === 0 ? (
                          <p className="text-sm text-text-secondary px-4 py-3">ยังไม่มีบทเรียน</p>
                        ) : lessons.map((lesson, li) => {
                          const done = isLessonCompleted(lesson._id);
                          return (
                            <Link
                              key={lesson._id}
                              href={`/lesson?id=${lesson._id}&courseId=${courseId}`}
                              className="flex items-center gap-3 px-4 py-3 border-t border-separator/50 first:border-t-0 hover:bg-gray-50 transition-colors"
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold ${done ? 'bg-[#10B981]' : 'bg-gray-100'}`}>
                                {done ? <CheckCircle size={16} className="text-white" /> : <span className="text-text-secondary">{li + 1}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-semibold ${done ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{lesson.title}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {contentTypeIcon(lesson.content_type)}
                                  <span className="text-[11px] text-text-tertiary">
                                    {contentTypeLabel(lesson.content_type)}{lesson.duration_minutes > 0 && ` · ${lesson.duration_minutes} นาที`}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight size={16} className="text-text-tertiary shrink-0" />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Practice modules */}
              {practiceModules.map((pm: any, idx: number) => {
                const unlocked = idx === 0 || practiceModules[idx - 1]?.user_completed;
                return (
                  <button
                    key={pm.id}
                    disabled={!unlocked}
                    onClick={() => unlocked && router.push(`/duolingo?moduleId=${pm.id}&courseId=${courseId}&title=${encodeURIComponent(pm.title)}`)}
                    className={`w-full flex items-center gap-3 bg-white rounded-2xl p-4 border text-left transition-colors ${unlocked ? 'border-separator hover:border-primary/30' : 'border-separator opacity-50'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${pm.user_completed ? 'bg-[#10B981]' : unlocked ? 'bg-primary' : 'bg-gray-300'}`}>
                      {pm.user_completed ? <CheckCircle size={16} className="text-white" /> : <span>{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-text-primary">{pm.title}</p>
                      <p className="text-[12px] text-text-secondary">{pm.question_count || 0} แบบฝึกหัด</p>
                    </div>
                    {unlocked ? <ChevronRight size={18} className="text-text-tertiary shrink-0" /> : <Lock size={16} className="text-text-tertiary shrink-0" />}
                  </button>
                );
              })}

              {/* Final exam */}
              {course.has_final_exam && (
                <Link
                  href={`/quiz?courseId=${courseId}&type=final_exam`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-separator hover:border-primary/30 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shrink-0">
                    <Ribbon size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-text-primary">ข้อสอบปลายภาค</p>
                    <p className="text-[12px] text-text-secondary">ผ่านเพื่อรับใบประกาศนียบัตร</p>
                  </div>
                  <ChevronRight size={18} className="text-text-tertiary shrink-0" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1 backdrop-blur-sm">
      <span className="text-white/90">{icon}</span>
      <span className="text-white/90 text-[12px] font-semibold">{label}</span>
    </div>
  );
}

export default function CourseDetailPage() {
  return <Suspense><CourseDetailPageInner /></Suspense>;
}

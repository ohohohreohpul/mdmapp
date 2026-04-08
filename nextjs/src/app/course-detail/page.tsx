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
import { ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const C = {
  brand:   '#ef5ea8',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  green:   '#10B981',
  red:     '#EF4444',
  indigo:  '#6366F1',
};

const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

function CourseDetailPageInner() {
  const router   = useRouter();
  const params   = useSearchParams();
  const courseId = params.get('id') ?? '';
  const { user } = useUser();

  const [course, setCourse]                   = useState<any>(null);
  const [modules, setModules]                 = useState<any[]>([]);
  const [lessonsMap, setLessonsMap]           = useState<Record<string, any[]>>({});
  const [practiceModules, setPracticeModules] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');

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
    } catch { setError('ไม่สามารถโหลดข้อมูลคอร์สได้'); }
    finally   { setLoading(false); }
  };

  const isLessonCompleted = (lessonId: string) =>
    user?.progress?.[courseId]?.completed_lessons?.includes(lessonId) ?? false;

  const getNextLesson = () => {
    for (const mod of modules)
      for (const lesson of (lessonsMap[mod._id] || []))
        if (!isLessonCompleted(lesson._id)) return lesson;
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
    if (next) { router.push(`/lesson?id=${next._id}&courseId=${courseId}`); return; }
    if (modules.length > 0 && lessonsMap[modules[0]._id]?.length > 0)
      router.push(`/lesson?id=${lessonsMap[modules[0]._id][0]._id}&courseId=${courseId}`);
  };

  const getUserProgress = () => {
    const completedLessons  = user?.progress?.[courseId]?.completed_lessons?.length || 0;
    const completedPractice = practiceModules.filter((m: any) => m.user_completed).length;
    const totalLessons      = course?.total_lessons || 0;
    const totalPractice     = practiceModules.length;
    const totalUnits        = totalLessons + totalPractice;
    const completedUnits    = completedLessons + completedPractice;
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

  const ctIcon = (type: string) => {
    if (type === 'video') return <PlayCircle size={13} color={C.ink3} />;
    if (type === 'audio') return <Headphones size={13} color={C.ink3} />;
    return <FileText size={13} color={C.ink3} />;
  };
  const ctLabel = (type: string) =>
    type === 'video' ? 'วิดีโอ' : type === 'audio' ? 'เสียง' : 'บทความ';

  /* ── Loading / error ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color={C.brand} className="animate-spin" />
    </div>
  );

  if (error || !course) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', textAlign: 'center' }}>
      <AlertCircle size={64} color={C.red} />
      <p style={{ color: C.ink, fontWeight: 600 }}>{error || 'ไม่พบคอร์ส'}</p>
      <button onClick={loadData} style={{ backgroundColor: C.brand, color: '#fff', padding: '12px 24px', borderRadius: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
        ลองอีกครั้ง
      </button>
    </div>
  );

  const progress      = getUserProgress();
  const isInteractive = practiceModules.length > 0 && modules.length === 0;
  const isLocked      = course.is_locked === true;
  const isComingSoon  = course.is_coming_soon === true;
  const totalInteractiveQuestions = practiceModules.reduce((s: number, pm: any) => s + (pm.question_count || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative' }}>
        {/* Background */}
        <div style={{
          height: 280,
          width: '100%',
          backgroundColor: C.brand,
          ...(course.thumbnail ? { backgroundImage: `url(${course.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.20) 50%, transparent 100%)',
        }} />

        {/* Nav buttons */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          paddingLeft: 20, paddingRight: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={() => router.back()} style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.30)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <ArrowLeft size={22} color="#fff" />
          </button>
          <button style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.30)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <Share2 size={20} color="#fff" />
          </button>
        </div>

        {/* Hero text */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {course.career_path && (
              <span style={{
                backgroundColor: 'rgba(239,94,168,0.80)', color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                backdropFilter: 'blur(8px)',
              }}>
                {course.career_path}
              </span>
            )}
            {isInteractive && (
              <span style={{
                backgroundColor: 'rgba(234,179,8,0.80)', color: '#fff',
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                backdropFilter: 'blur(8px)',
              }}>
                ⚡ Interactive
              </span>
            )}
          </div>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 20, lineHeight: 1.3, margin: '0 0 10px' }}>
            {course.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {isInteractive ? (
              <>
                <HeroChip icon={<Layers size={13} color="rgba(255,255,255,0.9)" />} label={`${practiceModules.length} โมดูล`} />
                <HeroChip icon={<Zap size={13} color="rgba(255,255,255,0.9)" />} label={`${totalInteractiveQuestions} แบบฝึกหัด`} />
              </>
            ) : (
              <>
                <HeroChip icon={<BookOpen size={13} color="rgba(255,255,255,0.9)" />} label={`${course.total_lessons} บทเรียน`} />
                <HeroChip icon={<Layers size={13} color="rgba(255,255,255,0.9)" />} label={`${modules.length} โมดูล`} />
              </>
            )}
            {course.has_final_exam && <HeroChip icon={<Ribbon size={13} color="rgba(255,255,255,0.9)" />} label="มีใบประกาศ" />}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 512, margin: '0 auto', padding: '20px 20px 80px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Progress */}
        {progress.completed > 0 && (
          <div style={{ ...card, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>ความคืบหน้าของคุณ</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.brand }}>{progress.percentage}%</span>
            </div>
            <ProgressBar pct={progress.percentage} className="mb-2" />
            <p style={{ fontSize: 12, color: C.ink2 }}>
              {isInteractive
                ? `โมดูล ${progress.completedPractice}/${progress.totalPractice} ผ่านแล้ว`
                : `บทเรียน ${progress.completedLessons}/${course.total_lessons}`}
            </p>
          </div>
        )}

        {/* CTA */}
        {isComingSoon ? (
          <div style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(239,94,168,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={24} color={C.brand} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: C.ink, fontSize: 15, marginBottom: 2 }}>Coming Soon</p>
              <p style={{ fontSize: 13, color: C.ink2 }}>This course will be available in April 2026</p>
            </div>
          </div>
        ) : isLocked ? (
          <div style={{ ...card, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={24} color={C.ink3} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: C.ink, fontSize: 15, marginBottom: 2 }}>คอร์สนี้ยังล็อกอยู่</p>
              <p style={{ fontSize: 13, color: C.ink2 }}>ต้องผ่านคอร์สก่อนหน้าก่อน</p>
            </div>
          </div>
        ) : (
          <button
            onClick={startCourse}
            style={{
              width: '100%', backgroundColor: C.brand, color: '#fff',
              fontWeight: 700, fontSize: 17, padding: '16px 0', borderRadius: 16,
              border: 'none', cursor: 'pointer',
              boxShadow: '0px 6px 20px rgba(239,94,168,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {progress.completed > 0
              ? (isInteractive ? '⚡ ฝึกต่อ' : '▶ เรียนต่อ')
              : (isInteractive ? '⚡ เริ่มฝึกทักษะ' : '🚀 เริ่มเรียน')}
          </button>
        )}

        {/* About */}
        {course.description && (
          <div style={{ ...card, padding: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>เกี่ยวกับคอร์สนี้</p>
            <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.65 }}>{stripHtml(course.description)}</p>
          </div>
        )}

        {/* Curriculum */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>หลักสูตร</p>

          {modules.length === 0 && practiceModules.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 8, color: C.ink2 }}>
              <BookOpen size={40} color={C.ink3} />
              <p style={{ fontSize: 14 }}>ยังไม่มีเนื้อหาในคอร์สนี้</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Regular modules */}
              {modules.map((mod, idx) => {
                const lessons        = lessonsMap[mod._id] || [];
                const completedCount = lessons.filter(l => isLessonCompleted(l._id)).length;
                const expanded       = expandedModules.includes(mod._id);
                return (
                  <div key={mod._id} style={{ ...card, overflow: 'hidden' }}>
                    <button
                      onClick={() => toggleModule(mod._id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: 16, border: 'none', backgroundColor: 'transparent',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        backgroundColor: idx === 0 ? C.brand : C.indigo,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: '#fff', fontSize: 13, fontWeight: 700,
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 2 }}>{mod.title}</p>
                        <p style={{ fontSize: 12, color: C.ink2 }}>
                          {lessons.length} บทเรียน{completedCount > 0 && ` · ${completedCount} เสร็จแล้ว`}
                        </p>
                      </div>
                      {expanded
                        ? <ChevronUp size={18} color={C.ink3} style={{ flexShrink: 0 }} />
                        : <ChevronDown size={18} color={C.ink3} style={{ flexShrink: 0 }} />}
                    </button>

                    {expanded && (
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        {lessons.length === 0 ? (
                          <p style={{ fontSize: 13, color: C.ink2, padding: '12px 16px' }}>ยังไม่มีบทเรียน</p>
                        ) : lessons.map((lesson, li) => {
                          const done = isLessonCompleted(lesson._id);
                          return (
                            <Link
                              key={lesson._id}
                              href={`/lesson?id=${lesson._id}&courseId=${courseId}`}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '12px 16px',
                                borderTop: li === 0 ? 'none' : '1px solid rgba(0,0,0,0.04)',
                                textDecoration: 'none',
                                backgroundColor: 'transparent',
                              }}
                            >
                              <div style={{
                                width: 28, height: 28, borderRadius: 14,
                                backgroundColor: done ? C.green : 'rgba(0,0,0,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, fontSize: 12, fontWeight: 700,
                              }}>
                                {done
                                  ? <CheckCircle size={15} color="#fff" />
                                  : <span style={{ color: C.ink3 }}>{li + 1}</span>}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: 13, fontWeight: 600,
                                  color: done ? C.ink3 : C.ink,
                                  textDecoration: done ? 'line-through' : 'none',
                                  marginBottom: 2,
                                }}>
                                  {lesson.title}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {ctIcon(lesson.content_type)}
                                  <span style={{ fontSize: 11, color: C.ink3 }}>
                                    {ctLabel(lesson.content_type)}{lesson.duration_minutes > 0 && ` · ${lesson.duration_minutes} นาที`}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight size={15} color={C.ink3} style={{ flexShrink: 0 }} />
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
                    style={{
                      ...card,
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: 16, border: card.border, cursor: unlocked ? 'pointer' : 'default',
                      opacity: unlocked ? 1 : 0.5,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      backgroundColor: pm.user_completed ? C.green : unlocked ? C.brand : 'rgba(0,0,0,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {pm.user_completed
                        ? <CheckCircle size={16} color="#fff" />
                        : <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{idx + 1}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 2 }}>{pm.title}</p>
                      <p style={{ fontSize: 12, color: C.ink2 }}>{pm.question_count || 0} แบบฝึกหัด</p>
                    </div>
                    {unlocked
                      ? <ChevronRight size={18} color={C.ink3} style={{ flexShrink: 0 }} />
                      : <Lock size={16} color={C.ink3} style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}

              {/* Final exam */}
              {course.has_final_exam && (
                <Link
                  href={`/quiz?courseId=${courseId}&type=final_exam`}
                  style={{ ...card, display: 'flex', alignItems: 'center', gap: 12, padding: 16, textDecoration: 'none' }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: C.brand,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Ribbon size={18} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 2 }}>ข้อสอบปลายภาค</p>
                    <p style={{ fontSize: 12, color: C.ink2 }}>ผ่านเพื่อรับใบประกาศนียบัตร</p>
                  </div>
                  <ChevronRight size={18} color={C.ink3} style={{ flexShrink: 0 }} />
                </Link>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(255,255,255,0.20)',
      borderRadius: 999, padding: '4px 10px',
      backdropFilter: 'blur(8px)',
    }}>
      {icon}
      <span style={{ color: 'rgba(255,255,255,0.90)', fontSize: 12, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

export default function CourseDetailPage() {
  return <Suspense><CourseDetailPageInner /></Suspense>;
}

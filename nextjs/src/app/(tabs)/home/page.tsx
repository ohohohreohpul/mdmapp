'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { ARTICLES } from '@/lib/articles';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const MOCK_ANNOUNCEMENTS = [
  { id: '1', title: 'ยินดีต้อนรับสู่ Mydemy! 🎉', body: 'เราพร้อมช่วยคุณพัฒนาทักษะด้วยคอร์สออนไลน์คุณภาพสูง', color: '#ef5ea8', icon: '📣' },
  { id: '2', title: 'คอร์สใหม่มาแล้ว!', body: 'เปิดตัวคอร์ส UX/UI Design ฉบับสมบูรณ์ สมัครได้เลยวันนี้', color: '#d94d94', icon: '🆕' },
];

const CAREER_PATHS = [
  { id: 'ux-design',          icon: '🎨', color: '#6366F1', bg: '#EEF2FF', label: 'UX Design' },
  { id: 'data-analysis',      icon: '📊', color: '#10B981', bg: '#ECFDF5', label: 'Data Analysis' },
  { id: 'digital-marketing',  icon: '📣', color: '#F59E0B', bg: '#FFFBEB', label: 'Digital Marketing' },
  { id: 'project-management', icon: '📋', color: '#EF5EA8', bg: '#FDF2F8', label: 'Project Mgmt' },
  { id: 'learning-designer',  icon: '🎓', color: '#8B5CF6', bg: '#F5F3FF', label: 'Learning Design' },
  { id: 'qa-tester',          icon: '🐛', color: '#D946EF', bg: '#FDF4FF', label: 'QA Tester' },
];

function streakMsg(streak: number): string {
  if (streak >= 30) return `🌟 ${streak} วันติดต่อกัน! สุดยอดมาก!`;
  if (streak >= 14) return `💎 ${streak} วัน กำลังไปได้ดีมาก!`;
  if (streak >= 7)  return `🔥 ${streak} วัน! ครบสัปดาห์แรกแล้ว!`;
  if (streak >= 3)  return `⚡ ${streak} วันติดต่อกัน ไปต่อเลย!`;
  if (streak === 2) return `✨ 2 วันติดต่อกัน! รักษาไว้นะ`;
  if (streak === 1) return `🌱 วันแรก เริ่มต้นที่ดี!`;
  return `🎯 เช็คอินวันนี้เพื่อเริ่ม streak`;
}

export default function HomePage() {
  const { user } = useUser();
  const [dashboard, setDashboard] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInXp, setCheckInXp] = useState(0);
  const [showXpPop, setShowXpPop] = useState(false);

  const todayKey = `checkin_${new Date().toISOString().slice(0, 10)}`;

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/courses?published_only=true`);
      const all = Array.isArray(res.data) ? res.data : [];
      setCourses([...all].sort(() => 0.5 - Math.random()).slice(0, 6));
      if (user?._id) {
        axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`)
          .then(r => setDashboard(r.data)).catch(() => {});
      }
      const done = typeof window !== 'undefined' ? localStorage.getItem(todayKey) : null;
      setCheckedInToday(done === 'true');
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user?._id, todayKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async () => {
    if (!user || checkingIn || checkedInToday) return;
    setCheckingIn(true);
    try {
      const res = await axios.post(`${API_URL}/api/gamification/daily-checkin`, { user_id: user._id });
      setCheckedInToday(true);
      if (typeof window !== 'undefined') localStorage.setItem(todayKey, 'true');
      if (!res.data.already_checked_in) {
        const awarded = res.data.xp_awarded ?? 20;
        setCheckInXp(awarded);
        setShowXpPop(true);
        setTimeout(() => setShowXpPop(false), 1400);
        setDashboard((prev: any) => prev ? {
          ...prev,
          today_xp: (prev.today_xp ?? 0) + awarded,
          daily_progress_percent: Math.min(100, Math.round(((prev.today_xp ?? 0) + awarded) / (prev.daily_goal || 30) * 100)),
          current_streak: res.data.streak ?? prev.current_streak,
        } : prev);
      }
    } catch { /* silently fail */ } finally { setCheckingIn(false); }
  };

  const streak   = dashboard?.current_streak ?? 0;
  const level    = dashboard?.level_info?.level ?? 1;
  const levelPct = dashboard?.level_info?.progress_percent ?? 0;
  const goalPct  = Math.min(dashboard?.daily_progress_percent ?? 0, 100);
  const todayXp  = dashboard?.today_xp ?? 0;
  const dailyGoal = dashboard?.daily_goal ?? 30;
  const xpTotal  = dashboard?.xp_total ?? 0;
  const firstName = (user?.display_name || user?.username || 'คุณ').split(' ')[0];
  const initial   = (user?.display_name || user?.username || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-ios-bg">
      <div className="max-w-lg mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div
          className="px-4 pb-5"
          style={{
            background: 'linear-gradient(160deg, #f472b6 0%, #ef5ea8 55%, #db2777 100%)',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)',
          }}
        >
          {/* Top row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
              <span className="text-white font-bold text-[15px]">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-[11px] font-medium">สวัสดี 👋</p>
              <p className="text-white font-bold text-[16px] truncate leading-tight">{firstName}</p>
            </div>
            <Link href="/notifications" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors relative">
              <Bell size={20} className="text-white/90" />
            </Link>
          </div>

          {/* Stats pills */}
          <div className="flex gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-[13px]">🔥</span>
              <span className="text-[13px] font-bold text-white">{streak}</span>
              <span className="text-[11px] text-white/65">วัน</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-[13px]">⚡</span>
              <span className="text-[13px] font-bold text-white">{xpTotal}</span>
              <span className="text-[11px] text-white/65">XP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 border border-white/10">
              <span className="text-[13px]">👑</span>
              <span className="text-[13px] font-bold text-yellow-300">Lv.{level}</span>
            </div>
          </div>

          {/* Level progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/80 rounded-full transition-all duration-700" style={{ width: `${levelPct}%` }} />
            </div>
            <span className="text-[10px] text-white/60 shrink-0">{levelPct}% → Lv.{level + 1}</span>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-5">

          {/* ── Daily card ──────────────────────────────────── */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-separator/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[14px] font-bold text-text-primary">🎯 เป้าหมายวันนี้</p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  {goalPct >= 100 ? '🎉 บรรลุเป้าหมายแล้ว!' : `เหลืออีก ${Math.max(0, dailyGoal - todayXp)} XP`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[22px] font-extrabold text-text-primary">{todayXp}</span>
                <span className="text-[12px] text-text-tertiary">/{dailyGoal}</span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${goalPct}%` }} />
            </div>

            <div className="h-px bg-separator mb-4" />

            {user ? (
              <div className="flex items-center gap-3">
                {/* Streak counter */}
                <div className="flex flex-col items-center w-12 shrink-0">
                  <span className="text-[26px] leading-none">{checkedInToday ? '🔥' : '💤'}</span>
                  <span className="text-[20px] font-extrabold text-text-primary leading-none mt-0.5">{streak}</span>
                  <span className="text-[10px] text-text-secondary">วัน</span>
                </div>

                {/* Week dots */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-text-primary mb-2 truncate">{streakMsg(streak)}</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7].map(day => (
                      <div key={day} className="flex flex-col items-center gap-0.5">
                        <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] ${
                          day <= streak ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          {day <= streak ? '🔥' : ''}
                        </div>
                        <span className="text-[9px] text-text-tertiary">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Check-in button */}
                <div className="relative shrink-0">
                  {!checkedInToday ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={checkingIn}
                      className="flex flex-col items-center bg-primary text-white rounded-2xl px-3 py-2.5 disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all"
                    >
                      {checkingIn
                        ? <Loader2 size={18} className="animate-spin" />
                        : <>
                          <span className="text-[18px] leading-none">✅</span>
                          <span className="text-[11px] font-bold mt-1">เช็คอิน</span>
                          <span className="text-[10px] opacity-75">+20 XP</span>
                        </>}
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <CheckCircle size={30} className="text-success" />
                      <span className="text-[10px] text-success font-bold">เช็คอินแล้ว</span>
                      {checkInXp > 0 && <span className="text-[10px] text-text-secondary">+{checkInXp} XP</span>}
                    </div>
                  )}
                  {showXpPop && (
                    <div
                      className="absolute -top-8 left-1/2 text-[13px] font-bold text-primary whitespace-nowrap"
                      style={{ transform: 'translateX(-50%)', animation: 'slideUpPop 1.4s ease-out forwards' }}
                    >
                      +{checkInXp} XP 🎉
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link href="/auth" className="flex items-center justify-center gap-2 bg-primary/10 rounded-2xl py-3 text-[14px] font-bold text-primary">
                เข้าสู่ระบบเพื่อติดตามความคืบหน้า
              </Link>
            )}
          </div>

          {/* ── Announcements ────────────────────────────────── */}
          <div>
            <SectionHeader title="📢 ประกาศ" />
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {MOCK_ANNOUNCEMENTS.map(a => (
                <div
                  key={a.id}
                  className="rounded-2xl p-4 min-w-[260px] shrink-0"
                  style={{ background: `linear-gradient(135deg, ${a.color}ee, ${a.color})` }}
                >
                  <p className="text-white font-bold text-[14px] mb-1">{a.icon} {a.title}</p>
                  <p className="text-white/80 text-[12px] leading-relaxed">{a.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Career Paths ──────────────────────────────────── */}
          <div>
            <SectionHeader title="🗺️ Career Paths" href="/explore" />
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
              {CAREER_PATHS.map(p => (
                <Link
                  key={p.id}
                  href="/explore"
                  className="rounded-2xl p-3.5 min-w-[92px] shrink-0 flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
                  style={{ backgroundColor: p.bg }}
                >
                  <span className="text-[24px] leading-none">{p.icon}</span>
                  <span className="text-[11px] font-bold text-center leading-tight" style={{ color: p.color }}>{p.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Recommended Courses ───────────────────────────── */}
          {courses.length > 0 && (
            <div>
              <SectionHeader title="✨ แนะนำสำหรับคุณ" href="/explore" />
              <div className="grid grid-cols-2 gap-2.5">
                {courses.slice(0, 6).map((course: any) => {
                  const path = CAREER_PATHS.find(p => course.career_path?.toLowerCase().includes(p.id.split('-')[0]));
                  return (
                    <Link
                      key={course._id}
                      href={`/course-detail?id=${course._id}`}
                      className="bg-white rounded-2xl p-3 border border-separator/60 flex flex-col gap-2 hover:border-primary/30 active:scale-[0.98] transition-all shadow-sm"
                    >
                      <div
                        className="w-full h-[60px] rounded-xl flex items-center justify-center text-[26px]"
                        style={{ backgroundColor: path?.bg ?? '#F2F2F7' }}
                      >
                        {path?.icon ?? '📚'}
                      </div>
                      <p className="text-[13px] font-bold text-text-primary line-clamp-2 leading-snug">{course.title}</p>
                      <p className="text-[11px] text-text-tertiary">{course.total_lessons ?? 0} บทเรียน</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Articles ──────────────────────────────────────── */}
          <div>
            <SectionHeader title="📖 บทความแนะนำ" href="/articles" />
            <div className="flex flex-col gap-2.5">
              {ARTICLES.slice(0, 3).map(article => (
                <Link
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className="bg-white rounded-2xl p-3.5 flex items-center gap-3 border border-separator/60 hover:border-primary/30 transition-colors shadow-sm"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[24px] shrink-0"
                    style={{ backgroundColor: article.cover_color + '20' }}
                  >
                    {article.cover_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-text-primary line-clamp-2 leading-snug">{article.title}</p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">{article.read_time} นาที · {article.category}</p>
                  </div>
                  <ChevronRight size={16} className="text-text-tertiary shrink-0" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[15px] font-bold text-text-primary">{title}</p>
      {href && (
        <Link href={href} className="text-[13px] text-primary font-semibold flex items-center gap-0.5">
          ดูทั้งหมด <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

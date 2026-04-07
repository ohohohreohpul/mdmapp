'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, Loader2, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { ARTICLES } from '@/lib/articles';
import { HScroll, SectionHead, ProgressBar, Skel } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

/* ── Design tokens ────────────────────────── */
const C = {
  primary:  '#ef5ea8',
  bg:       '#F2F2F7',
  surface:  '#FFFFFF',
  ink:      '#1C1C1E',
  ink2:     '#8E8E93',
  ink3:     '#C7C7CC',
  card:     { boxShadow: '0px 2px 12px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' },
};

const PATHS = [
  { id: 'ux-design',          icon: '🎨', color: '#6366F1', bg: '#EEF2FF', label: 'UX Design' },
  { id: 'data-analysis',      icon: '📊', color: '#10B981', bg: '#ECFDF5', label: 'Data Analysis' },
  { id: 'digital-marketing',  icon: '📣', color: '#F59E0B', bg: '#FFFBEB', label: 'Digital Mktg' },
  { id: 'project-management', icon: '📋', color: '#ef5ea8', bg: '#FFF0F7', label: 'Project Mgmt' },
  { id: 'learning-designer',  icon: '🎓', color: '#8B5CF6', bg: '#F5F3FF', label: 'Learning' },
  { id: 'qa-tester',          icon: '🐛', color: '#D946EF', bg: '#FDF4FF', label: 'QA Tester' },
];

function streakMsg(n: number) {
  if (n >= 30) return `🌟 ${n} วัน!`;
  if (n >= 7)  return `🔥 ${n} วัน ครบสัปดาห์`;
  if (n >= 3)  return `⚡ ${n} วันต่อเนื่อง`;
  if (n === 1) return `🌱 วันแรก เริ่มต้นดี!`;
  return `🎯 เช็คอินเพื่อเริ่ม streak`;
}

export default function HomePage() {
  const { user } = useUser();
  const [dash, setDash]         = useState<any>(null);
  const [courses, setCourses]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [xpPop, setXpPop]   = useState(0);
  const [showPop, setShowPop] = useState(false);

  const todayKey = `ci_${new Date().toISOString().slice(0, 10)}`;

  const load = useCallback(async () => {
    try {
      const r = await axios.get(`${API_URL}/api/courses?published_only=true`);
      const all = Array.isArray(r.data) ? r.data : [];
      setCourses([...all].sort(() => 0.5 - Math.random()).slice(0, 8));
      if (user?._id) {
        axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`)
          .then(r => setDash(r.data)).catch(() => {});
      }
      setCheckedIn(localStorage.getItem(todayKey) === 'true');
    } catch { /* silent */ } finally { setLoading(false); }
  }, [user?._id, todayKey]);

  useEffect(() => { load(); }, [load]);

  const doCheckIn = async () => {
    if (!user || checkingIn || checkedIn) return;
    setCheckingIn(true);
    try {
      const r = await axios.post(`${API_URL}/api/gamification/daily-checkin`, { user_id: user._id });
      setCheckedIn(true);
      localStorage.setItem(todayKey, 'true');
      if (!r.data.already_checked_in) {
        const xp = r.data.xp_awarded ?? 20;
        setXpPop(xp); setShowPop(true);
        setTimeout(() => setShowPop(false), 1400);
        setDash((p: any) => p ? {
          ...p,
          today_xp: (p.today_xp ?? 0) + xp,
          daily_progress_percent: Math.min(100, Math.round(((p.today_xp ?? 0) + xp) / (p.daily_goal || 30) * 100)),
          current_streak: r.data.streak ?? p.current_streak,
        } : p);
      }
    } catch { /* silent */ } finally { setCheckingIn(false); }
  };

  const streak  = dash?.current_streak ?? 0;
  const level   = dash?.level_info?.level ?? 1;
  const lvlPct  = dash?.level_info?.progress_percent ?? 0;
  const goalPct = Math.min(dash?.daily_progress_percent ?? 0, 100);
  const todayXp = dash?.today_xp ?? 0;
  const goal    = dash?.daily_goal ?? 30;
  const xpTotal = dash?.xp_total ?? 0;
  const name    = (user?.display_name || user?.username || 'คุณ').split(' ')[0];
  const initial = (user?.display_name || user?.username || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ── Glass sticky header ─────────────────────────── */}
      <header
        className="sticky top-0 z-20 header-shell"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.10)',
        }}
      >
        <div className="flex items-center justify-between px-6 h-[54px] max-w-lg mx-auto">
          {/* Avatar + greeting */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(239,94,168,0.12)' }}
            >
              <span className="font-extrabold text-[14px]" style={{ color: C.primary }}>{initial}</span>
            </div>
            <div>
              <p className="text-[11px]" style={{ color: C.ink2 }}>สวัสดี 👋</p>
              <p className="text-[14px] font-bold leading-tight" style={{ color: C.ink }}>{name}</p>
            </div>
          </div>
          <Link
            href="/notifications"
            className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
          >
            <Bell size={18} style={{ color: C.ink2 }} />
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 pt-4 flex flex-col gap-4">

        {/* ── Hero greeting ──────────────────────────────── */}
        <div>
          <h1
            className="leading-tight"
            style={{ fontSize: '26px', fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', lineHeight: '32px' }}
          >
            เรียนรู้ทุกวัน ก้าวไปข้างหน้า 🚀
          </h1>
        </div>

        {/* ── Stats row ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: '🔥', val: streak,        sub: 'Streak' },
            { icon: '⚡', val: xpTotal,        sub: 'XP รวม' },
            { icon: '👑', val: `Lv.${level}`,  sub: 'ระดับ'  },
          ].map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-0.5 py-3 rounded-[18px]"
              style={{ backgroundColor: C.surface, ...C.card }}
            >
              <span className="text-[20px]">{s.icon}</span>
              <p className="text-[15px] font-bold" style={{ color: C.ink }}>{s.val}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: C.ink3 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Daily Goal card ───────────────────────────── */}
        <div
          className="rounded-[20px] p-4"
          style={{ backgroundColor: C.surface, ...C.card }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[15px] font-bold" style={{ color: C.ink }}>🎯 เป้าหมายวันนี้</p>
            <span className="text-[14px] font-bold" style={{ color: C.primary }}>
              {todayXp}
              <span className="text-[11px] font-normal" style={{ color: C.ink3 }}>/{goal} XP</span>
            </span>
          </div>
          <ProgressBar pct={goalPct} className="mb-3" />

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[12px] mb-2" style={{ color: C.ink2 }}>{streakMsg(streak)}</p>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5,6,7].map(d => (
                    <div
                      key={d}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] transition-all"
                      style={{
                        backgroundColor: d <= streak ? '#FFF0E6' : 'rgba(0,0,0,0.04)',
                        color: d <= streak ? '#F97316' : C.ink3,
                      }}
                    >
                      {d <= streak ? '🔥' : <span style={{ fontSize: '9px' }}>{d}</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative shrink-0">
                {!checkedIn ? (
                  <button
                    onClick={doCheckIn}
                    disabled={checkingIn}
                    className="flex flex-col items-center gap-0.5 rounded-[16px] px-4 py-3 active:scale-90 transition-transform disabled:opacity-50"
                    style={{ backgroundColor: C.primary, boxShadow: '0px 8px 24px rgba(239,94,168,0.30)' }}
                  >
                    {checkingIn
                      ? <Loader2 size={18} color="white" className="animate-spin" />
                      : <>
                          <span className="text-[22px] leading-none">✅</span>
                          <span className="text-[11px] font-bold text-white">เช็คอิน</span>
                          <span className="text-[9px] text-white opacity-80">+20 XP</span>
                        </>}
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle size={30} color="#34C759" />
                    <span className="text-[10px] font-bold" style={{ color: '#34C759' }}>เช็คอินแล้ว</span>
                  </div>
                )}
                {showPop && (
                  <span
                    className="absolute -top-8 left-1/2 text-[13px] font-bold whitespace-nowrap animate-pop-up"
                    style={{ color: C.primary }}
                  >
                    +{xpPop} XP 🎉
                  </span>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center justify-center gap-2 rounded-[14px] py-3 text-[14px] font-bold active:scale-[0.97] transition-transform"
              style={{ backgroundColor: 'rgba(239,94,168,0.08)', color: C.primary }}
            >
              เข้าสู่ระบบเพื่อติดตามความคืบหน้า →
            </Link>
          )}
        </div>

        {/* ── Level progress ──────────────────────────────── */}
        <div
          className="rounded-[18px] p-3.5 flex items-center gap-3"
          style={{ backgroundColor: C.surface, ...C.card }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[18px]"
            style={{ backgroundColor: 'rgba(139,92,246,0.12)' }}
          >
            👑
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[13px] font-bold" style={{ color: C.ink }}>Level {level}</p>
              <p className="text-[11px]" style={{ color: C.ink2 }}>{lvlPct}% → Lv.{level + 1}</p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${lvlPct}%`, backgroundColor: '#8B5CF6' }} />
            </div>
          </div>
        </div>

        {/* ── Announcements ─────────────────────────────── */}
        <div>
          <SectionHead title="📢 ประกาศ" />
          <HScroll>
            {[
              { title: 'ยินดีต้อนรับสู่ Mydemy! 🎉', body: 'พัฒนาทักษะด้วยคอร์สออนไลน์', icon: '📣', color: '#ef5ea8', bg: 'rgba(239,94,168,0.08)' },
              { title: 'คอร์สใหม่มาแล้ว!',           body: 'เปิดตัว UX/UI Design ฉบับสมบูรณ์', icon: '🆕', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
            ].map((a, i) => (
              <div
                key={i}
                className="rounded-[18px] p-3 min-w-[220px] shrink-0 flex gap-2.5 items-start"
                style={{ backgroundColor: a.bg, border: `1px solid ${a.color}22` }}
              >
                <span className="text-[22px] mt-0.5 shrink-0">{a.icon}</span>
                <div>
                  <p className="font-bold text-[13px] mb-0.5" style={{ color: C.ink }}>{a.title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: C.ink2 }}>{a.body}</p>
                </div>
              </div>
            ))}
          </HScroll>
        </div>

        {/* ── Courses ───────────────────────────────────── */}
        <div>
          <SectionHead title="📚 เริ่มเรียนเลย" href="/explore" />
          {loading ? (
            <HScroll>
              {[1,2,3].map(i => <Skel key={i} className="w-[140px] h-[160px] shrink-0 rounded-[18px]" />)}
            </HScroll>
          ) : (
            <HScroll>
              {courses.map((c: any) => {
                const p = PATHS.find(x => c.career_path?.toLowerCase().includes(x.id.split('-')[0]));
                return (
                  <Link
                    key={c._id}
                    href={`/course-detail?id=${c._id}`}
                    className="shrink-0 w-[140px] active:scale-[0.97] transition-transform overflow-hidden rounded-[18px]"
                    style={{ backgroundColor: C.surface, ...C.card }}
                  >
                    <div
                      className="w-full h-[76px] flex items-center justify-center text-[30px]"
                      style={{ backgroundColor: p?.bg ?? '#F3F0FF' }}
                    >
                      {p?.icon ?? '📚'}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-bold line-clamp-2 leading-snug mb-1" style={{ color: C.ink }}>{c.title}</p>
                      <div className="flex items-center gap-1">
                        <BookOpen size={9} style={{ color: C.ink3 }} />
                        <p className="text-[10px]" style={{ color: C.ink3 }}>{c.total_lessons ?? 0} บทเรียน</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </HScroll>
          )}
        </div>

        {/* ── Career Paths ─────────────────────────────── */}
        <div>
          <SectionHead title="🗺️ Career Paths" href="/explore" />
          <div className="grid grid-cols-3 gap-3">
            {PATHS.map(p => (
              <Link
                key={p.id}
                href="/explore"
                className="rounded-[20px] p-3.5 flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                style={{ backgroundColor: p.bg, border: '1px solid rgba(0,0,0,0.04)' }}
              >
                <span className="text-[24px] leading-none">{p.icon}</span>
                <span className="text-[10px] font-bold text-center leading-tight" style={{ color: p.color }}>{p.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Articles ──────────────────────────────────── */}
        <div className="pb-4">
          <SectionHead title="📖 บทความแนะนำ" href="/articles" />
          <div className="flex flex-col gap-3">
            {ARTICLES.slice(0, 3).map(a => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="rounded-[20px] p-4 flex items-center gap-3 active:scale-[0.97] transition-transform"
                style={{ backgroundColor: C.surface, ...C.card }}
              >
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] shrink-0"
                  style={{ backgroundColor: a.cover_color + '18' }}
                >
                  {a.cover_emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold line-clamp-2 leading-snug mb-1" style={{ color: C.ink }}>{a.title}</p>
                  <p className="text-[11px]" style={{ color: C.ink3 }}>{a.read_time} นาที · {a.category}</p>
                </div>
                <ChevronRight size={16} style={{ color: C.ink3 }} className="shrink-0" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

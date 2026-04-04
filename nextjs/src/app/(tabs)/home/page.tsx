'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, Loader2, ChevronRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { ARTICLES } from '@/lib/articles';
import { HScroll, SectionHead, ProgressBar, Skel } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const PATHS = [
  { id: 'ux-design',          icon: '🎨', color: '#6366F1', bg: '#EEF2FF', label: 'UX Design' },
  { id: 'data-analysis',      icon: '📊', color: '#10B981', bg: '#ECFDF5', label: 'Data Analysis' },
  { id: 'digital-marketing',  icon: '📣', color: '#F59E0B', bg: '#FFFBEB', label: 'Digital Mktg' },
  { id: 'project-management', icon: '📋', color: '#e8409b', bg: '#fce7f3', label: 'Project Mgmt' },
  { id: 'learning-designer',  icon: '🎓', color: '#8B5CF6', bg: '#F5F3FF', label: 'Learning' },
  { id: 'qa-tester',          icon: '🐛', color: '#D946EF', bg: '#FDF4FF', label: 'QA Tester' },
];

function streakMsg(n: number) {
  if (n >= 30) return `🌟 ${n} วัน! สุดยอดมาก`;
  if (n >= 7)  return `🔥 ${n} วัน! ครบสัปดาห์แล้ว`;
  if (n >= 3)  return `⚡ ${n} วันต่อเนื่อง`;
  if (n === 2) return `✨ 2 วันต่อเนื่อง รักษาไว้`;
  if (n === 1) return `🌱 วันแรก เริ่มต้นที่ดี`;
  return `🎯 เช็คอินวันนี้เพื่อเริ่ม streak`;
}

export default function HomePage() {
  const { user } = useUser();
  const [dash, setDash]           = useState<any>(null);
  const [courses, setCourses]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
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
    <div className="min-h-screen bg-bg">
      <div className="max-w-lg mx-auto">

        {/* ── Gradient hero ─────────────────────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(160deg, #f472b6 0%, #e8409b 55%, #c7357f 100%)',
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
            paddingBottom: '48px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          {/* Avatar + greeting + bell */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center shrink-0 border-2 border-white/40"
                 style={{ background: 'rgba(255,255,255,0.22)' }}>
              <span className="text-white font-extrabold text-[18px]">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/75 text-[12px] leading-none mb-0.5">สวัสดี 👋</p>
              <p className="text-white font-extrabold text-[20px] leading-tight truncate">{name}</p>
            </div>
            <Link href="/notifications"
                  className="w-11 h-11 flex items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.18)' }}>
              <Bell size={20} className="text-white" />
            </Link>
          </div>

          {/* Stat pills */}
          <div className="flex gap-2 mb-5">
            {[
              { icon: '🔥', val: streak,         sub: 'วัน' },
              { icon: '⚡', val: xpTotal,         sub: 'XP'  },
              { icon: '👑', val: `Lv.${level}`,  sub: ''    },
            ].map((s, i) => (
              <div key={i}
                   className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                   style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <span className="text-[14px]">{s.icon}</span>
                <span className="text-[14px] font-bold text-white">{s.val}</span>
                {s.sub && <span className="text-[11px] text-white/65">{s.sub}</span>}
              </div>
            ))}
          </div>

          {/* Level progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)' }}>
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${lvlPct}%` }} />
            </div>
            <span className="text-[11px] text-white/60 shrink-0">{lvlPct}% → Lv.{level + 1}</span>
          </div>
        </div>

        {/* ── Page body: pulled UP over the hero bottom ─────────── */}
        <div className="px-4 flex flex-col gap-5" style={{ marginTop: '-28px' }}>

          {/* ── Daily goal card (floats over hero) ──────────────── */}
          <div className="bg-surface rounded-3xl p-4"
               style={{ boxShadow: '0 8px 32px rgba(232,64,155,0.18), 0 2px 8px rgba(0,0,0,0.08)' }}>

            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[15px] font-bold text-ink">🎯 เป้าหมายวันนี้</p>
              <span className="text-[16px] font-extrabold text-brand">
                {todayXp}<span className="text-[11px] font-normal text-ink-3">/{goal} XP</span>
              </span>
            </div>
            <ProgressBar pct={goalPct} className="mb-3" />

            {user ? (
              <div className="flex items-center gap-3 pt-1 border-t border-rim">
                {/* Streak dots */}
                <div className="flex-1">
                  <p className="text-[12px] text-ink-2 mb-2">{streakMsg(streak)}</p>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5,6,7].map(d => (
                      <div key={d}
                           className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] transition-all ${d <= streak ? 'bg-orange-400' : 'bg-bg'}`}>
                        {d <= streak ? '🔥' : <span className="text-ink-3 text-[9px]">{d}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Check-in btn */}
                <div className="relative shrink-0">
                  {!checkedIn ? (
                    <button
                      onClick={doCheckIn}
                      disabled={checkingIn}
                      className="flex flex-col items-center gap-0.5 bg-brand text-white rounded-2xl px-4 py-2.5 disabled:opacity-50 active:scale-95 transition-all"
                      style={{ boxShadow: '0 4px 14px rgba(232,64,155,0.4)' }}>
                      {checkingIn
                        ? <Loader2 size={18} className="animate-spin" />
                        : <>
                            <span className="text-[20px] leading-none">✅</span>
                            <span className="text-[11px] font-bold">เช็คอิน</span>
                            <span className="text-[9px] opacity-75">+20 XP</span>
                          </>}
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <CheckCircle size={28} className="text-[#10B981]" />
                      <span className="text-[10px] text-[#10B981] font-bold">เช็คอินแล้ว</span>
                    </div>
                  )}
                  {showPop && (
                    <span className="absolute -top-8 left-1/2 text-[13px] font-bold text-brand whitespace-nowrap animate-pop-up">
                      +{xpPop} XP 🎉
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Link href="/auth"
                    className="flex items-center justify-center gap-2 mt-1 rounded-2xl py-2.5 text-[14px] font-bold text-brand"
                    style={{ background: 'rgba(232,64,155,0.08)' }}>
                เข้าสู่ระบบเพื่อติดตามความคืบหน้า →
              </Link>
            )}
          </div>

          {/* ── Announcements ─────────────────────────────────── */}
          <div>
            <SectionHead title="📢 ประกาศ" />
            <HScroll>
              {[
                { title: 'ยินดีต้อนรับสู่ Mydemy! 🎉', body: 'เราพร้อมช่วยคุณพัฒนาทักษะด้วยคอร์สออนไลน์', icon: '📣', grad: 'linear-gradient(135deg,#e8409b,#c7357f)' },
                { title: 'คอร์สใหม่มาแล้ว!', body: 'เปิดตัวคอร์ส UX/UI Design ฉบับสมบูรณ์', icon: '🆕', grad: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
              ].map((a, i) => (
                <div key={i} className="rounded-2xl p-4 min-w-[270px] shrink-0 flex gap-3 items-start"
                     style={{ background: a.grad }}>
                  <span className="text-[28px] mt-0.5 shrink-0">{a.icon}</span>
                  <div>
                    <p className="text-white font-bold text-[14px] mb-1">{a.title}</p>
                    <p className="text-white/75 text-[12px] leading-relaxed">{a.body}</p>
                  </div>
                </div>
              ))}
            </HScroll>
          </div>

          {/* ── Course section ────────────────────────────────── */}
          <div>
            <SectionHead title="📚 เริ่มเรียนเลย" href="/explore" />
            {loading ? (
              <HScroll>
                {[1,2,3].map(i => <Skel key={i} className="w-[180px] h-[180px] shrink-0 rounded-2xl" />)}
              </HScroll>
            ) : (
              <HScroll>
                {courses.map((c: any) => {
                  const p = PATHS.find(x => c.career_path?.toLowerCase().includes(x.id.split('-')[0]));
                  const thumbBg = p?.bg ?? '#ede9fe';
                  const thumbIcon = p?.icon ?? '📚';
                  return (
                    <Link
                      key={c._id}
                      href={`/course-detail?id=${c._id}`}
                      className="bg-surface rounded-2xl overflow-hidden shrink-0 w-[175px] active:scale-[0.96] transition-transform"
                      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.10)', border: '1px solid #e8e8f0' }}
                    >
                      {/* Thumbnail */}
                      <div className="w-full h-[95px] flex items-center justify-center text-[38px]"
                           style={{ backgroundColor: thumbBg }}>
                        {thumbIcon}
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="text-[13px] font-bold text-ink line-clamp-2 leading-snug mb-2">{c.title}</p>
                        <div className="flex items-center gap-1">
                          <BookOpen size={11} className="text-ink-3" />
                          <p className="text-[11px] text-ink-3">{c.total_lessons ?? 0} บทเรียน</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </HScroll>
            )}
          </div>

          {/* ── Career Paths ──────────────────────────────────── */}
          <div>
            <SectionHead title="🗺️ Career Paths" href="/explore" />
            <div className="grid grid-cols-3 gap-2.5">
              {PATHS.map(p => (
                <Link
                  key={p.id}
                  href="/explore"
                  className="rounded-2xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
                  style={{ backgroundColor: p.bg, border: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <span className="text-[22px] leading-none">{p.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight" style={{ color: p.color }}>{p.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Articles ──────────────────────────────────────── */}
          <div className="pb-4">
            <SectionHead title="📖 บทความแนะนำ" href="/articles" />
            <div className="flex flex-col gap-2.5">
              {ARTICLES.slice(0, 3).map(a => (
                <Link
                  key={a.id}
                  href={`/articles/${a.id}`}
                  className="bg-surface rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
                  style={{ boxShadow: '0 1px 0 #e8e8f0, 0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e8e8f0' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[24px] shrink-0"
                       style={{ backgroundColor: a.cover_color + '22' }}>{a.cover_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink line-clamp-2 leading-snug">{a.title}</p>
                    <p className="text-[11px] text-ink-3 mt-0.5">{a.read_time} นาที · {a.category}</p>
                  </div>
                  <ChevronRight size={16} className="text-ink-3 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

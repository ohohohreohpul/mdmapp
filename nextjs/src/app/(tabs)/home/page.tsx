'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { ARTICLES } from '@/lib/articles';
import { GradHero, HScroll, SectionHead, ProgressBar, Skel } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const PATHS = [
  { id: 'ux-design',          icon: '🎨', color: '#6366F1', bg: '#EEF2FF', label: 'UX Design' },
  { id: 'data-analysis',      icon: '📊', color: '#10B981', bg: '#ECFDF5', label: 'Data Analysis' },
  { id: 'digital-marketing',  icon: '📣', color: '#F59E0B', bg: '#FFFBEB', label: 'Digital Mktg' },
  { id: 'project-management', icon: '📋', color: '#e8409b', bg: '#fce7f3', label: 'Project Mgmt' },
  { id: 'learning-designer',  icon: '🎓', color: '#8B5CF6', bg: '#F5F3FF', label: 'Learning Design' },
  { id: 'qa-tester',          icon: '🐛', color: '#D946EF', bg: '#FDF4FF', label: 'QA Tester' },
];

function streakMsg(n: number) {
  if (n >= 30) return `🌟 ${n} วัน! สุดยอดมาก`;
  if (n >= 7)  return `🔥 ${n} วัน! ครบสัปดาห์แล้ว`;
  if (n >= 3)  return `⚡ ${n} วันต่อเนื่อง ไปต่อเลย`;
  if (n === 2) return `✨ 2 วันต่อเนื่อง รักษาไว้นะ`;
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
      setCourses([...all].sort(() => 0.5 - Math.random()).slice(0, 6));
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

        {/* ── Gradient hero ─────────────────────────── */}
        <GradHero>
          {/* Top row: avatar + name + bell */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-full bg-white/25 border-2 border-white/30 flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-[17px]">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-[12px] leading-none mb-0.5">สวัสดี 👋</p>
              <p className="text-white font-extrabold text-[18px] truncate leading-tight">{name}</p>
            </div>
            <Link href="/notifications" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15">
              <Bell size={20} className="text-white" />
            </Link>
          </div>

          {/* Stat pills */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { icon: '🔥', val: streak,          sub: 'วัน' },
              { icon: '⚡', val: xpTotal,          sub: 'XP' },
              { icon: '👑', val: `Lv.${level}`,   sub: '' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                <span className="text-[14px]">{s.icon}</span>
                <span className="text-[14px] font-bold text-white">{s.val}</span>
                {s.sub && <span className="text-[11px] text-white/65">{s.sub}</span>}
              </div>
            ))}
          </div>

          {/* Level progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/25 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${lvlPct}%` }} />
            </div>
            <span className="text-[11px] text-white/60 shrink-0">{lvlPct}% → Lv.{level + 1}</span>
          </div>
        </GradHero>

        <div className="px-4 pt-4 pb-6 flex flex-col gap-5">

          {/* ── Daily goal + check-in ────────────────── */}
          <div className="bg-surface rounded-2xl p-4 card-shadow border border-rim">
            {/* Goal row */}
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[14px] font-bold text-ink">🎯 เป้าหมายวันนี้</p>
              <span className="text-[15px] font-extrabold text-brand">{todayXp}<span className="text-[11px] font-normal text-ink-3">/{goal} XP</span></span>
            </div>
            <ProgressBar pct={goalPct} className="mb-4" />

            <div className="flex items-center gap-3">
              {/* Streak counter */}
              <div className="bg-orange-50 rounded-2xl px-4 py-3 flex flex-col items-center min-w-[60px]">
                <span className="text-[24px] leading-none">{checkedIn ? '🔥' : '💤'}</span>
                <span className="text-[18px] font-extrabold text-ink leading-none">{streak}</span>
                <span className="text-[10px] text-ink-3">วัน</span>
              </div>

              {/* Streak dots */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-ink-2 mb-2 truncate">{streakMsg(streak)}</p>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5,6,7].map(d => (
                    <div
                      key={d}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-colors ${d <= streak ? 'bg-orange-400' : 'bg-rim'}`}
                    >
                      {d <= streak ? '🔥' : <span className="text-ink-3 text-[10px]">{d}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Check-in button */}
              <div className="relative shrink-0">
                {user ? (
                  !checkedIn ? (
                    <button
                      onClick={doCheckIn}
                      disabled={checkingIn}
                      className="flex flex-col items-center gap-0.5 bg-brand text-white rounded-2xl px-3.5 py-2.5 disabled:opacity-50 active:scale-95 transition-all shadow-[0_4px_12px_rgba(232,64,155,0.35)]"
                    >
                      {checkingIn
                        ? <Loader2 size={18} className="animate-spin" />
                        : <>
                            <span className="text-[20px] leading-none">✅</span>
                            <span className="text-[11px] font-bold">เช็คอิน</span>
                            <span className="text-[10px] opacity-75">+20 XP</span>
                          </>}
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 px-2">
                      <CheckCircle size={28} className="text-ok" />
                      <span className="text-[10px] text-ok font-bold">เช็คอินแล้ว</span>
                    </div>
                  )
                ) : (
                  <Link href="/auth" className="text-brand text-[12px] font-bold">เข้าสู่ระบบ</Link>
                )}
                {showPop && (
                  <span className="absolute -top-8 left-1/2 text-[13px] font-bold text-brand whitespace-nowrap animate-pop-up">
                    +{xpPop} XP 🎉
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Announcements ───────────────────────── */}
          <div>
            <SectionHead title="📢 ประกาศ" />
            <HScroll>
              {[
                { title: 'ยินดีต้อนรับสู่ Mydemy! 🎉', body: 'เราพร้อมช่วยคุณพัฒนาทักษะ', grad: '#e8409b, #c7357f' },
                { title: 'คอร์สใหม่มาแล้ว! 🆕', body: 'เปิดตัวคอร์ส UX/UI Design ฉบับสมบูรณ์', grad: '#8b5cf6, #6d28d9' },
              ].map((a, i) => (
                <div key={i}
                     className="rounded-2xl p-4 min-w-[260px] shrink-0"
                     style={{ background: `linear-gradient(135deg, ${a.grad})` }}>
                  <p className="text-white font-bold text-[14px] mb-1">{a.title}</p>
                  <p className="text-white/75 text-[12px] leading-relaxed">{a.body}</p>
                </div>
              ))}
            </HScroll>
          </div>

          {/* ── Career Paths ─────────────────────────── */}
          <div>
            <SectionHead title="🗺️ Career Paths" href="/explore" />
            <HScroll>
              {PATHS.map(p => (
                <Link
                  key={p.id}
                  href="/explore"
                  className="rounded-2xl p-3.5 min-w-[96px] shrink-0 flex flex-col items-center gap-1.5 active:scale-95 transition-transform border border-rim/60 card-shadow"
                  style={{ backgroundColor: p.bg }}
                >
                  <span className="text-[26px] leading-none">{p.icon}</span>
                  <span className="text-[11px] font-bold text-center leading-tight" style={{ color: p.color }}>{p.label}</span>
                </Link>
              ))}
            </HScroll>
          </div>

          {/* ── Recommended courses ───────────────────── */}
          {(loading || courses.length > 0) && (
            <div>
              <SectionHead title="✨ แนะนำสำหรับคุณ" href="/explore" />
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1,2,3,4].map(i => <Skel key={i} className="h-[140px] rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {courses.map((c: any) => {
                    const p = PATHS.find(x => c.career_path?.toLowerCase().includes(x.id.split('-')[0]));
                    return (
                      <Link
                        key={c._id}
                        href={`/course-detail?id=${c._id}`}
                        className="bg-surface rounded-2xl overflow-hidden card-shadow border border-rim active:scale-[0.97] transition-transform"
                      >
                        <div
                          className="w-full h-[72px] flex items-center justify-center text-[32px]"
                          style={{ backgroundColor: p?.bg ?? '#ede9fe' }}
                        >
                          {p?.icon ?? '📚'}
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] font-bold text-ink line-clamp-2 leading-snug mb-1">{c.title}</p>
                          <p className="text-[11px] text-ink-3">{c.total_lessons ?? 0} บทเรียน</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Articles ──────────────────────────────── */}
          <div>
            <SectionHead title="📖 บทความแนะนำ" href="/articles" />
            <div className="flex flex-col gap-2.5">
              {ARTICLES.slice(0, 3).map(a => (
                <Link
                  key={a.id}
                  href={`/articles/${a.id}`}
                  className="bg-surface rounded-2xl p-3.5 flex items-center gap-3 card-shadow border border-rim active:scale-[0.98] transition-transform"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[24px] shrink-0"
                    style={{ backgroundColor: a.cover_color + '22' }}
                  >{a.cover_emoji}</div>
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

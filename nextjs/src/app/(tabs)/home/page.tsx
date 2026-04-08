'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { ARTICLES } from '@/lib/articles';
import { HScroll, SectionHead, ProgressBar, Skel } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

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
  const [dash, setDash]           = useState<any>(null);
  const [courses, setCourses]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [xpPop, setXpPop]         = useState(0);
  const [showPop, setShowPop]     = useState(false);

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
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 header-shell"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex items-center justify-between max-w-lg mx-auto"
          style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}
        >
          <div className="flex items-center" style={{ gap: 10 }}>
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 36, height: 36, backgroundColor: 'rgba(239,94,168,0.12)', flexShrink: 0 }}
            >
              <span style={{ fontSize: 14, fontWeight: 800, color: C.primary }}>{initial}</span>
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.ink2, lineHeight: 1.2 }}>สวัสดี 👋</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{name}</p>
            </div>
          </div>
          <Link
            href="/notifications"
            className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{ width: 36, height: 36, backgroundColor: 'rgba(0,0,0,0.05)' }}
          >
            <Bell size={17} style={{ color: C.ink2 }} />
          </Link>
        </div>
      </header>

      {/* ── Page content ────────────────────────────────────── */}
      <div
        className="max-w-lg mx-auto flex flex-col"
        style={{ padding: '24px 20px 0', gap: 24 }}
      >

        {/* Hero */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.primary, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
            Mydemy
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            เรียนรู้วันนี้<br />เปลี่ยนชีวิตพรุ่งนี้
          </h1>
        </div>

        {/* Stats — single card, 3 columns */}
        <div style={{ ...cardStyle, display: 'flex', overflow: 'hidden' }}>
          {[
            { emoji: '🔥', val: streak,        label: 'Streak' },
            { emoji: '⚡', val: xpTotal,        label: 'XP รวม' },
            { emoji: '👑', val: `Lv.${level}`,  label: 'ระดับ' },
          ].map((s, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center"
              style={{
                padding: '16px 0',
                borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 4, lineHeight: 1 }}>{s.val}</span>
              <span style={{ fontSize: 11, color: C.ink3, marginTop: 3 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Daily goal */}
        <div style={cardStyle}>
          <div style={{ padding: 16 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>🎯 เป้าหมายวันนี้</p>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>
                {todayXp}
                <span style={{ fontSize: 11, fontWeight: 400, color: C.ink3 }}>/{goal} XP</span>
              </span>
            </div>
            <ProgressBar pct={goalPct} />

            <div style={{ marginTop: 14 }}>
              {user ? (
                <div className="flex items-center" style={{ gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: C.ink2, marginBottom: 8 }}>{streakMsg(streak)}</p>
                    <div className="flex" style={{ gap: 5 }}>
                      {[1, 2, 3, 4, 5, 6, 7].map(d => (
                        <div
                          key={d}
                          className="flex items-center justify-center rounded-full"
                          style={{
                            width: 26, height: 26, fontSize: d <= streak ? 12 : 10,
                            backgroundColor: d <= streak ? '#FFF0E6' : 'rgba(0,0,0,0.05)',
                            color: d <= streak ? '#F97316' : C.ink3,
                          }}
                        >
                          {d <= streak ? '🔥' : d}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {!checkedIn ? (
                      <button
                        onClick={doCheckIn}
                        disabled={checkingIn}
                        className="flex flex-col items-center active:scale-90 transition-transform disabled:opacity-50"
                        style={{
                          gap: 3, backgroundColor: C.primary,
                          borderRadius: 14, padding: '10px 14px',
                          boxShadow: '0px 8px 24px rgba(239,94,168,0.30)',
                        }}
                      >
                        {checkingIn
                          ? <Loader2 size={18} color="white" className="animate-spin" />
                          : <>
                              <span style={{ fontSize: 20 }}>✅</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>เช็คอิน</span>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>+20 XP</span>
                            </>}
                      </button>
                    ) : (
                      <div className="flex flex-col items-center" style={{ gap: 4 }}>
                        <CheckCircle size={28} color="#34C759" />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#34C759' }}>เช็คอินแล้ว</span>
                      </div>
                    )}
                    {showPop && (
                      <span
                        className="absolute animate-pop-up"
                        style={{
                          top: -32, left: '50%', transform: 'translateX(-50%)',
                          fontSize: 13, fontWeight: 700, color: C.primary,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        +{xpPop} XP 🎉
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center justify-center active:scale-[0.97] transition-transform"
                  style={{
                    borderRadius: 12, padding: '12px 16px',
                    backgroundColor: 'rgba(239,94,168,0.08)',
                    fontSize: 14, fontWeight: 600, color: C.primary,
                  }}
                >
                  เข้าสู่ระบบเพื่อติดตามความคืบหน้า →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Level progress */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 44, height: 44, backgroundColor: 'rgba(139,92,246,0.10)', flexShrink: 0, fontSize: 20 }}
          >
            👑
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 7 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Level {level}</span>
              <span style={{ fontSize: 12, color: C.ink2 }}>{lvlPct}% → Lv.{level + 1}</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${lvlPct}%`, backgroundColor: '#8B5CF6', borderRadius: 99, transition: 'width 0.7s' }} />
            </div>
          </div>
        </div>

        {/* Courses */}
        <div>
          <SectionHead title="📚 เริ่มเรียนเลย" href="/explore" />
          {loading ? (
            <HScroll>
              {[1, 2, 3].map(i => (
                <Skel key={i} style={{ width: 140, height: 152, flexShrink: 0, borderRadius: 16 }} />
              ))}
            </HScroll>
          ) : (
            <HScroll>
              {courses.map((c: any) => {
                const p = PATHS.find(x => c.career_path?.toLowerCase().includes(x.id.split('-')[0]));
                return (
                  <Link
                    key={c._id}
                    href={`/course-detail?id=${c._id}`}
                    className="active:scale-[0.97] transition-transform"
                    style={{ ...cardStyle, width: 140, flexShrink: 0, overflow: 'hidden', display: 'block' }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{ height: 76, backgroundColor: p?.bg ?? '#F3F0FF', fontSize: 30 }}
                    >
                      {p?.icon ?? '📚'}
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <p className="line-clamp-2" style={{ fontSize: 12, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>
                        {c.title}
                      </p>
                      <p style={{ fontSize: 10, color: C.ink3, marginTop: 5 }}>{c.total_lessons ?? 0} บทเรียน</p>
                    </div>
                  </Link>
                );
              })}
            </HScroll>
          )}
        </div>

        {/* Career paths — horizontal pill chips */}
        <div>
          <SectionHead title="🗺️ Career Paths" href="/explore" />
          <HScroll>
            {PATHS.map(p => (
              <Link
                key={p.id}
                href="/explore"
                className="flex items-center active:scale-[0.97] transition-transform"
                style={{
                  gap: 8, flexShrink: 0,
                  backgroundColor: p.bg,
                  borderRadius: 99,
                  padding: '9px 16px',
                  border: '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ fontSize: 18 }}>{p.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: p.color, whiteSpace: 'nowrap' }}>{p.label}</span>
              </Link>
            ))}
          </HScroll>
        </div>

        {/* Articles */}
        <div style={{ paddingBottom: 24 }}>
          <SectionHead title="📖 บทความแนะนำ" href="/articles" />
          <div className="flex flex-col" style={{ gap: 10 }}>
            {ARTICLES.slice(0, 3).map(a => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="active:scale-[0.97] transition-transform"
                style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 48, height: 48, borderRadius: 12,
                    backgroundColor: a.cover_color + '18',
                    flexShrink: 0, fontSize: 22,
                  }}
                >
                  {a.cover_emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="line-clamp-2" style={{ fontSize: 14, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>
                    {a.title}
                  </p>
                  <p style={{ fontSize: 12, color: C.ink3, marginTop: 3 }}>{a.read_time} นาที · {a.category}</p>
                </div>
                <ChevronRight size={16} style={{ color: C.ink3, flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

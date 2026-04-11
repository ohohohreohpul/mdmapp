'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, Bug } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { PrimaryBtn } from '@/lib/ui';
import axios from 'axios';

const API_URL    = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];
const BUG_EMAIL  = 'bug@mydemy.co';

const C = {
  primary: '#ef5ea8',
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
};

interface GamDashboard { xp_total: number; level_info: { level: number; progress_percent: number }; current_streak: number; }

// ── Bug report bottom sheet ───────────────────────────────────────────────────
function BugReportSheet({ userEmail, onClose }: { userEmail: string; onClose: () => void }) {
  const [desc, setDesc] = useState('');
  const [sent, setSent] = useState(false);
  const sheetRef        = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSend = () => {
    if (!desc.trim()) return;
    const subject = encodeURIComponent('แจ้งปัญหา Mydemy App');
    const body    = encodeURIComponent(
      `จาก: ${userEmail}\n\nรายละเอียดปัญหา:\n${desc.trim()}\n\n---\nDevice: ${navigator.userAgent}`,
    );
    // ── TO SWITCH TO RESEND: replace the line below with a fetch('/api/bug-report', ...) call
    window.open(`mailto:${BUG_EMAIL}?subject=${subject}&body=${body}`);
    setSent(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div ref={sheetRef} style={{ width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '12px 20px 40px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.12)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bug size={18} style={{ color: C.ink2 }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>แจ้งปัญหา</p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.06)', color: C.ink2, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        {sent ? (
          <p style={{ textAlign: 'center', fontSize: 15, color: '#34C759', fontWeight: 600, padding: '24px 0' }}>ขอบคุณ! เราได้รับรายงานแล้ว 🙏</p>
        ) : (
          <>
            <textarea
              placeholder="อธิบายปัญหาที่พบ เช่น หน้าใด, ทำอะไรอยู่, เกิดอะไรขึ้น…"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={5}
              style={{ width: '100%', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(0,0,0,0.10)', fontSize: 14, color: C.ink, lineHeight: 1.55, resize: 'none', backgroundColor: C.bg, outline: 'none', fontFamily: 'inherit' }}
            />
            <p style={{ fontSize: 11, color: C.ink3, marginTop: 6, marginBottom: 16 }}>จะส่งไปยัง {BUG_EMAIL} พร้อมข้อมูล device อัตโนมัติ</p>
            <button
              onClick={handleSend}
              disabled={!desc.trim()}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', backgroundColor: desc.trim() ? C.primary : 'rgba(0,0,0,0.08)', color: desc.trim() ? '#fff' : C.ink3, fontSize: 15, fontWeight: 700, cursor: desc.trim() ? 'pointer' : 'default', transition: 'background-color 0.15s' }}
            >
              ส่งรายงาน
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [gam, setGam]                 = useState<GamDashboard | null>(null);
  const [showBugSheet, setShowBugSheet] = useState(false);
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  useEffect(() => {
    if (user?._id) {
      axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`)
        .then(r => setGam(r.data)).catch(() => {});
    }
  }, [user?._id]);

  const handleLogout = () => { logout(); router.replace('/auth'); };

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!user) return (
    <div style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <div className="sticky top-0 z-20 header-shell" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center max-w-lg mx-auto" style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>โปรไฟล์</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto flex flex-col items-center text-center" style={{ padding: '64px 20px', gap: 20 }}>
        <div className="flex items-center justify-center rounded-full" style={{ width: 88, height: 88, backgroundColor: 'rgba(239,94,168,0.10)', fontSize: 36 }}>👤</div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 8 }}>เข้าสู่ระบบ</h2>
          <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.55 }}>บันทึกความคืบหน้า ดูคะแนน<br />และรับใบประกาศนียบัตร</p>
        </div>
        <PrimaryBtn href="/auth">เข้าสู่ระบบ / สมัครสมาชิก</PrimaryBtn>
      </div>
    </div>
  );

  const initial  = (user.display_name || user.username || 'U')[0].toUpperCase();
  const level    = gam?.level_info?.level ?? 1;
  const lvlPct   = gam?.level_info?.progress_percent ?? 0;
  const streak   = gam?.current_streak ?? 0;
  const xpTotal  = gam?.xp_total ?? 0;

  return (
    <div style={{ backgroundColor: C.bg }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 header-shell" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center max-w-lg mx-auto" style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>โปรไฟล์</h1>
        </div>
      </div>

      {/* ── Hero profile card ──────────────────────────────────── */}
      <div style={{ backgroundColor: C.bg }}>
        <div className="max-w-lg mx-auto" style={{ padding: '20px 20px 0' }}>
          <div style={{
            borderRadius: 24,
            background: 'linear-gradient(145deg, #fff 0%, #FEF0F8 100%)',
            border: '1px solid rgba(239,94,168,0.12)',
            boxShadow: '0 4px 24px rgba(239,94,168,0.10), 0 1px 4px rgba(0,0,0,0.06)',
            padding: '28px 20px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginBottom: 20,
          }}>
            {/* Avatar */}
            <div style={{
              width: 88, height: 88, borderRadius: 44,
              background: 'linear-gradient(135deg, #f98dcb, #ef5ea8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: '#fff',
              boxShadow: '0 8px 24px rgba(239,94,168,0.35)',
              marginBottom: 14,
            }}>
              {initial}
            </div>

            {/* Level badge */}
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.primary,
              backgroundColor: 'rgba(239,94,168,0.10)',
              borderRadius: 20, padding: '3px 10px',
              marginBottom: 8,
            }}>
              ✨ Level {level}
            </span>

            {/* Name + email */}
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', marginBottom: 4, textAlign: 'center' }}>
              {user.display_name || user.username || 'User'}
            </h2>
            <p style={{ fontSize: 13, color: C.ink2, marginBottom: 20 }}>{user.email}</p>

            {/* Level progress bar */}
            <div style={{ width: '100%', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: C.ink3 }}>XP ไปยัง Level {level + 1}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>{lvlPct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${lvlPct}%`, borderRadius: 3, background: 'linear-gradient(90deg, #f98dcb, #ef5ea8)', transition: 'width 0.6s ease' }} />
              </div>
            </div>

            {/* Stats row */}
            <div style={{ width: '100%', display: 'flex', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' }}>
              {[
                { emoji: '⚡', val: xpTotal,        label: 'XP รวม' },
                { emoji: '🔥', val: streak,          label: 'Streak' },
                { emoji: '👑', val: `Lv.${level}`,   label: 'ระดับ' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <span style={{ fontSize: 18, lineHeight: 1, marginBottom: 4 }}>{s.emoji}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: C.ink, lineHeight: 1 }}>{s.val}</span>
                  <span style={{ fontSize: 10, color: C.ink3, marginTop: 3 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Menu sections ──────────────────────────────────────── */}
      <div className="max-w-lg mx-auto flex flex-col" style={{ padding: '0 20px 36px', gap: 24 }}>

        <MenuSection title="การเรียนรู้">
          <MenuItem href="/certificates" emoji="🏅" bg="#FFF0F7" title="ใบประกาศนียบัตร" sub="ดูและดาวน์โหลดใบประกาศ" />
          <MenuItem href="/achievements" emoji="🏆" bg="#FFFBEB" title="ความสำเร็จ"       sub="Badges และ achievements" />
          <MenuItem href="/saved"        emoji="🔖" bg="#EEF2FF" title="บันทึกไว้"        sub="คอร์สที่บันทึกไว้" last />
        </MenuSection>

        <MenuSection title="อาชีพ">
          <MenuItem href="/resume" emoji="📄" bg="#ECFDF5" title="Resume & Career" sub="จัดการ Resume และ Cover Letter" last />
        </MenuSection>

        <MenuSection title="การตั้งค่า">
          <MenuItem href="/settings" emoji="⚙️" bg="#F2F2F7" title="การตั้งค่า" sub="การแจ้งเตือน, ภาษา" />
          <MenuItem href="/help"     emoji="❓" bg="#F2F2F7" title="ช่วยเหลือ"  sub="FAQ และติดต่อเรา" />
          <MenuButton emoji="🐛" bg="#F2F2F7" title="แจ้งปัญหา" sub="พบบั๊ก? บอกเราได้เลย" onClick={() => setShowBugSheet(true)} last={!isAdmin} />
          {isAdmin && (
            <MenuItem href="/admin" emoji="🛡️" bg="#F2F2F7" title="Admin Panel" sub="จัดการคอร์สและระบบ" last />
          )}
        </MenuSection>

        {/* Ko-fi */}
        <a
          href="https://ko-fi.com/J3J11WBY0S"
          target="_blank" rel="noopener noreferrer"
          className="active:scale-[0.97] transition-transform"
          style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', padding: 14, gap: 12 }}
        >
          <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF1F1', flexShrink: 0, fontSize: 22 }}>☕</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>ช่วยซัพพอร์ต Mydemy</p>
            <p style={{ fontSize: 12, color: C.ink2 }}>ซื้อกาแฟให้ทีมพัฒนาสักแก้ว 🩷</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white', backgroundColor: '#FF5E5B', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>Ko-fi</span>
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="active:scale-[0.97] transition-transform"
          style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, color: '#FF3B30', fontWeight: 600, fontSize: 15, width: '100%' }}
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>

      </div>

      {showBugSheet && (
        <BugReportSheet userEmail={user.email || ''} onClose={() => setShowBugSheet(false)} />
      )}
    </div>
  );
}

// ── Shared section components ─────────────────────────────────────────────────

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 12, fontWeight: 700, color: C.ink3, marginBottom: 8, paddingLeft: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {title}
      </p>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  );
}

function MenuItem({ href, emoji, bg, title, sub, last = false }: { href: string; emoji: string; bg: string; title: string; sub: string; last?: boolean }) {
  return (
    <Link href={href} className="flex items-center active:opacity-70 transition-opacity" style={{ gap: 12, padding: '13px 16px', borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: bg, flexShrink: 0, fontSize: 18 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{title}</p>
        <p style={{ fontSize: 12, color: C.ink2 }}>{sub}</p>
      </div>
      <ChevronRight size={17} style={{ color: C.ink3, flexShrink: 0 }} />
    </Link>
  );
}

function MenuButton({ emoji, bg, title, sub, onClick, last = false }: { emoji: string; bg: string; title: string; sub: string; onClick: () => void; last?: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center active:opacity-70 transition-opacity w-full text-left" style={{ gap: 12, padding: '13px 16px', background: 'none', border: 'none', borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}>
      <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: bg, flexShrink: 0, fontSize: 18 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{title}</p>
        <p style={{ fontSize: 12, color: C.ink2 }}>{sub}</p>
      </div>
      <ChevronRight size={17} style={{ color: C.ink3, flexShrink: 0 }} />
    </button>
  );
}

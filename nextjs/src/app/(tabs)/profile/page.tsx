'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ribbon, Trophy, Bookmark, FileText, Settings, HelpCircle, ShieldCheck, LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { PrimaryBtn } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

const C = {
  primary:  '#ef5ea8',
  bg:       '#F2F2F7',
  surface:  '#FFFFFF',
  ink:      '#1C1C1E',
  ink2:     '#8E8E93',
  ink3:     '#C7C7CC',
  card:     { boxShadow: '0px 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)' },
  rim:      'rgba(0,0,0,0.06)',
};

interface GamDashboard { xp_total: number; level_info: { level: number }; current_streak: number; }

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [gam, setGam] = useState<GamDashboard | null>(null);
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  useEffect(() => {
    if (user?._id) {
      axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`)
        .then(r => setGam(r.data)).catch(() => {});
    }
  }, [user?._id]);

  const handleLogout = () => { logout(); router.replace('/auth'); };

  /* ── Not logged in ─────────────────────────────────────── */
  if (!user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: C.bg }}>
        <div
          className="sticky top-0 z-20 header-shell"
          style={{ background: 'rgba(242,242,247,0.85)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.10)' }}
        >
          <div className="flex items-center px-6 h-[54px]">
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>โปรไฟล์</h1>
          </div>
        </div>

        <div className="flex flex-col items-center text-center px-6 py-16 gap-6 max-w-lg mx-auto">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(239,94,168,0.10)' }}
          >
            <span className="text-[40px]">👤</span>
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }} className="mb-2">
              เข้าสู่ระบบ
            </h2>
            <p style={{ fontSize: '15px', color: C.ink2, lineHeight: '1.55' }}>
              บันทึกความคืบหน้า ดูคะแนน<br/>และรับใบประกาศนียบัตร
            </p>
          </div>
          <PrimaryBtn href="/auth">เข้าสู่ระบบ / สมัครสมาชิก</PrimaryBtn>
        </div>
      </div>
    );
  }

  const initial = (user.username?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ── Glass header ─────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 header-shell"
        style={{ background: 'rgba(242,242,247,0.85)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.10)' }}
      >
        <div className="flex items-center px-6 h-[54px]">
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>โปรไฟล์</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-5 flex flex-col gap-4 pb-8">

        {/* ── Profile card ─────────────────────────────── */}
        <div
          className="rounded-[24px] p-6 flex flex-col items-center text-center"
          style={{ backgroundColor: C.surface, ...C.card }}
        >
          <div
            className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: 'rgba(239,94,168,0.12)' }}
          >
            <span
              style={{ fontSize: '32px', fontWeight: 800, color: C.primary }}
            >
              {initial}
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>
            {user.display_name || user.username || 'User'}
          </h2>
          <p className="mt-0.5 mb-5" style={{ fontSize: '14px', color: C.ink2 }}>{user.email}</p>

          {/* Stats strip */}
          <div
            className="flex w-full rounded-[16px] overflow-hidden"
            style={{ border: `1px solid ${C.rim}` }}
          >
            {[
              { value: gam?.xp_total ?? 0,                label: '⚡ XP' },
              { value: `Lv.${gam?.level_info?.level ?? 1}`, label: '👑 ระดับ' },
              { value: gam?.current_streak ?? 0,          label: '🔥 Streak' },
            ].map((stat, i) => (
              <div
                key={i}
                className={`flex-1 flex flex-col items-center py-3 ${i < 2 ? 'border-r' : ''}`}
                style={{ borderColor: C.rim }}
              >
                <span style={{ fontSize: '18px', fontWeight: 700, color: C.ink, lineHeight: 1 }}>{stat.value}</span>
                <span style={{ fontSize: '11px', color: C.ink3, marginTop: '2px' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Learning ─────────────────────────────────── */}
        <MenuSection title="การเรียนรู้">
          <MenuItem href="/certificates" emoji="🏅" bg="#FFF0F7" title="ใบประกาศนียบัตร"   subtitle="ดาวน์โหลดใบประกาศ" />
          <MenuItem href="/achievements" emoji="🏆" bg="#FFFBEB" title="ความสำเร็จ"         subtitle="Badges และ achievements" />
          <MenuItem href="/saved"        emoji="🔖" bg="#EEF2FF" title="บันทึกไว้"          subtitle="คอร์สที่บันทึกไว้" />
        </MenuSection>

        {/* ── Career ───────────────────────────────────── */}
        <MenuSection title="อาชีพ">
          <MenuItem href="/resume" emoji="📄" bg="#ECFDF5" title="Resume & Career" subtitle="จัดการ Resume และ Cover Letter" />
        </MenuSection>

        {/* ── Settings ────────────────────────────────── */}
        <MenuSection title="การตั้งค่า">
          <MenuItem href="/settings" emoji="⚙️" bg="#F2F2F7" title="การตั้งค่า"  subtitle="การแจ้งเตือน, ภาษา" />
          <MenuItem href="/help"     emoji="❓" bg="#F2F2F7" title="ช่วยเหลือ"   subtitle="FAQ และติดต่อเรา" />
          {isAdmin && (
            <MenuItem href="/admin"  emoji="🛡️" bg="#F2F2F7" title="Admin Panel" subtitle="จัดการคอร์สและระบบ" />
          )}
        </MenuSection>

        {/* Ko-fi */}
        <a
          href="https://ko-fi.com/J3J11WBY0S"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[20px] p-4 flex items-center gap-3 active:scale-[0.97] transition-transform"
          style={{ backgroundColor: C.surface, ...C.card }}
        >
          <div
            className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 text-[22px]"
            style={{ backgroundColor: '#FFF1F1' }}
          >
            ☕
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: C.ink }}>ช่วยซัพพอร์ต Mydemy</p>
            <p className="text-[12px]" style={{ color: C.ink2 }}>ซื้อกาแฟให้ทีมพัฒนาสักแก้ว 🩷</p>
          </div>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-[10px] text-white"
            style={{ backgroundColor: '#FF5E5B' }}
          >
            Ko-fi
          </span>
        </a>

        <button
          onClick={handleLogout}
          className="rounded-[20px] p-4 flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          style={{ backgroundColor: C.surface, ...C.card, color: '#FF3B30', fontWeight: 600, fontSize: '15px' }}
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>

      </div>
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="px-1 mb-2 text-[12px] font-bold uppercase tracking-widest"
        style={{ color: '#C7C7CC' }}
      >
        {title}
      </p>
      <div
        className="rounded-[20px] overflow-hidden"
        style={{ backgroundColor: '#FFFFFF', boxShadow: '0px 8px 24px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.03)' }}
      >
        {children}
      </div>
    </div>
  );
}

function MenuItem({ href, emoji, bg, title, subtitle }: {
  href: string; emoji: string; bg: string; title: string; subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity border-b"
      style={{ borderColor: 'rgba(0,0,0,0.04)' }}
    >
      <div
        className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 text-[20px]"
        style={{ backgroundColor: bg }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1C1C1E' }}>{title}</p>
        <p style={{ fontSize: '12px', color: '#8E8E93' }}>{subtitle}</p>
      </div>
      <ChevronRight size={18} style={{ color: '#C7C7CC' }} className="shrink-0" />
    </Link>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { PrimaryBtn } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

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

interface GamDashboard { xp_total: number; level_info: { level: number }; current_streak: number; }

const GlassHeader = () => (
  <div
    className="sticky top-0 z-20 header-shell"
    style={{
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
    }}
  >
    <div
      className="flex items-center max-w-lg mx-auto"
      style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>โปรไฟล์</h1>
    </div>
  </div>
);

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

  if (!user) return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      <GlassHeader />
      <div
        className="max-w-lg mx-auto flex flex-col items-center text-center"
        style={{ padding: '64px 20px', gap: 20 }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 88, height: 88, backgroundColor: 'rgba(239,94,168,0.10)', fontSize: 36 }}
        >
          👤
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 8 }}>เข้าสู่ระบบ</h2>
          <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.55 }}>
            บันทึกความคืบหน้า ดูคะแนน<br />และรับใบประกาศนียบัตร
          </p>
        </div>
        <PrimaryBtn href="/auth">เข้าสู่ระบบ / สมัครสมาชิก</PrimaryBtn>
      </div>
    </div>
  );

  const initial = (user.display_name || user.username || 'U')[0].toUpperCase();

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
      <GlassHeader />

      <div className="max-w-lg mx-auto flex flex-col" style={{ padding: '20px 20px 36px', gap: 16 }}>

        {/* Profile card */}
        <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
          <div
            className="flex items-center justify-center rounded-full mx-auto"
            style={{
              width: 80, height: 80,
              backgroundColor: 'rgba(239,94,168,0.12)',
              marginBottom: 12, fontSize: 30, fontWeight: 800, color: C.primary,
            }}
          >
            {initial}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>
            {user.display_name || user.username || 'User'}
          </h2>
          <p style={{ fontSize: 14, color: C.ink2, marginTop: 3, marginBottom: 16 }}>{user.email}</p>

          {/* Stats strip */}
          <div style={{ display: 'flex', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            {[
              { val: gam?.xp_total ?? 0,                  label: '⚡ XP' },
              { val: `Lv.${gam?.level_info?.level ?? 1}`,   label: '👑 ระดับ' },
              { val: gam?.current_streak ?? 0,              label: '🔥 Streak' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '12px 0',
                  borderRight: i < 2 ? '1px solid rgba(0,0,0,0.07)' : 'none',
                }}
              >
                <span style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{s.val}</span>
                <span style={{ fontSize: 11, color: C.ink3, marginTop: 3 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning */}
        <MenuSection title="การเรียนรู้">
          <MenuItem href="/certificates" emoji="🏅" bg="#FFF0F7" title="ใบประกาศนียบัตร"  sub="ดาวน์โหลดใบประกาศ" />
          <MenuItem href="/achievements" emoji="🏆" bg="#FFFBEB" title="ความสำเร็จ"        sub="Badges และ achievements" />
          <MenuItem href="/saved"        emoji="🔖" bg="#EEF2FF" title="บันทึกไว้"         sub="คอร์สที่บันทึกไว้" />
        </MenuSection>

        {/* Career */}
        <MenuSection title="อาชีพ">
          <MenuItem href="/resume" emoji="📄" bg="#ECFDF5" title="Resume & Career" sub="จัดการ Resume และ Cover Letter" />
        </MenuSection>

        {/* Settings */}
        <MenuSection title="การตั้งค่า">
          <MenuItem href="/settings" emoji="⚙️" bg="#F2F2F7" title="การตั้งค่า"  sub="การแจ้งเตือน, ภาษา" />
          <MenuItem href="/help"     emoji="❓" bg="#F2F2F7" title="ช่วยเหลือ"   sub="FAQ และติดต่อเรา" />
          {isAdmin && (
            <MenuItem href="/admin"  emoji="🛡️" bg="#F2F2F7" title="Admin Panel" sub="จัดการคอร์สและระบบ" />
          )}
        </MenuSection>

        {/* Ko-fi */}
        <a
          href="https://ko-fi.com/J3J11WBY0S"
          target="_blank"
          rel="noopener noreferrer"
          className="active:scale-[0.97] transition-transform"
          style={{ ...cardStyle, display: 'flex', alignItems: 'center', padding: 14, gap: 12 }}
        >
          <div
            className="flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF1F1', flexShrink: 0, fontSize: 22 }}
          >
            ☕
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>ช่วยซัพพอร์ต Mydemy</p>
            <p style={{ fontSize: 12, color: C.ink2 }}>ซื้อกาแฟให้ทีมพัฒนาสักแก้ว 🩷</p>
          </div>
          <span
            style={{
              fontSize: 11, fontWeight: 700, color: 'white',
              backgroundColor: '#FF5E5B', borderRadius: 8, padding: '4px 10px',
              flexShrink: 0,
            }}
          >
            Ko-fi
          </span>
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="active:scale-[0.97] transition-transform"
          style={{
            ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: 16, color: '#FF3B30', fontWeight: 600, fontSize: 15, width: '100%',
          }}
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
      <p style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', marginBottom: 8, paddingLeft: 4 }}>
        {title}
      </p>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}>
        {children}
      </div>
    </div>
  );
}

function MenuItem({
  href, emoji, bg, title, sub,
}: { href: string; emoji: string; bg: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex items-center active:opacity-70 transition-opacity"
      style={{ gap: 12, padding: '13px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}
    >
      <div
        className="flex items-center justify-center"
        style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: bg, flexShrink: 0, fontSize: 18 }}
      >
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{title}</p>
        <p style={{ fontSize: 12, color: C.ink2 }}>{sub}</p>
      </div>
      <ChevronRight size={17} style={{ color: C.ink3, flexShrink: 0 }} />
    </Link>
  );
}

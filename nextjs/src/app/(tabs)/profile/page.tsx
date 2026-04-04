'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Ribbon, Trophy, Bookmark, FileText, Settings, HelpCircle, ShieldCheck, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

interface GamDashboard { xp_total: number; level_info: { level: number }; current_streak: number; }

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [gam, setGam] = useState<GamDashboard | null>(null);
  const [mounted, setMounted] = useState(false);
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  useEffect(() => {
    setMounted(true);
    if (user?._id) {
      axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`)
        .then(r => setGam(r.data)).catch(() => {});
    }
  }, [user?._id]);

  const handleLogout = () => { logout(); router.replace('/auth'); };

  // ── Guest ────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-ios-bg">
        <div
          className="bg-white border-b border-separator"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="max-w-lg mx-auto px-4 py-3.5">
            <h1 className="text-[22px] font-extrabold text-text-primary">โปรไฟล์</h1>
          </div>
        </div>
        <div className="flex flex-col items-center text-center px-8 py-20 gap-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #f472b6, #ef5ea8)',
              animation: mounted ? 'fadeScaleIn 0.4s ease-out forwards' : 'none',
              opacity: 0,
            }}
          >
            <span className="text-3xl font-bold text-white">?</span>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-text-primary mb-1">เข้าสู่ระบบ</h2>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              บันทึกความคืบหน้า ดูคะแนน<br/>และรับใบประกาศนียบัตร
            </p>
          </div>
          <Link
            href="/auth"
            className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-sm mt-1"
          >
            เข้าสู่ระบบ / สมัครสมาชิก
          </Link>
        </div>
      </div>
    );
  }

  const initial = (user.username?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="min-h-screen bg-ios-bg">

      {/* ── Pink profile header ─────────────────────────── */}
      <div
        className="px-4 pb-6"
        style={{
          background: 'linear-gradient(160deg, #f472b6 0%, #ef5ea8 55%, #db2777 100%)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        }}
      >
        <div
          className="flex flex-col items-center"
          style={{ animation: mounted ? 'fadeScaleIn 0.4s ease-out forwards' : 'none', opacity: 0 }}
        >
          {/* Avatar */}
          <div className="w-[72px] h-[72px] rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mb-3 shadow-sm">
            <span className="text-[28px] font-extrabold text-white">{initial}</span>
          </div>
          <h2 className="text-[20px] font-extrabold text-white leading-tight">
            {user.display_name || user.username || 'User'}
          </h2>
          <p className="text-white/65 text-[13px] mb-4">{user.email}</p>

          {/* Stats row */}
          <div className="flex bg-white/15 rounded-2xl overflow-hidden border border-white/10 w-full max-w-[280px]">
            {[
              { value: gam?.xp_total ?? 0,             label: '⚡ XP' },
              { value: `Lv.${gam?.level_info?.level ?? 1}`, label: '👑 ระดับ' },
              { value: gam?.current_streak ?? 0,        label: '🔥 Streak' },
            ].map((stat, i) => (
              <div key={i} className={`flex-1 flex flex-col items-center py-3 ${i < 2 ? 'border-r border-white/15' : ''}`}>
                <span className="text-[17px] font-extrabold text-white leading-none">{stat.value}</span>
                <span className="text-[10px] text-white/65 mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Menu ────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-8">

        <MenuSection title="การเรียนรู้" delay={0} mounted={mounted}>
          <MenuItem href="/certificates"  icon={<Ribbon size={20} className="text-white" />}         iconBg="bg-primary"       title="ใบประกาศนียบัตร"      subtitle="ดาวน์โหลดใบประกาศ" />
          <MenuItem href="/achievements"  icon={<Trophy size={20} className="text-white" />}          iconBg="bg-[#10B981]"     title="ความสำเร็จ"           subtitle="ดู badges และ achievements" />
          <MenuItem href="/saved"         icon={<Bookmark size={20} className="text-white" />}        iconBg="bg-[#F59E0B]"     title="บันทึกไว้"            subtitle="คอร์สที่บันทึกไว้" />
        </MenuSection>

        <MenuSection title="อาชีพ" delay={1} mounted={mounted}>
          <MenuItem href="/resume"        icon={<FileText size={20} className="text-white" />}        iconBg="bg-[#3B82F6]"     title="Resume & Career"       subtitle="จัดการ Resume และ Cover Letter" />
        </MenuSection>

        <MenuSection title="การตั้งค่า" delay={2} mounted={mounted}>
          <MenuItem href="/settings"      icon={<Settings size={20} className="text-text-secondary" />}    iconBg="bg-separator"     title="การตั้งค่า"            subtitle="การแจ้งเตือน, ภาษา" />
          <MenuItem href="/help"          icon={<HelpCircle size={20} className="text-text-secondary" />}   iconBg="bg-separator"     title="ช่วยเหลือ"             subtitle="FAQ และติดต่อเรา" />
          {isAdmin && (
            <MenuItem href="/admin"       icon={<ShieldCheck size={20} className="text-text-secondary" />}  iconBg="bg-separator"     title="Admin Panel"           subtitle="จัดการคอร์สและระบบ" />
          )}
        </MenuSection>

        {/* Ko-fi support */}
        <a
          href="https://ko-fi.com/J3J11WBY0S"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white border border-separator/60 rounded-2xl p-4 mb-3 hover:border-primary/30 active:scale-[0.98] transition-all shadow-sm"
          style={{ animation: mounted ? 'slideUpFade 0.35s ease-out 0.18s both' : 'none', opacity: 0 }}
        >
          <div className="w-10 h-10 bg-[#FF5E5B]/10 rounded-xl flex items-center justify-center shrink-0 text-[20px]">☕</div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-text-primary">ช่วยซัพพอร์ต Mydemy</p>
            <p className="text-[12px] text-text-secondary">ซื้อกาแฟให้ทีมพัฒนาสักแก้ว 🩷</p>
          </div>
          <span className="bg-[#FF5E5B] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">Ko-fi</span>
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full bg-white border border-separator/60 rounded-2xl p-4 text-error font-semibold hover:bg-red-50 active:scale-[0.98] transition-all shadow-sm"
          style={{ animation: mounted ? 'slideUpFade 0.35s ease-out 0.22s both' : 'none', opacity: 0 }}
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>

      </div>
    </div>
  );
}

function MenuSection({ title, children, delay, mounted }: {
  title: string; children: React.ReactNode; delay: number; mounted: boolean;
}) {
  return (
    <div
      className="mb-5"
      style={{ animation: mounted ? `slideUpFade 0.35s ease-out ${delay * 0.07}s both` : 'none', opacity: 0 }}
    >
      <p className="text-[12px] font-bold text-text-tertiary uppercase tracking-wider px-1 mb-2">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function MenuItem({ href, icon, iconBg, title, subtitle }: {
  href: string; icon: React.ReactNode; iconBg: string;
  title: string; subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white border border-separator/60 rounded-2xl p-3.5 hover:border-primary/30 active:scale-[0.98] transition-all shadow-sm"
    >
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-text-primary">{title}</p>
        <p className="text-[12px] text-text-secondary">{subtitle}</p>
      </div>
      <ChevronRight size={16} className="text-text-tertiary shrink-0" />
    </Link>
  );
}

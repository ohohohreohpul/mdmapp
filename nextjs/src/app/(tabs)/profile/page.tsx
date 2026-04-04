'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Ribbon, Trophy, Bookmark, FileText, Settings, HelpCircle, ShieldCheck, LogOut, Coffee } from 'lucide-react';
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
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  useEffect(() => {
    if (user?._id) {
      axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`)
        .then(r => setGam(r.data))
        .catch(() => {});
    }
  }, [user?._id]);

  const handleLogout = () => {
    logout();
    router.replace('/auth');
  };

  // Guest
  if (!user) {
    return (
      <div className="min-h-screen bg-ios-bg">
        <header className="bg-white border-b border-separator px-5 pt-safe">
          <div className="py-4"><h1 className="text-[22px] font-extrabold text-text-primary">โปรไฟล์</h1></div>
        </header>
        <div className="flex flex-col items-center text-center px-8 py-16">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl text-white font-bold">?</span>
          </div>
          <h2 className="text-[20px] font-bold text-text-primary mb-2">เข้าสู่ระบบ</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            เข้าสู่ระบบเพื่อบันทึกความคืบหน้า{'\n'}ดูคะแนน และรับใบประกาศนียบัตร
          </p>
          <Link href="/auth" className="bg-primary text-white font-bold px-8 py-3 rounded-2xl hover:opacity-90 transition-opacity">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  const initial = (user.username?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="min-h-screen bg-ios-bg">
      {/* Pink profile header */}
      <div className="bg-primary pt-safe pb-6 px-5">
        <div className="flex flex-col items-center pt-4">
          <div className="w-20 h-20 bg-white/25 rounded-full flex items-center justify-center mb-3">
            <span className="text-3xl font-extrabold text-white">{initial}</span>
          </div>
          <h2 className="text-[20px] font-extrabold text-white">{user.display_name || user.username || 'User'}</h2>
          <p className="text-white/75 text-sm mb-4">{user.email}</p>

          {/* Stats row */}
          <div className="flex bg-white/15 rounded-2xl overflow-hidden w-full max-w-xs">
            {[
              { value: gam?.xp_total ?? 0, label: '⚡ XP' },
              { value: `Lv.${gam?.level_info?.level ?? 1}`, label: '👑 ระดับ' },
              { value: gam?.current_streak ?? 0, label: '🔥 Streak' },
            ].map((stat, i) => (
              <div key={i} className={`flex-1 flex flex-col items-center py-3 ${i < 2 ? 'border-r border-white/20' : ''}`}>
                <span className="text-[18px] font-extrabold text-white">{stat.value}</span>
                <span className="text-[11px] text-white/75">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        <MenuSection title="การเรียนรู้">
          <MenuItem href="/certificates" icon={<Ribbon size={22} className="text-white" />} iconBg="bg-primary" title="ใบประกาศนียบัตร" subtitle="ดาวน์โหลดใบประกาศ" />
          <MenuItem href="/achievements" icon={<Trophy size={22} className="text-white" />} iconBg="bg-[#10B981]" title="ความสำเร็จ" subtitle="ดู badges และ achievements" />
          <MenuItem href="/saved" icon={<Bookmark size={22} className="text-white" />} iconBg="bg-[#F59E0B]" title="บันทึกไว้" subtitle="คอร์สที่บันทึกไว้" />
        </MenuSection>

        <MenuSection title="อาชีพ">
          <MenuItem href="/resume" icon={<FileText size={22} className="text-white" />} iconBg="bg-[#3B82F6]" title="Resume & Career" subtitle="จัดการ Resume และ Cover Letter" />
        </MenuSection>

        <MenuSection title="การตั้งค่า">
          <MenuItem href="/settings" icon={<Settings size={22} className="text-[#666]" />} iconBg="bg-[#F2F2F7]" title="การตั้งค่า" subtitle="การแจ้งเตือน, ภาษา" iconTextDark />
          <MenuItem href="/help" icon={<HelpCircle size={22} className="text-[#666]" />} iconBg="bg-[#F2F2F7]" title="ช่วยเหลือ" subtitle="FAQ และติดต่อเรา" iconTextDark />
          {isAdmin && (
            <MenuItem href="/admin" icon={<ShieldCheck size={22} className="text-[#666]" />} iconBg="bg-[#F2F2F7]" title="Admin Panel" subtitle="จัดการคอร์สและระบบ" iconTextDark />
          )}
        </MenuSection>

        {/* Ko-fi */}
        <a
          href="https://ko-fi.com/J3J11WBY0S"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white border border-separator rounded-2xl p-4 mb-4 hover:border-primary/30 transition-colors"
        >
          <span className="text-2xl">☕</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">ช่วยซัพพอร์ต mydemy</p>
            <p className="text-xs text-text-secondary">ซื้อกาแฟให้ทีมพัฒนาสักแก้ว 🩷</p>
          </div>
          <span className="bg-[#FF5E5B] text-white text-[11px] font-bold px-2 py-1 rounded-lg">Ko-fi</span>
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full bg-white border border-separator rounded-2xl p-4 text-[#EF4444] font-semibold hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[13px] font-semibold text-text-secondary px-1 mb-2">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function MenuItem({ href, icon, iconBg, title, subtitle, iconTextDark }: {
  href: string; icon: React.ReactNode; iconBg: string;
  title: string; subtitle: string; iconTextDark?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 bg-white border border-separator rounded-2xl p-4 hover:border-primary/30 transition-colors">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-text-primary">{title}</p>
        <p className="text-[12px] text-text-secondary">{subtitle}</p>
      </div>
      <ChevronRight size={18} className="text-text-tertiary" />
    </Link>
  );
}

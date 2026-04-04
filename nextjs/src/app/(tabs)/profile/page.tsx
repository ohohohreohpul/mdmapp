'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ribbon, Trophy, Bookmark, FileText, Settings, HelpCircle, ShieldCheck, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { TabHeader, PrimaryBtn, Card } from '@/lib/ui';
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
        .then(r => setGam(r.data)).catch(() => {});
    }
  }, [user?._id]);

  const handleLogout = () => { logout(); router.replace('/auth'); };

  if (!user) {
    return (
      <div className="min-h-screen bg-bg">
        <TabHeader title="โปรไฟล์" />
        <div className="flex flex-col items-center text-center px-8 py-20 gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #f06bba, #e8409b)' }}>
            <span className="text-3xl font-bold text-white">?</span>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-ink mb-1">เข้าสู่ระบบ</h2>
            <p className="text-[13px] text-ink-2 leading-relaxed">
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
    <div className="min-h-screen bg-bg">
      {/* Gradient profile hero — handles safe-area internally */}
      <div
        className="px-4 pb-6 header-shell"
        style={{ background: 'linear-gradient(160deg, #f06bba 0%, #e8409b 55%, #c7357f 100%)' }}
      >
        <div className="pt-3.5 flex flex-col items-center">
          <div className="w-[72px] h-[72px] rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mb-3 shadow-sm">
            <span className="text-[28px] font-extrabold text-white">{initial}</span>
          </div>
          <h2 className="text-[20px] font-extrabold text-white leading-tight">
            {user.display_name || user.username || 'User'}
          </h2>
          <p className="text-white/65 text-[13px] mb-4">{user.email}</p>

          <div className="flex bg-white/15 rounded-2xl overflow-hidden border border-white/10 w-full max-w-[280px]">
            {[
              { value: gam?.xp_total ?? 0,                   label: '⚡ XP' },
              { value: `Lv.${gam?.level_info?.level ?? 1}`,  label: '👑 ระดับ' },
              { value: gam?.current_streak ?? 0,              label: '🔥 Streak' },
            ].map((stat, i) => (
              <div key={i} className={`flex-1 flex flex-col items-center py-3 ${i < 2 ? 'border-r border-white/15' : ''}`}>
                <span className="text-[17px] font-extrabold text-white leading-none">{stat.value}</span>
                <span className="text-[10px] text-white/65 mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 pb-8">
        <MenuSection title="การเรียนรู้">
          <MenuItem href="/certificates" icon={<Ribbon size={20} className="text-white" />}   iconBg="bg-brand"       title="ใบประกาศนียบัตร"  subtitle="ดาวน์โหลดใบประกาศ" />
          <MenuItem href="/achievements" icon={<Trophy size={20} className="text-white" />}    iconBg="bg-[#10B981]"   title="ความสำเร็จ"       subtitle="ดู badges และ achievements" />
          <MenuItem href="/saved"        icon={<Bookmark size={20} className="text-white" />}  iconBg="bg-[#F59E0B]"   title="บันทึกไว้"       subtitle="คอร์สที่บันทึกไว้" />
        </MenuSection>

        <MenuSection title="อาชีพ">
          <MenuItem href="/resume"       icon={<FileText size={20} className="text-white" />}  iconBg="bg-[#3B82F6]"   title="Resume & Career"  subtitle="จัดการ Resume และ Cover Letter" />
        </MenuSection>

        <MenuSection title="การตั้งค่า">
          <MenuItem href="/settings"     icon={<Settings size={20} className="text-ink-2" />}  iconBg="bg-rim"         title="การตั้งค่า"       subtitle="การแจ้งเตือน, ภาษา" />
          <MenuItem href="/help"         icon={<HelpCircle size={20} className="text-ink-2" />} iconBg="bg-rim"        title="ช่วยเหลือ"        subtitle="FAQ และติดต่อเรา" />
          {isAdmin && (
            <MenuItem href="/admin"      icon={<ShieldCheck size={20} className="text-ink-2" />} iconBg="bg-rim"       title="Admin Panel"      subtitle="จัดการคอร์สและระบบ" />
          )}
        </MenuSection>

        {/* Ko-fi */}
        <a
          href="https://ko-fi.com/J3J11WBY0S"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-surface rounded-2xl p-4 mb-3 card-shadow active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 bg-[#FF5E5B]/10 rounded-xl flex items-center justify-center shrink-0 text-[20px]">☕</div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-ink">ช่วยซัพพอร์ต Mydemy</p>
            <p className="text-[12px] text-ink-2">ซื้อกาแฟให้ทีมพัฒนาสักแก้ว 🩷</p>
          </div>
          <span className="bg-[#FF5E5B] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">Ko-fi</span>
        </a>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full bg-surface rounded-2xl p-4 text-[#EF4444] font-semibold card-shadow active:scale-[0.98] transition-transform"
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
    <div className="mb-5">
      <p className="text-[12px] font-bold text-ink-3 uppercase tracking-wider px-1 mb-2">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function MenuItem({ href, icon, iconBg, title, subtitle }: {
  href: string; icon: React.ReactNode; iconBg: string; title: string; subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-surface rounded-2xl p-3.5 card-shadow active:scale-[0.98] transition-transform"
    >
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-ink">{title}</p>
        <p className="text-[12px] text-ink-2">{subtitle}</p>
      </div>
      <span className="text-ink-3">›</span>
    </Link>
  );
}

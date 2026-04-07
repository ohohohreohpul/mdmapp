'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Briefcase, BookOpen, User } from 'lucide-react';

const TABS = [
  { href: '/home',     label: 'หน้าแรก', Icon: Home },
  { href: '/explore',  label: 'สำรวจ',   Icon: Compass },
  { href: '/jobs',     label: 'งาน',     Icon: Briefcase },
  { href: '/learning', label: 'เรียน',   Icon: BookOpen },
  { href: '/profile',  label: 'โปรไฟล์', Icon: User },
];

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F2F2F7' }}>
      {/* Scrollable content — padded above floating tab bar */}
      <main style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        {children}
      </main>

      {/* ── Floating pill tab bar ─────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', paddingLeft: '24px', paddingRight: '24px' }}
      >
        {/* The pill itself */}
        <div
          className="w-full max-w-sm flex items-center justify-around"
          style={{
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.60)',
            borderRadius: '9999px',
            height: '64px',
            padding: '0 8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.8) inset',
          }}
        >
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-[3px] transition-all active:scale-90 flex-1"
              >
                <div
                  className="w-10 h-8 rounded-full flex items-center justify-center transition-all"
                  style={active ? { backgroundColor: '#ef5ea8' } : {}}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? '#ffffff' : '#8E8E93' }}
                  />
                </div>
                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{ color: active ? '#ef5ea8' : '#C7C7CC' }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

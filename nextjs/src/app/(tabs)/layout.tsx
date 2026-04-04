'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Briefcase, BookOpen, User } from 'lucide-react';

const TABS = [
  { href: '/home',     label: 'หน้าแรก', Icon: Home },
  { href: '/explore',  label: 'สำรวจ',    Icon: Compass },
  { href: '/jobs',     label: 'งาน',      Icon: Briefcase },
  { href: '/learning', label: 'เรียน',    Icon: BookOpen },
  { href: '/profile',  label: 'โปรไฟล์',  Icon: User },
];

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Scrollable content — padded above the tab bar */}
      <main className="flex-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}>
        {children}
      </main>

      {/* ── Bottom tab bar ─────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 bg-surface/95 backdrop-blur-md border-t border-rim"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex h-16 max-w-lg mx-auto px-1">
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-[3px] transition-opacity"
              >
                <div
                  className={`w-11 h-7 rounded-full flex items-center justify-center transition-colors ${
                    active ? 'bg-brand' : ''
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? 'text-white' : 'text-ink-3'}
                  />
                </div>
                <span className={`text-[10px] font-semibold leading-none ${active ? 'text-brand' : 'text-ink-3'}`}>
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

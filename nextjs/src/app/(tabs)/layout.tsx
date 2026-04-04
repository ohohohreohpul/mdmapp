'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Briefcase, BookOpen, User } from 'lucide-react';

const TABS = [
  { href: '/home',     label: 'หน้าแรก', icon: Home },
  { href: '/explore',  label: 'สำรวจ',    icon: Compass },
  { href: '/jobs',     label: 'งาน',      icon: Briefcase },
  { href: '/learning', label: 'เรียน',    icon: BookOpen },
  { href: '/profile',  label: 'โปรไฟล์',  icon: User },
];

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-ios-bg">
      {/* Page content */}
      <main className="flex-1" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-separator"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-[56px] max-w-lg mx-auto px-2">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-[3px] py-1"
              >
                <div className={`w-[44px] h-[28px] rounded-full flex items-center justify-center transition-all duration-200 ${
                  active ? 'bg-primary' : ''
                }`}>
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? 'text-white' : 'text-text-tertiary'}
                  />
                </div>
                <span className={`text-[10px] font-semibold leading-none ${active ? 'text-primary' : 'text-text-tertiary'}`}>
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

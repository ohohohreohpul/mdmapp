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
      {/* Page content — leaves room for the tab bar */}
      <main className="flex-1 pb-[82px]">
        {children}
      </main>

      {/* Mascot strip — fills iOS home indicator zone */}
      <div className="fixed bottom-0 left-0 right-0 h-[42px] bg-primary z-0 pointer-events-none flex items-end justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/mascot.png" alt="" className="w-20 h-[60px] mb-[-8px] object-contain" />
      </div>

      {/* Floating pill tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex justify-center pb-0">
        <div className="mx-5 mb-0 w-full max-w-md bg-white/95 backdrop-blur border border-white/55 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.12)] flex items-center h-[66px] px-2">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1"
              >
                <div className={`w-10 h-[30px] rounded-full flex items-center justify-center transition-colors ${
                  active ? 'bg-primary shadow-[0_3px_6px_rgba(239,94,168,0.35)]' : ''
                }`}>
                  <Icon size={20} className={active ? 'text-white' : 'text-text-tertiary'} />
                </div>
                <span className={`text-[10px] font-semibold tracking-[0.1px] ${active ? 'text-primary' : 'text-text-tertiary'}`}>
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

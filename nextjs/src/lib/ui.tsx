'use client';
/**
 * Shared UI primitives — import from here across all pages.
 * Ensures consistent look/feel with zero duplication.
 */

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   LAYOUT SHELLS
   ───────────────────────────────────────────────────────────── */

/** Standard scrollable page. */
export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`min-h-screen bg-bg ${className}`}>{children}</div>;
}

/** White sticky header for sub-pages (back-button + title). */
export function NavHeader({
  title, right, onBack,
}: { title: string; right?: ReactNode; onBack?: () => void }) {
  const router = useRouter();
  return (
    <header className="bg-surface border-b border-rim sticky top-0 z-20 header-shell">
      <div className="flex items-center gap-1 px-3 h-[54px] max-w-lg mx-auto">
        <button
          onClick={onBack ?? (() => router.back())}
          className="w-10 h-10 flex items-center justify-center rounded-2xl active:bg-bg transition-colors shrink-0"
        >
          <ArrowLeft size={22} className="text-ink" />
        </button>
        <h1 className="flex-1 text-[17px] font-bold text-ink truncate px-1">{title}</h1>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  );
}

/** White sticky header for tab pages (title only, no back). */
export function TabHeader({
  title, right,
}: { title: string; right?: ReactNode }) {
  return (
    <div className="bg-surface border-b border-rim sticky top-0 z-20 header-shell">
      <div className="flex items-center justify-between px-4 h-[54px] max-w-lg mx-auto">
        <h1 className="text-[22px] font-extrabold text-ink">{title}</h1>
        {right && <div>{right}</div>}
      </div>
    </div>
  );
}

/** Gradient header block for tab pages that have a pink hero area. */
export function GradHero({ children }: { children: ReactNode }) {
  return (
    <div
      className="px-4 pb-5"
      style={{
        background: 'linear-gradient(160deg, #f06bba 0%, #e8409b 50%, #c7357f 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 14px)',
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CARDS
   ───────────────────────────────────────────────────────────── */

export function Card({
  children, className = '', onClick, href,
}: { children: ReactNode; className?: string; onClick?: () => void; href?: string }) {
  const base = `bg-surface rounded-2xl card-shadow ${className}`;
  if (href) return <Link href={href} className={`block ${base}`}>{children}</Link>;
  if (onClick) return <button onClick={onClick} className={`w-full text-left active:scale-[0.98] transition-transform ${base}`}>{children}</button>;
  return <div className={base}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────────
   BUTTONS
   ───────────────────────────────────────────────────────────── */

export function PrimaryBtn({
  children, onClick, loading, disabled, className = '', href,
}: { children: ReactNode; onClick?: () => void; loading?: boolean; disabled?: boolean; className?: string; href?: string }) {
  const base = `flex items-center justify-center gap-2 bg-brand text-white font-bold text-[16px] py-[14px] px-6 rounded-2xl shadow-[0_6px_20px_rgba(232,64,155,0.28)] active:scale-[0.98] transition-all disabled:opacity-50 w-full ${className}`;
  if (href) return <Link href={href} className={base}>{children}</Link>;
  return (
    <button onClick={onClick} disabled={loading || disabled} className={base}>
      {loading && <Loader2 size={18} className="animate-spin shrink-0" />}
      {children}
    </button>
  );
}

export function GhostBtn({
  children, onClick, className = '',
}: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 bg-surface text-ink-2 font-semibold text-[15px] py-3 px-5 rounded-2xl border border-rim active:bg-bg transition-colors w-full ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkRow({
  href, icon, label, sub,
}: { href: string; icon: ReactNode; label: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 bg-surface active:bg-bg transition-colors">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-ink leading-tight">{label}</p>
        {sub && <p className="text-[12px] text-ink-3 mt-0.5">{sub}</p>}
      </div>
      <ChevronRight size={16} className="text-ink-3 shrink-0" />
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOADING / EMPTY
   ───────────────────────────────────────────────────────────── */

export function Spinner({ size = 28 }: { size?: number }) {
  return (
    <div className="flex justify-center py-16">
      <div
        className="border-2 border-brand border-t-transparent rounded-full"
        style={{ width: size, height: size, animation: 'spin 0.7s linear infinite' }}
      />
    </div>
  );
}

export function Skel({ className = '' }: { className?: string }) {
  return <div className={`bg-rim rounded-xl animate-pulse-slow ${className}`} />;
}

export function EmptyState({
  icon: Icon, title, body, action,
}: { icon: any; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-20 gap-4 px-6 animate-fade-up">
      <div className="w-20 h-20 bg-brand-surface rounded-full flex items-center justify-center">
        <Icon size={34} className="text-brand" />
      </div>
      <div>
        <p className="text-[18px] font-bold text-ink mb-1">{title}</p>
        {body && <p className="text-[14px] text-ink-2 leading-relaxed">{body}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MISC
   ───────────────────────────────────────────────────────────── */

/** Horizontal scroll strip with hidden scrollbar. */
export function HScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 ${className}`}>
      {children}
    </div>
  );
}

/** Section title + optional "see all" link. */
export function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {href && (
        <Link href={href} className="text-[13px] font-semibold text-brand flex items-center gap-0.5">
          ดูทั้งหมด <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

/** iOS-style toggle switch. */
export function Toggle({
  value, onChange,
}: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-[28px] rounded-full transition-colors relative shrink-0 ${value ? 'bg-brand' : 'bg-rim'}`}
    >
      <span
        className="absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow transition-all"
        style={{ left: value ? 'calc(100% - 25px)' : '3px' }}
      />
    </button>
  );
}

/** Pink progress bar. */
export function ProgressBar({ pct, className = '' }: { pct: number; className?: string }) {
  return (
    <div className={`h-2 bg-rim rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-brand rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

'use client';
/**
 * Shared UI primitives — iOS Clean Clarity design system.
 * No gradients. Pure white cards, subtle shadows, glassmorphism headers.
 */

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react';

/* ── Design tokens (inline for reliability) ─────────────── */
const C = {
  primary:  '#ef5ea8',
  bg:       '#F2F2F7',
  surface:  '#FFFFFF',
  ink:      '#1C1C1E',
  ink2:     '#8E8E93',
  ink3:     '#C7C7CC',
  rim:      'rgba(0,0,0,0.08)',
  cardBorder: 'rgba(0,0,0,0.03)',
  cardShadow: '0px 8px 24px rgba(0,0,0,0.04)',
  glassBg:  'rgba(255,255,255,0.75)',
  glassBorder: 'rgba(255,255,255,0.40)',
};

/* ══════════════════════════════════════════════════════════
   HEADERS
   ══════════════════════════════════════════════════════════ */

/** Glass sticky header for sub-pages (back + title). */
export function NavHeader({
  title, right, onBack,
}: { title: string; right?: ReactNode; onBack?: () => void }) {
  const router = useRouter();
  return (
    <header
      className="sticky top-0 z-20 header-shell"
      style={{
        background: 'rgba(242,242,247,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '0.5px solid rgba(0,0,0,0.10)',
      }}
    >
      <div className="flex items-center gap-1 px-3 h-[54px] max-w-lg mx-auto">
        <button
          onClick={onBack ?? (() => router.back())}
          className="w-10 h-10 flex items-center justify-center rounded-2xl active:scale-90 transition-transform shrink-0"
          style={{ backgroundColor: 'transparent' }}
        >
          <ArrowLeft size={22} style={{ color: C.primary }} />
        </button>
        <h1
          className="flex-1 truncate px-1"
          style={{ fontSize: '17px', fontWeight: 600, color: C.ink, letterSpacing: '-0.01em' }}
        >
          {title}
        </h1>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  );
}

/** Glass sticky header for tab pages (title only, no back). */
export function TabHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div
      className="sticky top-0 z-20 header-shell"
      style={{
        background: 'rgba(242,242,247,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '0.5px solid rgba(0,0,0,0.10)',
      }}
    >
      <div className="flex items-center justify-between px-6 h-[54px] max-w-lg mx-auto">
        <h1
          style={{ fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}
        >
          {title}
        </h1>
        {right && <div>{right}</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CARDS
   ══════════════════════════════════════════════════════════ */

export function Card({
  children, className = '', onClick, href, padding = '20px',
}: { children: ReactNode; className?: string; onClick?: () => void; href?: string; padding?: string }) {
  const style = {
    backgroundColor: C.surface,
    borderRadius: '24px',
    padding,
    boxShadow: C.cardShadow,
    border: `1px solid ${C.cardBorder}`,
  };
  if (href) return (
    <Link href={href} className={`block active:scale-[0.97] transition-transform ${className}`} style={style}>
      {children}
    </Link>
  );
  if (onClick) return (
    <button onClick={onClick} className={`w-full text-left active:scale-[0.97] transition-transform ${className}`} style={style}>
      {children}
    </button>
  );
  return <div className={className} style={style}>{children}</div>;
}

export function CardSm({
  children, className = '',
}: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: C.surface,
        borderRadius: '16px',
        boxShadow: '0px 4px 16px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.04)',
      }}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BUTTONS
   ══════════════════════════════════════════════════════════ */

export function PrimaryBtn({
  children, onClick, loading, disabled, className = '', href,
}: { children: ReactNode; onClick?: () => void; loading?: boolean; disabled?: boolean; className?: string; href?: string }) {
  const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: C.primary,
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '16px',
    padding: '16px 24px',
    borderRadius: '16px',
    width: '100%',
    boxShadow: '0px 16px 32px rgba(239,94,168,0.15)',
    transition: 'transform 0.1s, opacity 0.1s',
    opacity: (loading || disabled) ? 0.5 : 1,
  } as React.CSSProperties;

  if (href) return (
    <Link href={href} className={`active:scale-[0.97] ${className}`} style={style}>
      {children}
    </Link>
  );
  return (
    <button onClick={onClick} disabled={loading || disabled} className={`active:scale-[0.97] ${className}`} style={style}>
      {loading && <Loader2 size={18} className="animate-spin shrink-0" />}
      {children}
    </button>
  );
}

export function SecondaryBtn({
  children, onClick, className = '',
}: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 w-full active:scale-[0.97] transition-transform ${className}`}
      style={{
        backgroundColor: 'rgba(239,94,168,0.10)',
        color: C.primary,
        fontWeight: 600,
        fontSize: '15px',
        padding: '16px 24px',
        borderRadius: '16px',
      }}
    >
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
      className={`flex items-center justify-center gap-2 w-full active:scale-[0.97] transition-transform ${className}`}
      style={{
        backgroundColor: C.surface,
        color: C.ink2,
        fontWeight: 600,
        fontSize: '15px',
        padding: '14px 20px',
        borderRadius: '16px',
        border: `1px solid ${C.rim}`,
      }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   LOADING / EMPTY
   ══════════════════════════════════════════════════════════ */

export function Spinner({ size = 28 }: { size?: number }) {
  return (
    <div className="flex justify-center py-16">
      <div
        style={{
          width: size, height: size,
          border: `2.5px solid ${C.primary}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  );
}

export function Skel({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse-slow ${className}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
    />
  );
}

export function EmptyState({
  icon: Icon, title, body, action,
}: { icon: any; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-20 gap-4 px-6 animate-fade-up">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(239,94,168,0.10)' }}
      >
        <Icon size={34} style={{ color: C.primary }} />
      </div>
      <div>
        <p style={{ fontSize: '18px', fontWeight: 700, color: C.ink }} className="mb-1">{title}</p>
        {body && <p style={{ fontSize: '14px', color: C.ink2, lineHeight: '1.55' }}>{body}</p>}
      </div>
      {action}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MISC
   ══════════════════════════════════════════════════════════ */

/** Horizontal scroll strip with hidden scrollbar. */
export function HScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1 ${className}`}>
      {children}
    </div>
  );
}

/** Section header + optional "see all" link. */
export function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p style={{ fontSize: '18px', fontWeight: 700, color: C.ink, letterSpacing: '-0.01em' }}>{title}</p>
      {href && (
        <Link href={href} className="flex items-center gap-0.5" style={{ fontSize: '14px', fontWeight: 600, color: C.primary }}>
          ดูทั้งหมด <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

/** iOS-style toggle switch. */
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-12 h-7 rounded-full relative shrink-0 transition-colors"
      style={{ backgroundColor: value ? C.primary : C.ink3 }}
    >
      <span
        className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-all"
        style={{ left: value ? 'calc(100% - 25px)' : '3px' }}
      />
    </button>
  );
}

/** Pink progress bar. */
export function ProgressBar({ pct, className = '' }: { pct: number; className?: string }) {
  return (
    <div
      className={`h-2 rounded-full overflow-hidden ${className}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: C.primary }}
      />
    </div>
  );
}

/* GradHero kept for compatibility — now renders as solid color header */
export function GradHero({ children }: { children: ReactNode }) {
  return (
    <div className="px-6 pb-5" style={{ backgroundColor: C.bg, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
      {children}
    </div>
  );
}

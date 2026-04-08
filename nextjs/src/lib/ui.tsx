'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react';

/* ─── Shared token object ────────────────────────────────────── */
export const C = {
  primary: '#ef5ea8',
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
};

export const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

export const glassHeader: React.CSSProperties = {
  background: 'rgba(255,255,255,0.94)',
  backdropFilter: 'saturate(180%) blur(20px)',
  WebkitBackdropFilter: 'saturate(180%) blur(20px)',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
};

/* ─── NavHeader ──────────────────────────────────────────────── */
export function NavHeader({
  title, right, onBack,
}: { title: string; right?: ReactNode; onBack?: () => void }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 header-shell" style={glassHeader}>
      <div
        className="flex items-center max-w-lg mx-auto"
        style={{ height: 54, paddingLeft: 20, paddingRight: 20, gap: 4 }}
      >
        <button
          onClick={onBack ?? (() => router.back())}
          className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{ width: 36, height: 36, flexShrink: 0 }}
        >
          <ArrowLeft size={22} style={{ color: C.primary }} />
        </button>
        <h1
          className="flex-1 truncate"
          style={{ fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em', paddingLeft: 4 }}
        >
          {title}
        </h1>
        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>
    </header>
  );
}

/* ─── TabHeader ──────────────────────────────────────────────── */
export function TabHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 header-shell" style={glassHeader}>
      <div
        className="flex items-center justify-between max-w-lg mx-auto"
        style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>{title}</h1>
        {right && <div>{right}</div>}
      </div>
    </div>
  );
}

/* ─── PrimaryBtn ─────────────────────────────────────────────── */
export function PrimaryBtn({
  children, onClick, loading, disabled, className = '', href,
}: {
  children: ReactNode; onClick?: () => void; loading?: boolean;
  disabled?: boolean; className?: string; href?: string;
}) {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.primary, color: '#FFFFFF',
    fontWeight: 700, fontSize: 16,
    padding: '15px 24px', borderRadius: 14, width: '100%',
    boxShadow: '0px 8px 24px rgba(239,94,168,0.25)',
    opacity: (loading || disabled) ? 0.5 : 1,
  };
  if (href) return (
    <Link href={href} className={`active:scale-[0.97] transition-transform ${className}`} style={style}>
      {children}
    </Link>
  );
  return (
    <button
      onClick={onClick} disabled={loading || disabled}
      className={`active:scale-[0.97] transition-transform ${className}`}
      style={style}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ─── SecondaryBtn ───────────────────────────────────────────── */
export function SecondaryBtn({
  children, onClick, className = '',
}: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 w-full active:scale-[0.97] transition-transform ${className}`}
      style={{
        backgroundColor: 'rgba(239,94,168,0.10)',
        color: C.primary, fontWeight: 600, fontSize: 15,
        padding: '15px 24px', borderRadius: 14,
      }}
    >
      {children}
    </button>
  );
}

/* ─── Spinner ────────────────────────────────────────────────── */
export function Spinner({ size = 28 }: { size?: number }) {
  return (
    <div className="flex justify-center" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <div style={{
        width: size, height: size,
        border: `2.5px solid ${C.primary}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

/* ─── Skel ───────────────────────────────────────────────────── */
export function Skel({
  className = '', style,
}: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse-slow ${className}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 8, ...style }}
    />
  );
}

/* ─── EmptyState ─────────────────────────────────────────────── */
export function EmptyState({
  icon: Icon, title, body, action,
}: { icon: any; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center" style={{ paddingTop: 64, paddingBottom: 64, gap: 16 }}>
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 80, height: 80, backgroundColor: 'rgba(239,94,168,0.10)' }}
      >
        <Icon size={32} style={{ color: C.primary }} />
      </div>
      <div>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{title}</p>
        {body && <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.55 }}>{body}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── HScroll ────────────────────────────────────────────────── */
export function HScroll({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex overflow-x-auto no-scrollbar pb-1 ${className}`} style={{ gap: 10, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
      {children}
    </div>
  );
}

/* ─── SectionHead ────────────────────────────────────────────── */
export function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{title}</p>
      {href && (
        <Link href={href} style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>
          ดูทั้งหมด
        </Link>
      )}
    </div>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────── */
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative rounded-full transition-colors"
      style={{ width: 50, height: 28, backgroundColor: value ? C.primary : C.ink3, flexShrink: 0 }}
    >
      <span
        className="absolute rounded-full bg-white shadow transition-all"
        style={{ top: 3, width: 22, height: 22, left: value ? 'calc(100% - 25px)' : 3 }}
      />
    </button>
  );
}

/* ─── ProgressBar ────────────────────────────────────────────── */
export function ProgressBar({ pct, className = '' }: { pct: number; className?: string }) {
  return (
    <div
      className={`rounded-full overflow-hidden ${className}`}
      style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.07)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: C.primary }}
      />
    </div>
  );
}

/* ─── Card (generic) ─────────────────────────────────────────── */
export function Card({
  children, className = '', onClick, href, padding = 16,
}: {
  children: ReactNode; className?: string;
  onClick?: () => void; href?: string; padding?: number;
}) {
  const s: React.CSSProperties = { ...card, padding };
  if (href) return (
    <Link href={href} className={`block active:scale-[0.97] transition-transform ${className}`} style={s}>
      {children}
    </Link>
  );
  if (onClick) return (
    <button onClick={onClick} className={`w-full text-left active:scale-[0.97] transition-transform ${className}`} style={s}>
      {children}
    </button>
  );
  return <div className={className} style={s}>{children}</div>;
}

/* GradHero kept for compat */
export function GradHero({ children }: { children: ReactNode }) {
  return (
    <div style={{ backgroundColor: C.bg, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}>
      {children}
    </div>
  );
}

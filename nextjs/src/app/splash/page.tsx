'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      router.replace(user ? '/home' : '/auth');
    }, 2400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ backgroundColor: '#ef5ea8' }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute rounded-full animate-breathe"
        style={{
          width: 320, height: 320,
          background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Mascot icon */}
      <div className="relative z-10 animate-scale-in" style={{ marginBottom: 24 }}>
        <Image
          src="/images/mascot.png"
          alt="Mydemy"
          width={148}
          height={148}
          className="rounded-[32px]"
          style={{ boxShadow: '0px 20px 48px rgba(0,0,0,0.24)' }}
          priority
        />
      </div>

      {/* Wordmark + tagline */}
      <div
        className="relative z-10 flex flex-col items-center animate-fade-up"
        style={{ gap: 8, animationDelay: '0.35s' }}
      >
        <Image
          src="/images/logo-wordmark.png"
          alt="Mydemy"
          width={130}
          height={42}
          className="object-contain brightness-0 invert"
          priority
        />
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.02em' }}>
          เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน
        </p>
      </div>

      {/* Loading bar */}
      <div
        className="absolute animate-fade-up"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 20px) + 28px)',
          left: 56, right: 56,
          animationDelay: '0.45s',
        }}
      >
        <div
          className="rounded-full overflow-hidden"
          style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.20)' }}
        >
          <div className="h-full rounded-full animate-fill-bar" style={{ backgroundColor: 'rgba(255,255,255,0.75)' }} />
        </div>
      </div>
    </div>
  );
}

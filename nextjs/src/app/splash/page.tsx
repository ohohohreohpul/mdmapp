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
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#ef5ea8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Glow ring */}
      <div
        className="animate-breathe"
        style={{
          position: 'absolute',
          width: 360, height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 68%)',
        }}
      />

      {/* Mascot */}
      <div className="animate-scale-in" style={{ position: 'relative', zIndex: 1, marginBottom: 28 }}>
        <Image
          src="/images/mascot.png"
          alt="Mydemy"
          width={160}
          height={160}
          className="rounded-[36px]"
          style={{ boxShadow: '0px 24px 56px rgba(0,0,0,0.22)' }}
          priority
        />
      </div>

      {/* Wordmark + tagline */}
      <div
        className="animate-fade-up"
        style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          animationDelay: '0.3s',
        }}
      >
        <Image
          src="/images/logo-wordmark.png"
          alt="Mydemy"
          width={136}
          height={44}
          className="brightness-0 invert object-contain"
          priority
        />
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.01em' }}>
          เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน
        </p>
      </div>

      {/* Loading dots */}
      <div
        className="animate-fade-up"
        style={{
          position: 'absolute',
          bottom: 52,
          display: 'flex', gap: 6,
          animationDelay: '0.5s',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="animate-breathe"
            style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.55)',
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

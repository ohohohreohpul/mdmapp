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
      {/* Ambient glow circles */}
      <div className="absolute w-[300px] h-[300px] rounded-full animate-breathe"
           style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />
      <div className="absolute w-[200px] h-[200px] rounded-full border border-white/20 animate-breathe"
           style={{ animationDelay: '0.3s' }} />

      {/* Mascot */}
      <div className="relative z-10 mb-6 animate-scale-in">
        <Image
          src="/images/mascot.png"
          alt="Mydemy"
          width={148}
          height={148}
          className="rounded-[32px] shadow-[0_24px_48px_rgba(0,0,0,0.22)]"
          priority
        />
      </div>

      {/* Wordmark + tagline */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 animate-fade-up"
           style={{ animationDelay: '0.4s' }}>
        <Image
          src="/images/logo-wordmark.png"
          alt="Mydemy"
          width={126}
          height={40}
          className="object-contain brightness-0 invert"
          priority
        />
        <p className="text-white/65 text-[13px] tracking-wide">เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน</p>
      </div>

      {/* Progress bar */}
      <div
        className="absolute inset-x-14 animate-fade-up"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 20px) + 28px)',
          animationDelay: '0.45s',
        }}
      >
        <div className="h-[3px] bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/75 rounded-full animate-fill-bar" />
        </div>
      </div>
    </div>
  );
}

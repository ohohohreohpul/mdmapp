'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      router.replace(stored ? '/home' : '/auth');
    }, 2400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(160deg, #f472b6 0%, #ef5ea8 50%, #db2777 100%)' }}>

      {/* Radial glow behind mascot */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[70vw] h-[70vw] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }} />
      </div>

      {/* Breathing ring */}
      <div
        className="absolute w-[200px] h-[200px] rounded-full border border-white/30"
        style={{ animation: 'breathe 1.6s ease-in-out infinite' }}
      />
      <div
        className="absolute w-[240px] h-[240px] rounded-full border border-white/15"
        style={{ animation: 'breathe 1.6s ease-in-out 0.3s infinite' }}
      />

      {/* Mascot */}
      <div
        className="relative z-10 mb-5"
        style={{ animation: 'fadeScaleIn 0.5s ease-out forwards', opacity: 0 }}
      >
        <Image
          src="/images/mascot.png"
          alt="Mydemy"
          width={160}
          height={160}
          className="rounded-[36px] shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
          priority
        />
      </div>

      {/* Wordmark */}
      <div
        className="relative z-10 flex flex-col items-center gap-1"
        style={{ animation: 'slideUpFade 0.4s ease-out 0.45s forwards', opacity: 0 }}
      >
        <Image
          src="/images/logo-wordmark.png"
          alt="Mydemy"
          width={130}
          height={42}
          className="object-contain h-[40px] w-auto brightness-0 invert"
          priority
        />
        <p className="text-white/70 text-[13px] tracking-wide">เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน</p>
      </div>

      {/* Progress bar */}
      <div
        className="absolute left-12 right-12"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 24px) + 24px)', animation: 'slideUpFade 0.4s ease-out 0.5s forwards', opacity: 0 }}
      >
        <div className="h-[3px] bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/90 rounded-full"
            style={{ animation: 'progressFill 2.1s ease-out 0.45s forwards', width: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

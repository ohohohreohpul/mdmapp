'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (stored) {
        router.replace('/home');
      } else {
        router.replace('/auth');
      }
    }, 2200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center overflow-hidden">
      {/* Soft glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[120vw] h-[120vw] rounded-full bg-white/[0.07]" />
      </div>

      {/* Breathing ring */}
      <div className="absolute w-[180px] h-[180px] rounded-full border-2 border-white/35 animate-[breathe_1.4s_ease-in-out_infinite]" />

      {/* Mascot */}
      <div className="relative z-10 animate-[fadeScaleIn_0.5s_ease-out_forwards] opacity-0 mb-6">
        <Image
          src="/images/mascot.png"
          alt="Mydemy mascot"
          width={220}
          height={220}
          className="rounded-[48px]"
          priority
        />
      </div>

      {/* Tagline */}
      <p className="relative z-10 text-white/85 text-[15px] animate-[slideUpFade_0.38s_ease-out_0.5s_forwards] opacity-0">
        เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน
      </p>

      {/* Progress bar */}
      <div className="absolute bottom-14 left-12 right-12 animate-[slideUpFade_0.38s_ease-out_0.5s_forwards] opacity-0">
        <div className="h-[3px] rounded-full bg-white/25 overflow-hidden">
          <div className="h-full bg-white rounded-full animate-[progressFill_2s_ease-out_0.4s_forwards] w-0" />
        </div>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}

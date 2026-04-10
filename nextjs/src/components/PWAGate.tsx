'use client';

/**
 * PWAGate — full-screen install gate shown when the app is opened
 * in a browser (not installed as a PWA / standalone).
 *
 * Platform behaviour:
 *  • Android Chrome  — captures beforeinstallprompt, shows native install button
 *  • iOS Safari      — shows a bottom sheet with step-by-step instructions
 *  • Desktop Chrome  — shows "open on mobile" hint
 *  • Other           — generic message
 *
 * Already installed (standalone) → renders children normally.
 */

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

// ── Platform detection (client-only) ─────────────────────────────────────────
function getUA() {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent;
}

const FEATURES = [
  { icon: '🎓', label: 'คอร์สเรียนออนไลน์คุณภาพสูง' },
  { icon: '📄', label: 'สร้าง Resume & Cover Letter อัจฉริยะ' },
  { icon: '💼', label: 'โอกาสงานจากบริษัทชั้นนำ' },
  { icon: '🏆', label: 'ใบรับรองที่นายจ้างเชื่อถือ' },
];

const IOS_STEPS = [
  {
    num: '1',
    badge: '↑',
    text: 'แตะปุ่ม Share (กล่องลูกศรชี้ขึ้น) ที่แถบล่าง Safari',
  },
  {
    num: '2',
    badge: '⊕',
    text: 'เลือก "Add to Home Screen" จากเมนู',
  },
  {
    num: '3',
    badge: 'Add',
    text: 'แตะ "Add" มุมขวาบน แล้วเปิดแอปจาก Home Screen',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function PWAGate({ children }: { children: React.ReactNode }) {
  const [isStandalone, setIsStandalone]     = useState<boolean | null>(null);
  const [isIOS, setIsIOS]                   = useState(false);
  const [isAndroid, setIsAndroid]           = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installing, setInstalling]         = useState(false);
  const [showSheet, setShowSheet]           = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Detect standalone + platform on mount (client only)
  useEffect(() => {
    const ua = getUA();
    const ios = /iPhone|iPad|iPod/.test(ua);
    const android = /Android/.test(ua);
    setIsIOS(ios);
    setIsAndroid(android);

    const standalone =
      // iOS Safari
      (window.navigator as any).standalone === true ||
      // All others (Chrome/Edge/Samsung etc.)
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches;

    setIsStandalone(standalone);
  }, []);

  // Capture Android beforeinstallprompt
  useEffect(() => {
    if (isStandalone) return;
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  // Sheet: close on outside tap
  useEffect(() => {
    if (!showSheet) return;
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setShowSheet(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSheet]);

  // Still detecting — render nothing to avoid flash
  if (isStandalone === null) return null;

  // Already installed → show the real app
  if (isStandalone) return <>{children}</>;

  // ── Install gate ────────────────────────────────────────────────────────────
  const isMobile = isIOS || isAndroid;

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setInstalling(false);
    }
  };

  function CTA() {
    if (isAndroid) {
      if (deferredPrompt) {
        return (
          <button
            onClick={handleAndroidInstall}
            disabled={installing}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: '#FFFFFF', borderRadius: 50,
              padding: '16px 32px', border: 'none', cursor: 'pointer',
              fontSize: 17, fontWeight: 700, color: '#ef5ea8',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              opacity: installing ? 0.7 : 1,
            }}
          >
            <span>⬇</span>
            {installing ? 'กำลังติดตั้ง…' : 'ติดตั้งแอป'}
          </button>
        );
      }
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16,
        }}>
          <span style={{ fontSize: 20 }}>⋮</span>
          <p style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, margin: 0 }}>
            แตะเมนู ⋮ ของ Chrome แล้วเลือก "Add to Home Screen"
          </p>
        </div>
      );
    }

    if (isIOS) {
      return (
        <button
          onClick={() => setShowSheet(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            backgroundColor: '#FFFFFF', borderRadius: 50,
            padding: '16px 32px', border: 'none', cursor: 'pointer',
            fontSize: 17, fontWeight: 700, color: '#ef5ea8',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <span>↑</span>
          วิธีติดตั้งบน iPhone / iPad
        </button>
      );
    }

    // Desktop
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, width: '100%',
      }}>
        <span style={{ fontSize: 32, marginBottom: 10 }}>🖥</span>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px' }}>ใช้งานบนมือถือดีกว่า</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
          เปิดลิงก์นี้บนโทรศัพท์ iOS หรือ Android{'\n'}
          แล้วติดตั้งเป็นแอปบน Home Screen
        </p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: '#0F0B1A',
      overflowY: 'auto', zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: '100%', maxWidth: 480, padding: '60px 28px 40px',
        gap: 0,
      }}>

        {/* Mascot */}
        <div style={{
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: '#ef5ea8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(239,94,168,0.5)',
        }}>
          <Image src="/images/mascot.png" alt="Mydemy" width={130} height={130}
            style={{ borderRadius: 36 }} priority />
        </div>

        {/* Wordmark */}
        <Image src="/images/logo-wordmark.png" alt="Mydemy" width={140} height={36}
          style={{ filter: 'brightness(0) invert(1)', objectFit: 'contain', marginBottom: 10 }} priority />

        {/* Tagline */}
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, textAlign: 'center' }}>
          เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน
        </p>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 24 }} />

        {/* Install card */}
        <div style={{
          width: '100%', backgroundColor: 'rgba(239,94,168,0.12)',
          border: '1px solid rgba(239,94,168,0.25)', borderRadius: 16,
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>📱</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              {isMobile ? 'ติดตั้งแอปเพื่อเริ่มเรียน' : 'เปิดบนมือถือเพื่อติดตั้ง'}
            </p>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, margin: 0 }}>
            ใช้งานได้เต็มที่เมื่อติดตั้งเป็นแอปบน Home Screen — เร็วกว่า ลื่นกว่า ไม่ต้องเปิดเบราว์เซอร์
          </p>
        </div>

        {/* Features */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {FEATURES.map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: 'rgba(239,94,168,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>{f.icon}</div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <CTA />
        </div>
      </div>

      {/* iOS bottom sheet */}
      {showSheet && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100000,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div ref={sheetRef} style={{
            width: '100%', backgroundColor: '#1C1C1E',
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: '12px 24px 40px',
          }}>
            {/* Handle */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.2)',
              margin: '0 auto 20px',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>วิธีติดตั้งบน iOS</p>
              <button
                onClick={() => setShowSheet(false)}
                style={{
                  width: 32, height: 32, borderRadius: 16, border: 'none', cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {IOS_STEPS.map(s => (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: 300, color: 'rgba(255,255,255,0.25)', width: 26, flexShrink: 0 }}>
                    {s.num}
                  </span>
                  <div style={{
                    width: 52, height: 52, borderRadius: 26, flexShrink: 0,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: s.badge === 'Add' ? 12 : 22,
                    fontWeight: 700, color: '#FFFFFF',
                  }}>
                    {s.badge === 'Add' ? (
                      <span style={{
                        backgroundColor: '#F3F4F6', color: '#1F2937',
                        borderRadius: 8, padding: '2px 6px', fontSize: 11, fontWeight: 700,
                      }}>Add</span>
                    ) : s.badge}
                  </div>
                  <p style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, margin: 0 }}>
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

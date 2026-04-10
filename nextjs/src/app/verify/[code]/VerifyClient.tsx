'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldCheck, XCircle, Share2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mydemy.co';

const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน',
  'พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม',
  'กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
];

function formatThaiDate(cert: any) {
  const date = new Date(cert.issued_at);
  const d = date.getDate();
  const m = cert.issue_month || (date.getMonth() + 1);
  const y = (cert.issue_year || date.getFullYear()) + 543;
  return `${d} ${THAI_MONTHS[m - 1]} ${y}`;
}

export default function VerifyClient() {
  const router   = useRouter();
  const pathname = usePathname();
  // useParams() returns the pre-built '_' placeholder in static-export mode.
  // Always extract the real code from the actual browser URL instead.
  const code = pathname.split('/').filter(Boolean).pop() || '';
  const [cert, setCert]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shared, setShared]   = useState(false);

  useEffect(() => {
    if (!code) return;
    axios.get(`${API_URL}/api/certificates/verify/${code}`)
      .then(r => setCert(r.data))
      .catch(err => { if (err?.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [code]);

  const handleShare = async () => {
    const url = `${APP_URL}/verify/${code}`;
    if (navigator.share) {
      await navigator.share({ title: 'ใบประกาศนียบัตร Mydemy', url });
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const isCareer = cert?.cert_type === 'career';
  const gold = '#C9A84C';

  // ── colours driven by cert type ────────────────────────────
  const bg       = isCareer ? '#10091F' : '#FEF6FB';
  const cardBg   = isCareer ? '#1A1230' : '#FFFFFF';
  const accent   = isCareer ? gold      : '#ef5ea8';
  const textHead = isCareer ? '#FFFFFF' : '#1C1C1E';
  const textSub  = isCareer ? 'rgba(255,255,255,0.55)' : '#8E8E93';
  const divider  = isCareer ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const stripBg  = isCareer
    ? `linear-gradient(90deg, ${gold}, #F5E6A3)`
    : `linear-gradient(90deg, #ef5ea8, #f98dcb)`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 header-shell"
        style={{
          background: isCareer ? 'rgba(16,9,31,0.85)' : 'rgba(254,246,251,0.85)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: `1px solid ${divider}`,
        }}
      >
        <div
          className="flex items-center max-w-lg mx-auto"
          style={{ height: 54, paddingLeft: 20, paddingRight: 20, gap: 4 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{ width: 36, height: 36, flexShrink: 0 }}
          >
            <ArrowLeft size={22} style={{ color: accent }} />
          </button>
          <h1
            className="flex-1 truncate"
            style={{ fontSize: 17, fontWeight: 600, color: textHead, letterSpacing: '-0.01em', paddingLeft: 4 }}
          >
            ตรวจสอบใบประกาศ
          </h1>
          {cert && (
            <button
              onClick={handleShare}
              className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ width: 36, height: 36, backgroundColor: accent + '20', flexShrink: 0 }}
            >
              <Share2 size={17} style={{ color: accent }} />
            </button>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 48px' }}>

        {/* ── Loading ─────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 16 }}>
            <div style={{
              width: 48, height: 48,
              border: `3px solid ${accent}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: 14, color: textSub }}>กำลังตรวจสอบ…</p>
          </div>
        )}

        {/* ── Not found ───────────────────────────────────────── */}
        {!loading && notFound && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, gap: 16, textAlign: 'center' }}>
            <div style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,59,48,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={48} color="#FF3B30" />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: textHead, marginBottom: 8 }}>ไม่พบใบประกาศ</p>
              <p style={{ fontSize: 14, color: textSub, lineHeight: 1.6 }}>
                รหัส <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{code}</span> ไม่ตรงกับใบประกาศใดในระบบ
              </p>
            </div>
          </div>
        )}

        {/* ── Certificate ─────────────────────────────────────── */}
        {!loading && cert && (
          <>
            {/* Valid banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              backgroundColor: 'rgba(52,199,89,0.12)',
              border: '1px solid rgba(52,199,89,0.30)',
              borderRadius: 16, padding: '12px 16px', marginBottom: 20,
            }}>
              <ShieldCheck size={20} color="#34C759" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#34C759' }}>
                ใบประกาศนี้ถูกต้อง และออกโดย Mydemy อย่างเป็นทางการ
              </p>
            </div>

            {/* Certificate card */}
            <div style={{
              borderRadius: 24, overflow: 'hidden',
              backgroundColor: cardBg,
              boxShadow: isCareer
                ? '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.20)'
                : '0 8px 40px rgba(239,94,168,0.18), 0 0 0 1px rgba(239,94,168,0.12)',
            }}>
              {/* Gradient stripe */}
              <div style={{ height: 5, background: stripBg }} />

              <div style={{ padding: 28 }}>

                {/* Logo row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      backgroundColor: isCareer ? `${gold}22` : 'rgba(239,94,168,0.10)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Image src="/images/logo.png" alt="Mydemy" width={30} height={30} style={{ objectFit: 'contain' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: accent, letterSpacing: '-0.01em' }}>Mydemy</p>
                      <p style={{ fontSize: 10, color: textSub, fontWeight: 500 }}>
                        {isCareer ? 'Career Certification' : 'Certificate of Completion'}
                      </p>
                    </div>
                  </div>
                  {isCareer && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: gold,
                      backgroundColor: `${gold}22`, borderRadius: 8, padding: '4px 10px',
                      border: `1px solid ${gold}44`,
                    }}>CAREER</span>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: divider, marginBottom: 24 }} />

                {/* Recipient */}
                <p style={{ fontSize: 12, color: textSub, marginBottom: 6 }}>
                  {isCareer ? 'มอบให้แก่' : 'ขอมอบใบประกาศนียบัตรนี้แก่'}
                </p>
                <h2 style={{
                  fontSize: 28, fontWeight: 900, color: textHead,
                  letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 20,
                }}>
                  {cert.user_display_name}
                </h2>

                {/* Course/path */}
                <p style={{ fontSize: 12, color: textSub, marginBottom: 6 }}>
                  {isCareer ? 'สำเร็จหลักสูตร Career Path' : 'เพื่อแสดงว่าสำเร็จการศึกษาคอร์ส'}
                </p>
                <p style={{
                  fontSize: 18, fontWeight: 800, color: accent,
                  letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 20,
                }}>
                  {isCareer ? cert.career_path : cert.course_title}
                </p>

                {/* Career courses list */}
                {isCareer && cert.career_courses?.length > 0 && (
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${divider}`,
                    borderRadius: 14, padding: 14, marginBottom: 20,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: textSub, marginBottom: 8 }}>📚 คอร์สที่เรียนสำเร็จ</p>
                    {cert.career_courses.map((c: string, i: number) => (
                      <p key={i} style={{ fontSize: 12, color: textSub, lineHeight: 1.7 }}>• {c}</p>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: 1, backgroundColor: divider, marginBottom: 20 }} />

                {/* Date + code */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 11, color: textSub, marginBottom: 3 }}>วันที่ออกใบประกาศ</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: textHead }}>{formatThaiDate(cert)}</p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    backgroundColor: isCareer ? `${gold}15` : 'rgba(239,94,168,0.08)',
                    border: `1px solid ${accent}30`,
                    borderRadius: 10, padding: '6px 12px',
                  }}>
                    <ShieldCheck size={13} style={{ color: accent, flexShrink: 0 }} />
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      fontFamily: 'monospace', color: accent,
                      letterSpacing: '0.04em',
                    }}>
                      {cert.verification_code}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Copied feedback */}
            {shared && (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#34C759', marginTop: 12, fontWeight: 600 }}>
                คัดลอกลิงก์แล้ว ✓
              </p>
            )}

            {/* Mydemy CTA */}
            <div style={{
              marginTop: 24,
              display: 'flex', alignItems: 'center', gap: 14,
              backgroundColor: isCareer ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              border: `1px solid ${divider}`,
              borderRadius: 18, padding: '16px 20px',
              boxShadow: isCareer ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: 'rgba(239,94,168,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Image src="/images/logo.png" alt="Mydemy" width={30} height={30} style={{ objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: textHead, marginBottom: 2 }}>เรียนกับ Mydemy</p>
                <p style={{ fontSize: 12, color: textSub }}>คอร์สออนไลน์คุณภาพสูง พร้อมใบรับรอง</p>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#ef5ea8',
                backgroundColor: 'rgba(239,94,168,0.10)',
                borderRadius: 8, padding: '5px 10px', flexShrink: 0,
              }}>ฟรี →</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

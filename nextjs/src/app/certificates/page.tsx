'use client';

import { useState, useEffect } from 'react';
import { Ribbon, Linkedin, ExternalLink, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Spinner } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mydemy.co';
const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF' };

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function formatThaiDate(cert: any) {
  const date = new Date(cert.issued_at);
  const d = date.getDate();
  const m = cert.issue_month || (date.getMonth() + 1);
  const y = (cert.issue_year || date.getFullYear()) + 543;
  return `${d} ${THAI_MONTHS[m - 1]} ${y}`;
}

function getLinkedInUrl(cert: any) {
  const certName   = encodeURIComponent(cert.cert_type === 'career' ? `${cert.career_path} Certification — Mydemy` : `${cert.course_title} — Mydemy`);
  const issueYear  = cert.issue_year || new Date(cert.issued_at).getFullYear();
  const issueMonth = cert.issue_month || new Date(cert.issued_at).getMonth() + 1;
  const certUrl    = encodeURIComponent(`${APP_URL}/verify/${cert.verification_code}`);
  const certId     = encodeURIComponent(cert.verification_code);
  return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationId=78329299&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${certUrl}&certId=${certId}`;
}

export default function CertificatesPage() {
  const { user } = useUser();
  const [certs, setCerts]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) loadCerts();
    else setLoading(false);
  }, [user?._id]);

  const loadCerts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/certificates/${user!._id}`);
      setCerts(Array.isArray(res.data) ? res.data : []);
    } catch { setCerts([]); }
    finally   { setLoading(false); }
  };

  const handleShare = async (cert: any) => {
    const url = `${APP_URL}/verify/${cert.verification_code}`;
    if (navigator.share) {
      await navigator.share({ title: cert.course_title || 'ใบประกาศนียบัตร', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('คัดลอกลิงก์แล้ว!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <NavHeader title="ใบประกาศนียบัตร" />

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '20px 20px 80px' }}>

        {!user ? (
          /* Not logged in */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 64, paddingBottom: 64, gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(239,94,168,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ribbon size={32} color={C.brand} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 6 }}>เข้าสู่ระบบเพื่อดูใบประกาศ</p>
            </div>
            <Link href="/auth" style={{ backgroundColor: C.brand, color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 14, textDecoration: 'none', boxShadow: '0px 8px 24px rgba(239,94,168,0.25)' }}>
              เข้าสู่ระบบ
            </Link>
          </div>

        ) : loading ? (
          <Spinner />

        ) : certs.length === 0 ? (
          /* Empty state */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 64, paddingBottom: 64, gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(239,94,168,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ribbon size={32} color={C.brand} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 6 }}>ยังไม่มีใบประกาศ</p>
              <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.55 }}>เรียนจบคอร์สและสอบผ่านเพื่อรับใบประกาศนียบัตร</p>
            </div>
            <Link href="/explore" style={{ backgroundColor: C.brand, color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 14, textDecoration: 'none', boxShadow: '0px 8px 24px rgba(239,94,168,0.25)' }}>
              สำรวจคอร์ส
            </Link>
          </div>

        ) : (
          /* Certificate list */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: C.ink3 }}>{certs.length} ใบประกาศ</p>
            {certs.map(cert => {
              const isCareer = cert.cert_type === 'career';
              const gold = '#C9A84C';
              return (
                <div key={cert._id} style={{
                  borderRadius: 20, overflow: 'hidden',
                  backgroundColor: isCareer ? '#1A1A2E' : '#FFFFFF',
                  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
                  border: isCareer ? `1px solid rgba(201,168,76,0.30)` : '1px solid rgba(0,0,0,0.06)',
                }}>
                  {/* Accent stripe */}
                  <div style={{ height: 4, background: isCareer ? `linear-gradient(90deg, ${gold}, #F5E6A3)` : C.brand }} />

                  <div style={{ padding: 20 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ borderRadius: 12, padding: 8, backgroundColor: isCareer ? 'rgba(201,168,76,0.20)' : 'rgba(239,94,168,0.10)' }}>
                        <Image src="/images/logo.png" alt="Mydemy" width={28} height={28} style={{ objectFit: 'contain' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isCareer ? gold : C.brand }}>Mydemy</span>
                      {isCareer && (
                        <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(201,168,76,0.20)', color: gold, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>
                          Career Certificate
                        </span>
                      )}
                    </div>

                    {/* Title + meta */}
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: isCareer ? '#fff' : C.ink, marginBottom: 4 }}>
                      {isCareer ? cert.career_path : cert.course_title}
                    </h3>
                    <p style={{ fontSize: 13, color: isCareer ? 'rgba(255,255,255,0.60)' : C.ink2, marginBottom: 4 }}>
                      มอบให้แก่ {user.display_name || user.username}
                    </p>
                    <p style={{ fontSize: 12, color: isCareer ? 'rgba(255,255,255,0.40)' : C.ink3 }}>{formatThaiDate(cert)}</p>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                      <a href={getLinkedInUrl(cert)} target="_blank" rel="noopener noreferrer"
                         style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0A66C2', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 0', borderRadius: 12, textDecoration: 'none' }}>
                        <Linkedin size={15} /> LinkedIn
                      </a>
                      <Link href={`/verify/${cert.verification_code}`}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '10px 0', borderRadius: 12, textDecoration: 'none', border: isCareer ? `1px solid rgba(201,168,76,0.30)` : '1px solid rgba(0,0,0,0.08)', backgroundColor: isCareer ? 'rgba(201,168,76,0.15)' : C.bg, color: isCareer ? gold : C.ink }}>
                        <ExternalLink size={15} /> ตรวจสอบ
                      </Link>
                      <button onClick={() => handleShare(cert)}
                              style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: isCareer ? `1px solid rgba(201,168,76,0.30)` : '1px solid rgba(0,0,0,0.08)', backgroundColor: isCareer ? 'rgba(201,168,76,0.15)' : C.bg, cursor: 'pointer', color: isCareer ? gold : C.ink }}>
                        <Share2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

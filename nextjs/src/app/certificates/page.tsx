'use client';

import { useState, useEffect } from 'react';
import { Ribbon, Linkedin, ExternalLink, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Spinner, EmptyState, PrimaryBtn } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mydemy.co';

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
  const [certs, setCerts]   = useState<any[]>([]);
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
    <div className="min-h-screen bg-bg">
      <NavHeader title="ใบประกาศนียบัตร" />

      <div className="max-w-lg mx-auto px-5 py-5 pb-10">
        {!user ? (
          <EmptyState icon={Ribbon} title="เข้าสู่ระบบเพื่อดูใบประกาศ"
            action={<PrimaryBtn href="/auth">เข้าสู่ระบบ</PrimaryBtn>} />
        ) : loading ? (
          <Spinner />
        ) : certs.length === 0 ? (
          <EmptyState icon={Ribbon} title="ยังไม่มีใบประกาศ" body="เรียนจบคอร์สและสอบผ่านเพื่อรับใบประกาศนียบัตร"
            action={<PrimaryBtn href="/explore">สำรวจคอร์ส</PrimaryBtn>} />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-ink-3">{certs.length} ใบประกาศ</p>
            {certs.map(cert => {
              const isCareer = cert.cert_type === 'career';
              return (
                <div key={cert._id}
                     className={`rounded-3xl overflow-hidden ${isCareer ? 'bg-[#1A1A2E]' : 'bg-surface'}`}
                     style={{ boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)', border: isCareer ? '1px solid rgba(201,168,76,0.30)' : '1px solid rgba(0,0,0,0.06)' }}>
                  <div className={`h-1.5 w-full ${isCareer ? 'bg-gradient-to-r from-[#C9A84C] to-[#F5E6A3]' : 'bg-brand'}`} />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`rounded-xl p-2 ${isCareer ? 'bg-[#C9A84C]/20' : 'bg-brand/10'}`}>
                        <Image src="/images/logo.png" alt="Mydemy" width={28} height={28} className="object-contain" />
                      </div>
                      <span className={`text-[12px] font-bold ${isCareer ? 'text-[#C9A84C]' : 'text-brand'}`}>Mydemy</span>
                      {isCareer && (
                        <span className="ml-auto bg-[#C9A84C]/20 text-[#C9A84C] text-[10px] font-bold px-2 py-0.5 rounded-full">Career Certificate</span>
                      )}
                    </div>
                    <h3 className={`text-[16px] font-extrabold mb-1 ${isCareer ? 'text-white' : 'text-ink'}`}>
                      {isCareer ? cert.career_path : cert.course_title}
                    </h3>
                    <p className={`text-[13px] mb-1 ${isCareer ? 'text-white/60' : 'text-ink-2'}`}>
                      มอบให้แก่ {user.display_name || user.username}
                    </p>
                    <p className={`text-[12px] ${isCareer ? 'text-white/40' : 'text-ink-3'}`}>{formatThaiDate(cert)}</p>

                    <div className="flex gap-2 mt-4">
                      <a href={getLinkedInUrl(cert)} target="_blank" rel="noopener noreferrer"
                         className="flex-1 flex items-center justify-center gap-1.5 bg-[#0A66C2] text-white text-[13px] font-semibold py-2.5 rounded-xl">
                        <Linkedin size={16} /> LinkedIn
                      </a>
                      <Link href={`/verify/${cert.verification_code}`}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold py-2.5 rounded-xl border ${
                              isCareer ? 'bg-[#C9A84C]/20 border-[#C9A84C]/30 text-[#C9A84C]' : 'bg-bg border-rim text-ink'
                            }`}>
                        <ExternalLink size={16} /> ตรวจสอบ
                      </Link>
                      <button onClick={() => handleShare(cert)}
                              className={`w-11 flex items-center justify-center rounded-xl border ${
                                isCareer ? 'bg-[#C9A84C]/20 border-[#C9A84C]/30 text-[#C9A84C]' : 'bg-bg border-rim text-ink'
                              }`}>
                        <Share2 size={16} />
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ribbon, Linkedin, ExternalLink, Share2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.mydemy.co';

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

function formatThaiDate(cert: any) {
  const date = new Date(cert.issued_at);
  const d = date.getDate();
  const m = cert.issue_month || (date.getMonth() + 1);
  const y = (cert.issue_year || date.getFullYear()) + 543;
  return `${d} ${THAI_MONTHS[m - 1]} ${y}`;
}

function getLinkedInUrl(cert: any) {
  const certName = encodeURIComponent(
    cert.cert_type === 'career'
      ? `${cert.career_path} Certification — Mydemy`
      : `${cert.course_title} — Mydemy`
  );
  const issueYear = cert.issue_year || new Date(cert.issued_at).getFullYear();
  const issueMonth = cert.issue_month || new Date(cert.issued_at).getMonth() + 1;
  const certUrl = encodeURIComponent(`${APP_URL}/verify/${cert.verification_code}`);
  const certId = encodeURIComponent(cert.verification_code);
  return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationId=78329299&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${certUrl}&certId=${certId}`;
}

export default function CertificatesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (user?._id) loadCerts();
    else setLoading(false);
  }, [user?._id]);

  const loadCerts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/certificates/${user!._id}`);
      setCerts(Array.isArray(res.data) ? res.data : []);
    } catch { setCerts([]); }
    finally { setLoading(false); }
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
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ios-bg transition-colors">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="text-[17px] font-bold text-text-primary">ใบประกาศนียบัตร</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        {!user ? (
          <div className="flex flex-col items-center text-center py-16 gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Ribbon size={32} className="text-primary" />
            </div>
            <p className="font-bold text-text-primary">เข้าสู่ระบบเพื่อดูใบประกาศ</p>
            <Link href="/auth" className="bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity">เข้าสู่ระบบ</Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : certs.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Ribbon size={32} className="text-primary" />
            </div>
            <p className="font-bold text-text-primary text-[18px]">ยังไม่มีใบประกาศ</p>
            <p className="text-sm text-text-secondary">เรียนจบคอร์สและสอบผ่านเพื่อรับใบประกาศนียบัตร</p>
            <Link href="/explore" className="bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity">สำรวจคอร์ส</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">{certs.length} ใบประกาศ</p>
            {certs.map(cert => {
              const isCareer = cert.cert_type === 'career';
              return (
                <div
                  key={cert._id}
                  className={`rounded-3xl overflow-hidden shadow-sm border ${isCareer ? 'bg-[#1A1A2E] border-[#C9A84C]/30' : 'bg-white border-separator'}`}
                >
                  {/* Top accent strip */}
                  <div className={`h-1.5 w-full ${isCareer ? 'bg-gradient-to-r from-[#C9A84C] to-[#F5E6A3]' : 'bg-primary'}`} />

                  <div className="p-5">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`rounded-xl p-2 ${isCareer ? 'bg-[#C9A84C]/20' : 'bg-primary/10'}`}>
                        <Image src="/images/logo.png" alt="Mydemy" width={28} height={28} className="object-contain" />
                      </div>
                      <span className={`text-[12px] font-bold ${isCareer ? 'text-[#C9A84C]' : 'text-primary'}`}>Mydemy</span>
                      {isCareer && (
                        <span className="ml-auto bg-[#C9A84C]/20 text-[#C9A84C] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Career Certificate
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className={`text-[16px] font-extrabold mb-1 ${isCareer ? 'text-white' : 'text-text-primary'}`}>
                      {isCareer ? cert.career_path : cert.course_title}
                    </h3>
                    <p className={`text-[13px] mb-1 ${isCareer ? 'text-white/60' : 'text-text-secondary'}`}>
                      มอบให้แก่ {user.display_name || user.username}
                    </p>
                    <p className={`text-[12px] ${isCareer ? 'text-white/40' : 'text-text-tertiary'}`}>
                      {formatThaiDate(cert)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <a
                        href={getLinkedInUrl(cert)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#0A66C2] text-white text-[13px] font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                      >
                        <Linkedin size={16} /> LinkedIn
                      </a>
                      <Link
                        href={`/verify/${cert.verification_code}`}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold py-2.5 rounded-xl border transition-colors ${
                          isCareer
                            ? 'bg-[#C9A84C]/20 border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/30'
                            : 'bg-ios-bg border-separator text-text-primary hover:border-primary/30'
                        }`}
                      >
                        <ExternalLink size={16} /> ตรวจสอบ
                      </Link>
                      <button
                        onClick={() => handleShare(cert)}
                        className={`w-11 flex items-center justify-center rounded-xl border transition-colors ${
                          isCareer
                            ? 'bg-[#C9A84C]/20 border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/30'
                            : 'bg-ios-bg border-separator text-text-primary hover:border-primary/30'
                        }`}
                      >
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

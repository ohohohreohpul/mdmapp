'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, XCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatThaiDate(cert: any) {
  const date = new Date(cert.issued_at);
  const d = date.getDate();
  const m = cert.issue_month || (date.getMonth() + 1);
  const y = (cert.issue_year || date.getFullYear()) + 543;
  return `${d} ${THAI_MONTHS[m - 1]} ${y}`;
}

export default function VerifyClient() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    axios.get(`${API_URL}/api/certificates/verify/${code}`)
      .then(r => setCert(r.data))
      .catch(err => { if (err?.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [code]);

  const isCareer = cert?.cert_type === 'career';

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-gray-800" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-800">ตรวจสอบใบประกาศ</h1>
        <div className="w-11" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">กำลังตรวจสอบ...</p>
          </div>
        ) : notFound ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-6">
            <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle size={52} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">ไม่พบใบประกาศ</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              รหัส {code} ไม่ตรงกับใบประกาศใดๆ ในระบบ<br />
              อาจพิมพ์ผิด หรือใบประกาศนี้ไม่มีอยู่จริง
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
              <ShieldCheck size={22} className="text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">ใบประกาศนี้ถูกต้องและออกโดย Mydemy</p>
            </div>

            <div className={`rounded-3xl overflow-hidden shadow-lg border ${isCareer ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`h-1.5 ${isCareer ? 'bg-amber-400' : 'bg-primary'}`} />
              <div className="p-6">
                <div className={isCareer ? 'inline-block bg-white rounded-xl px-3 py-1.5 mb-4' : 'mb-4'}>
                  <Image src="/images/mascot.png" alt="Mydemy" width={80} height={28} className="object-contain h-7 w-auto" />
                </div>
                <p className={`text-[11px] font-extrabold tracking-[0.15em] mb-4 ${isCareer ? 'text-amber-400' : 'text-primary'}`}>
                  {isCareer ? 'CAREER CERTIFICATION' : 'CERTIFICATE OF COMPLETION'}
                </p>
                <div className={`h-px mb-4 ${isCareer ? 'bg-gray-700' : 'bg-gray-100'}`} />
                <p className={`text-sm mb-1 ${isCareer ? 'text-white/50' : 'text-text-secondary'}`}>
                  {isCareer ? 'มอบให้แก่' : 'ขอมอบเกียรติบัตรนี้แก่'}
                </p>
                <h2 className={`text-2xl font-black tracking-tight leading-tight mb-4 ${isCareer ? 'text-white' : 'text-gray-800'}`}>
                  {cert.user_display_name}
                </h2>
                <p className={`text-sm mb-1 ${isCareer ? 'text-white/50' : 'text-text-secondary'}`}>
                  {isCareer ? 'สำเร็จหลักสูตร' : 'เพื่อแสดงว่าสำเร็จการศึกษาคอร์ส'}
                </p>
                <p className={`text-[15px] font-bold leading-snug ${isCareer ? 'text-amber-400' : 'text-primary'}`}>
                  {isCareer ? cert.career_path : cert.course_title}
                </p>
                {isCareer && cert.career_courses?.length > 0 && (
                  <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-3">
                    <p className="text-[11px] font-bold text-white/60 mb-2">📚 คอร์สที่เรียนสำเร็จ</p>
                    {cert.career_courses.map((c: string, i: number) => (
                      <p key={i} className="text-xs text-white/60 leading-5">• {c}</p>
                    ))}
                  </div>
                )}
                <div className={`h-px my-4 ${isCareer ? 'bg-gray-700' : 'bg-gray-100'}`} />
                <p className={`text-xs mb-3 ${isCareer ? 'text-white/50' : 'text-text-secondary'}`}>
                  ออกให้ ณ วันที่ {formatThaiDate(cert)}
                </p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${isCareer ? 'bg-amber-400/10' : 'bg-pink-50'}`}>
                  <ShieldCheck size={14} className={isCareer ? 'text-amber-400' : 'text-primary'} />
                  <span className={`text-[13px] font-bold font-mono ${isCareer ? 'text-yellow-300' : 'text-primary'}`}>
                    {cert.verification_code}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/" className="mt-6 flex items-center justify-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <Image src="/images/mascot.png" alt="Mydemy" width={80} height={28} className="object-contain h-7 w-auto" />
              <span className="text-sm font-bold text-primary">เรียนที่ Mydemy →</span>
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

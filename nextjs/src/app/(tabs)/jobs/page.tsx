import { Briefcase, Search, Bookmark, Bell, FileText, Building2 } from 'lucide-react';
import Link from 'next/link';

const C = {
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
  primary: '#ef5ea8',
  card:    { boxShadow: '0px 2px 12px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' },
};

const FEATURES = [
  { emoji: '🔍', color: '#3B82F6', bg: '#EFF6FF', title: 'ค้นหางานอัจฉริยะ',     desc: 'ตำแหน่งงานที่ตรงทักษะของคุณ' },
  { emoji: '🔖', color: '#A855F7', bg: '#F3E8FF', title: 'บันทึกงานที่ถูกใจ',    desc: 'เก็บตำแหน่งงานสำหรับภายหลัง' },
  { emoji: '🔔', color: '#F59E0B', bg: '#FEF3C7', title: 'แจ้งเตือนงานใหม่',     desc: 'รับการแจ้งเตือนงานที่ตรงกับคุณ' },
  { emoji: '📄', color: '#10B981', bg: '#DCFCE7', title: 'ส่งใบสมัครในคลิกเดียว', desc: 'สมัครงานได้อย่างง่ายดาย' },
];

export default function JobsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ── Glass header ──────────────────────────────── */}
      <div
        className="sticky top-0 z-20 header-shell"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.10)' }}
      >
        <div className="flex items-center px-6 h-[54px] max-w-lg mx-auto">
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>Job Board</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-5 flex flex-col gap-4 pb-10">

        {/* ── Hero card ─────────────────────────────────── */}
        <div
          className="rounded-[24px] p-7 flex flex-col items-center text-center"
          style={{ backgroundColor: C.surface, ...C.card }}
        >
          <div
            className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(239,94,168,0.10)' }}
          >
            <Briefcase size={34} style={{ color: C.primary }} />
          </div>
          <span
            className="text-[12px] font-bold px-3.5 py-1.5 rounded-full mb-3"
            style={{ backgroundColor: 'rgba(239,94,168,0.10)', color: C.primary }}
          >
            🚀 เร็ว ๆ นี้
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }} className="mb-2">Job Board</h2>
          <p style={{ fontSize: '14px', color: C.ink2, lineHeight: '1.55' }}>
            งานที่คัดสรรมาเฉพาะสำหรับคุณ<br/>อิงจากทักษะและประสบการณ์ที่สะสมจาก Mydemy
          </p>
        </div>

        {/* ── Feature grid ─────────────────────────────── */}
        <div>
          <p className="text-[12px] font-bold uppercase tracking-widest mb-3" style={{ color: C.ink3 }}>
            ฟีเจอร์ที่กำลังจะเปิดตัว
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ emoji, color, bg, title, desc }) => (
              <div
                key={title}
                className="rounded-[20px] p-4"
                style={{ backgroundColor: C.surface, ...C.card }}
              >
                <span className="text-[28px] mb-3 block">{emoji}</span>
                <p className="text-[13px] font-bold mb-1 leading-snug" style={{ color: C.ink }}>{title}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: C.ink2 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── For companies ─────────────────────────────── */}
        <div
          className="rounded-[20px] p-5 flex items-center gap-4"
          style={{ backgroundColor: C.surface, ...C.card }}
        >
          <div
            className="w-[54px] h-[54px] rounded-[16px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}
          >
            <Building2 size={26} style={{ color: '#10B981' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold mb-0.5" style={{ color: C.ink }}>สำหรับบริษัท</p>
            <p className="text-[12px]" style={{ color: C.ink2 }}>ต้องการลงประกาศรับสมัครงาน?</p>
          </div>
          <a
            href="mailto:contact@mydemy.co"
            className="shrink-0 font-bold text-[13px] px-4 py-2.5 rounded-[12px] text-white active:scale-95 transition-transform"
            style={{ backgroundColor: '#10B981' }}
          >
            ติดต่อ
          </a>
        </div>

        {/* ── Prep links ────────────────────────────────── */}
        <div
          className="rounded-[20px] overflow-hidden"
          style={{ backgroundColor: C.surface, ...C.card }}
        >
          <p className="px-5 pt-4 pb-2 text-[14px] font-bold" style={{ color: C.ink }}>เตรียมตัวให้พร้อมก่อน</p>
          {[
            { href: '/resume',  emoji: '📄', title: 'สร้าง Resume',      desc: 'อัปเดต Resume ให้พร้อมสมัครงาน' },
            { href: '/explore', emoji: '📚', title: 'เรียนทักษะเพิ่ม',   desc: 'ฝึกทักษะที่นายจ้างต้องการ' },
          ].map(({ href, emoji, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-5 py-3.5 border-t active:opacity-70 transition-opacity"
              style={{ borderColor: 'rgba(0,0,0,0.05)' }}
            >
              <span className="text-[22px]">{emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold" style={{ color: C.ink }}>{title}</p>
                <p className="text-[12px]" style={{ color: C.ink2 }}>{desc}</p>
              </div>
              <span style={{ color: C.ink3, fontSize: '18px' }}>›</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

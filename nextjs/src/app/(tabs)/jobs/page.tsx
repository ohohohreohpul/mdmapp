import { Briefcase, Building2 } from 'lucide-react';
import Link from 'next/link';

const C = {
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
  primary: '#ef5ea8',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

const FEATURES = [
  { emoji: '🔍', color: '#3B82F6', bg: '#EFF6FF', title: 'ค้นหางานอัจฉริยะ',      desc: 'ตำแหน่งงานที่ตรงทักษะของคุณ' },
  { emoji: '🔖', color: '#A855F7', bg: '#F3E8FF', title: 'บันทึกงานที่ถูกใจ',     desc: 'เก็บตำแหน่งงานสำหรับภายหลัง' },
  { emoji: '🔔', color: '#F59E0B', bg: '#FEF3C7', title: 'แจ้งเตือนงานใหม่',      desc: 'รับแจ้งเตือนงานที่ตรงกับคุณ' },
  { emoji: '📄', color: '#10B981', bg: '#DCFCE7', title: 'ส่งใบสมัครในคลิกเดียว',  desc: 'สมัครงานได้อย่างง่ายดาย' },
];

export default function JobsPage() {
  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>

      {/* ── Glass header ─────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 header-shell"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex items-center max-w-lg mx-auto"
          style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>Job Board</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto flex flex-col" style={{ padding: '20px 20px 36px', gap: 20 }}>

        {/* Hero */}
        <div style={{ ...cardStyle, padding: 28, textAlign: 'center' }}>
          <div
            className="flex items-center justify-center mx-auto"
            style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(239,94,168,0.10)', marginBottom: 16 }}
          >
            <Briefcase size={32} style={{ color: C.primary }} />
          </div>
          <span
            style={{
              fontSize: 12, fontWeight: 600, color: C.primary,
              backgroundColor: 'rgba(239,94,168,0.10)',
              borderRadius: 99, padding: '5px 14px',
              display: 'inline-block', marginBottom: 14,
            }}
          >
            🚀 เร็ว ๆ นี้
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', marginBottom: 10 }}>
            Job Board
          </h2>
          <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.65 }}>
            งานที่คัดสรรมาเฉพาะสำหรับคุณ<br />อิงจากทักษะที่สะสมจาก Mydemy
          </p>
        </div>

        {/* Features 2×2 */}
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
            ฟีเจอร์ที่กำลังจะเปิดตัว
          </p>
          <div className="grid grid-cols-2" style={{ gap: 10 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ ...cardStyle, padding: 16 }}>
                <div
                  className="flex items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: f.bg, marginBottom: 12, fontSize: 22 }}
                >
                  {f.emoji}
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4, lineHeight: 1.3 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: C.ink2, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company contact */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', padding: 16, gap: 14 }}>
          <div
            className="flex items-center justify-center"
            style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.12)', flexShrink: 0 }}
          >
            <Building2 size={24} style={{ color: '#10B981' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>สำหรับบริษัท</p>
            <p style={{ fontSize: 12, color: C.ink2 }}>ต้องการลงประกาศรับสมัครงาน?</p>
          </div>
          <a
            href="mailto:contact@mydemy.co"
            className="active:scale-95 transition-transform"
            style={{
              fontSize: 13, fontWeight: 700, color: 'white',
              backgroundColor: '#10B981', borderRadius: 10, padding: '9px 16px', flexShrink: 0,
            }}
          >
            ติดต่อ
          </a>
        </div>

        {/* Prep links */}
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, padding: '14px 16px 10px' }}>
            เตรียมตัวให้พร้อมก่อน
          </p>
          {[
            { href: '/resume',  emoji: '📄', title: 'สร้าง Resume',     desc: 'อัปเดต Resume ให้พร้อมสมัครงาน' },
            { href: '/explore', emoji: '📚', title: 'เรียนทักษะเพิ่ม',  desc: 'ฝึกทักษะที่นายจ้างต้องการ' },
          ].map(({ href, emoji, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center active:opacity-70 transition-opacity"
              style={{ gap: 12, padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{title}</p>
                <p style={{ fontSize: 12, color: C.ink2 }}>{desc}</p>
              </div>
              <span style={{ color: C.ink3, fontSize: 20, flexShrink: 0 }}>›</span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

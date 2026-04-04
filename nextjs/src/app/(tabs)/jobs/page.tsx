import { Briefcase, Search, Bookmark, Bell, FileText, Building2 } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  { icon: Search,   bg: '#EFF6FF', color: '#3B82F6', emoji: '🔍', title: 'ค้นหางานอัจฉริยะ',    desc: 'ตำแหน่งงานที่ตรงกับทักษะของคุณ' },
  { icon: Bookmark, bg: '#F3E8FF', color: '#A855F7', emoji: '🔖', title: 'บันทึกงานที่ถูกใจ',   desc: 'เก็บตำแหน่งงานสำหรับภายหลัง' },
  { icon: Bell,     bg: '#FEF3C7', color: '#F59E0B', emoji: '🔔', title: 'แจ้งเตือนงานใหม่',    desc: 'รับการแจ้งเตือนเมื่อมีตำแหน่งงานใหม่' },
  { icon: FileText, bg: '#DCFCE7', color: '#10B981', emoji: '📄', title: 'ส่งใบสมัครในคลิกเดียว', desc: 'ทำให้การสมัครงานง่ายขึ้น' },
];

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-bg">

      {/* ── Gradient hero ─────────────────────────────────── */}
      <div
        className="header-shell px-4 pb-8 flex flex-col items-center text-center"
        style={{
          background: 'linear-gradient(160deg, #34d399 0%, #10b981 50%, #059669 100%)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)',
        }}
      >
        <div
          className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.30)' }}
        >
          <Briefcase size={34} className="text-white" />
        </div>
        <h1 className="text-[24px] font-extrabold text-white mb-1.5">Job Board</h1>
        <span
          className="text-[12px] font-bold px-3.5 py-1 rounded-full mb-2"
          style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
        >
          🚀 เร็ว ๆ นี้
        </span>
        <p className="text-white/70 text-[13px] leading-relaxed max-w-[260px]">
          งานที่คัดสรรมาสำหรับคุณโดยเฉพาะ<br/>อิงจากทักษะและประสบการณ์ของคุณ
        </p>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 pb-10 flex flex-col gap-4">

        {/* ── Feature grid ──────────────────────────────────── */}
        <div>
          <p className="text-[12px] font-bold text-ink-3 uppercase tracking-wider mb-3">ฟีเจอร์ที่กำลังจะเปิดตัว</p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ bg, color, emoji, title, desc }) => (
              <div
                key={title}
                className="bg-surface rounded-2xl p-4"
                style={{ boxShadow: '0 1px 0 #e8e8f0, 0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #e8e8f0' }}
              >
                <span className="text-[28px] mb-2.5 block">{emoji}</span>
                <p className="text-[13px] font-bold text-ink mb-1 leading-snug">{title}</p>
                <p className="text-[11px] text-ink-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── For companies ─────────────────────────────────── */}
        <div
          className="bg-surface rounded-3xl p-5 flex items-center gap-4"
          style={{ boxShadow: '0 1px 0 #e8e8f0, 0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #e8e8f0' }}
        >
          <div
            className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #34d399, #10b981)' }}
          >
            <Building2 size={26} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-ink mb-0.5">สำหรับบริษัท</p>
            <p className="text-[12px] text-ink-2">ต้องการลงประกาศรับสมัครงาน? ติดต่อเรา</p>
          </div>
          <a
            href="mailto:contact@mydemy.co"
            className="shrink-0 bg-[#10b981] text-white font-bold text-[12px] px-4 py-2.5 rounded-xl active:scale-95 transition-transform"
          >
            ติดต่อ
          </a>
        </div>

        {/* ── Quick links ───────────────────────────────────── */}
        <div
          className="bg-surface rounded-3xl p-5"
          style={{ boxShadow: '0 1px 0 #e8e8f0, 0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #e8e8f0' }}
        >
          <p className="text-[14px] font-bold text-ink mb-3">เตรียมตัวให้พร้อมก่อน</p>
          <div className="flex flex-col gap-2.5">
            {[
              { href: '/resume',   emoji: '📄', title: 'สร้าง Resume', desc: 'อัปเดต Resume ให้พร้อมสมัครงาน' },
              { href: '/explore',  emoji: '📚', title: 'เรียนทักษะเพิ่ม', desc: 'ฝึกทักษะที่นายจ้างต้องการ' },
            ].map(({ href, emoji, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 bg-bg rounded-2xl px-3.5 py-3 active:scale-[0.98] transition-transform"
              >
                <span className="text-[22px]">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-ink">{title}</p>
                  <p className="text-[11px] text-ink-3">{desc}</p>
                </div>
                <span className="text-ink-3 text-[16px]">›</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

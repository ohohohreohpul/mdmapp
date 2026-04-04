import { Briefcase, Search, Bookmark, Bell, FileText, Building2 } from 'lucide-react';
import { TabHeader } from '@/lib/ui';

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <TabHeader title="Job Board" />

      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        {/* Coming soon hero */}
        <div className="bg-surface rounded-3xl p-8 flex flex-col items-center text-center mb-5 card-shadow">
          <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-4">
            <Briefcase size={40} className="text-brand" />
          </div>
          <h2 className="text-[22px] font-extrabold text-ink mb-2">Job Board</h2>
          <span className="bg-brand/10 text-brand text-[12px] font-bold px-3 py-1 rounded-full mb-3">
            เร็ว ๆ นี้
          </span>
          <p className="text-sm text-ink-2 leading-relaxed">
            เพลิดเพลินกับตัวเลือกงานที่คัดสรรมาสำหรับคุณ โดยอิงจากทักษะและประสบการณ์ของคุณ
          </p>
        </div>

        {/* Feature previews */}
        <div className="bg-surface rounded-3xl p-5 mb-5 card-shadow">
          <h3 className="text-[16px] font-bold text-ink mb-4">ฟีเจอร์ที่กำลังจะเปิดตัว</h3>
          <div className="flex flex-col gap-4">
            {[
              { icon: Search,   bg: '#EFF6FF', color: '#3B82F6', title: 'ค้นหางานอัจฉริยะ',    desc: 'ค้นหาตำแหน่งงานที่ตรงกับทักษะของคุณ' },
              { icon: Bookmark, bg: '#F3E8FF', color: '#A855F7', title: 'บันทึกงานที่ถูกใจ',   desc: 'เก็บตำแหน่งงานสำหรับภายหลัง' },
              { icon: Bell,     bg: '#FEF3C7', color: '#F59E0B', title: 'แจ้งเตือนงานใหม่',    desc: 'รับการแจ้งเตือนเมื่อมีตำแหน่งงานใหม่' },
              { icon: FileText, bg: '#DCFCE7', color: '#10B981', title: 'ส่งใบสมัครต่อบริษัท', desc: 'ทำให้การสมัครงานง่ายขึ้น' },
            ].map(({ icon: Icon, bg, color, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{title}</p>
                  <p className="text-[13px] text-ink-2">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For companies */}
        <div className="bg-surface rounded-3xl p-5 card-shadow">
          <div className="flex flex-col items-center text-center">
            <Building2 size={40} className="text-brand mb-3" />
            <h3 className="text-[16px] font-bold text-ink mb-1">สำหรับบริษัท</h3>
            <p className="text-sm text-ink-2 mb-4">ต้องการลงประกาศรับสมัครงาน? ติดต่อเรา</p>
            <a
              href="mailto:contact@mydemy.co"
              className="bg-brand text-white font-semibold text-sm px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
            >
              ติดต่อเรา
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

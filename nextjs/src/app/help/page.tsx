'use client';

import { useState } from 'react';
import { Headphones, Mail, MessageCircle, ChevronDown, ChevronUp, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { NavHeader } from '@/lib/ui';

const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF' };
const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

const FAQS = [
  { id: '1', question: 'วิธีเริ่มเรียนคอร์ส?',          answer: 'ไปที่หน้า "สำรวจ" เลือกคอร์สที่สนใจ แล้วกด "เริ่มเรียน"' },
  { id: '2', question: 'ฉันจะได้รับใบประกาศเมื่อไหร่?', answer: 'เมื่อคุณเรียนจบทุกบทเรียนและสอบผ่านข้อสอบปลายภาค' },
  { id: '3', question: 'สามารถเรียนออฟไลน์ได้ไหม?',     answer: 'ในตอนนี้ยังต้องใช้อินเทอร์เน็ตในการเรียน' },
  { id: '4', question: 'วิธีแก้ปัญหาวิดีโอไม่เล่น?',    answer: 'ลองเช็คการเชื่อมต่ออินเทอร์เน็ต หรือรีสตาร์ทแอป' },
  { id: '5', question: 'จะยกเลิกบัญชีได้อย่างไร?',      answer: 'ติดต่อทีมซัพพอร์ตผ่านอีเมล support@mydemy.co' },
];

const SOCIALS = [
  { Icon: Facebook,  color: '#1877F2' },
  { Icon: Instagram, color: '#E4405F' },
  { Icon: Twitter,   color: '#1DA1F2' },
  { Icon: Youtube,   color: '#FF0000' },
];

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <NavHeader title="ช่วยเหลือ" />

      <main style={{ maxWidth: 512, margin: '0 auto', padding: '20px 20px 80px' }}>

        {/* Contact hero */}
        <div style={{ backgroundColor: 'rgba(239,94,168,0.06)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: '0px 4px 16px rgba(0,0,0,0.08)' }}>
            <Headphones size={32} color={C.brand} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 4 }}>ต้องการความช่วยเหลือ?</h2>
          <p style={{ fontSize: 14, color: C.ink2, marginBottom: 16 }}>ทีมของเราพร้อมช่วยเหลือคุณ</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="mailto:support@mydemy.co" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              backgroundColor: C.brand, color: '#fff',
              padding: '10px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600,
              textDecoration: 'none',
            }}>
              <Mail size={16} /> อีเมล
            </a>
            <a href="https://line.me/mydemy" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              backgroundColor: '#fff', color: C.brand,
              padding: '10px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600,
              border: `1px solid ${C.brand}`, textDecoration: 'none',
            }}>
              <MessageCircle size={16} /> Line
            </a>
          </div>
        </div>

        {/* FAQ */}
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 12 }}>คำถามที่พบบ่อย</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {FAQS.map(faq => (
            <button
              key={faq.id}
              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              style={{ ...card, padding: 16, textAlign: 'left', width: '100%', border: card.border, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{faq.question}</span>
                {expandedFaq === faq.id
                  ? <ChevronUp size={18} color={C.ink3} style={{ flexShrink: 0 }} />
                  : <ChevronDown size={18} color={C.ink3} style={{ flexShrink: 0 }} />}
              </div>
              {expandedFaq === faq.id && (
                <p style={{ fontSize: 13, color: C.ink2, marginTop: 12, lineHeight: 1.6 }}>{faq.answer}</p>
              )}
            </button>
          ))}
        </div>

        {/* Social */}
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 12 }}>ติดตามเรา</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {SOCIALS.map(({ Icon, color }, i) => (
            <button key={i} style={{ ...card, width: 48, height: 48, border: card.border, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} style={{ color }} />
            </button>
          ))}
        </div>

      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Headphones, Mail, MessageCircle, ChevronDown, ChevronUp, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { NavHeader } from '@/lib/ui';

const FAQS = [
  { id: '1', question: 'วิธีเริ่มเรียนคอร์ส?',          answer: 'ไปที่หน้า "สำรวจ" เลือกคอร์สที่สนใจ แล้วกด "เริ่มเรียน"' },
  { id: '2', question: 'ฉันจะได้รับใบประกาศเมื่อไหร่?', answer: 'เมื่อคุณเรียนจบทุกบทเรียนและสอบผ่านข้อสอบปลายภาค' },
  { id: '3', question: 'สามารถเรียนออฟไลน์ได้ไหม?',     answer: 'ในตอนนี้ยังต้องใช้อินเทอร์เน็ตในการเรียน' },
  { id: '4', question: 'วิธีแก้ปัญหาวิดีโอไม่เล่น?',    answer: 'ลองเช็คการเชื่อมต่ออินเทอร์เน็ต หรือรีสตาร์ทแอป' },
  { id: '5', question: 'จะยกเลิกบัญชีได้อย่างไร?',      answer: 'ติดต่อทีมซัพพอร์ตผ่านอีเมล support@mydemy.co' },
];

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-bg">
      <NavHeader title="ช่วยเหลือ" />

      <main className="max-w-lg mx-auto px-4 py-5 pb-10">
        {/* Contact card */}
        <div className="bg-brand/5 rounded-2xl p-6 flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center card-shadow mb-3">
            <Headphones size={32} className="text-brand" />
          </div>
          <h2 className="text-[18px] font-bold text-ink mb-1">ต้องการความช่วยเหลือ?</h2>
          <p className="text-sm text-ink-2 mb-4">ทีมของเราพร้อมช่วยเหลือคุณ</p>
          <div className="flex gap-3">
            <a
              href="mailto:support@mydemy.co"
              className="flex items-center gap-2 bg-brand text-white px-5 py-3 rounded-2xl text-sm font-semibold"
            >
              <Mail size={18} />อีเมล
            </a>
            <a
              href="https://line.me/mydemy"
              className="flex items-center gap-2 bg-surface border border-brand text-brand px-5 py-3 rounded-2xl text-sm font-semibold"
            >
              <MessageCircle size={18} />Line
            </a>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-[15px] font-bold text-ink mb-3">คำถามที่พบบ่อย</h2>
        <div className="flex flex-col gap-2 mb-6">
          {FAQS.map(faq => (
            <button
              key={faq.id}
              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              className="bg-surface border border-rim rounded-2xl p-4 text-left w-full card-shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] font-semibold text-ink">{faq.question}</span>
                {expandedFaq === faq.id
                  ? <ChevronUp size={18} className="text-ink-3 shrink-0" />
                  : <ChevronDown size={18} className="text-ink-3 shrink-0" />}
              </div>
              {expandedFaq === faq.id && (
                <p className="text-[13px] text-ink-2 mt-3 leading-relaxed">{faq.answer}</p>
              )}
            </button>
          ))}
        </div>

        {/* Social */}
        <h2 className="text-[15px] font-bold text-ink mb-3">ติดตามเรา</h2>
        <div className="flex gap-3">
          {[
            { icon: Facebook,  color: '#1877F2' },
            { icon: Instagram, color: '#E4405F' },
            { icon: Twitter,   color: '#1DA1F2' },
            { icon: Youtube,   color: '#FF0000' },
          ].map(({ icon: Icon, color }, i) => (
            <button key={i} className="w-12 h-12 bg-surface border border-rim rounded-2xl flex items-center justify-center card-shadow">
              <Icon size={22} style={{ color }} />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

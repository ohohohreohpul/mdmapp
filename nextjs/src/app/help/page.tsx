'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Headphones, Mail, MessageCircle, ChevronDown, ChevronUp, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const FAQS = [
  { id: '1', question: 'วิธีเริ่มเรียนคอร์ส?', answer: 'ไปที่หน้า "สำรวจ" เลือกคอร์สที่สนใจ แล้วกด "เริ่มเรียน"' },
  { id: '2', question: 'ฉันจะได้รับใบประกาศเมื่อไหร่?', answer: 'เมื่อคุณเรียนจบทุกบทเรียนและสอบผ่านข้อสอบปลายภาค' },
  { id: '3', question: 'สามารถเรียนออฟไลน์ได้ไหม?', answer: 'ในตอนนี้ยังต้องใช้อินเทอร์เน็ตในการเรียน' },
  { id: '4', question: 'วิธีแก้ปัญหาวิดีโอไม่เล่น?', answer: 'ลองเช็คการเชื่อมต่ออินเทอร์เน็ต หรือรีสตาร์ทแอป' },
  { id: '5', question: 'จะยกเลิกบัญชีได้อย่างไร?', answer: 'ติดต่อทีมซัพพอร์ตผ่านอีเมล support@mydemy.co' },
];

export default function HelpPage() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-ios-bg">
      {/* Header */}
      <header className="bg-white border-b border-separator px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="text-[17px] font-bold text-text-primary">ช่วยเหลือ</h1>
        <div className="w-11" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 pb-10">
        {/* Contact card */}
        <div className="bg-pink-50 rounded-2xl p-6 flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
            <Headphones size={32} className="text-primary" />
          </div>
          <h2 className="text-[18px] font-bold text-text-primary mb-1">ต้องการความช่วยเหลือ?</h2>
          <p className="text-sm text-text-secondary mb-4">ทีมของเราพร้อมช่วยเหลือคุณ</p>
          <div className="flex gap-3">
            <a
              href="mailto:support@mydemy.co"
              className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Mail size={18} />
              อีเมล
            </a>
            <a
              href="https://line.me/mydemy"
              className="flex items-center gap-2 bg-white border border-primary text-primary px-5 py-3 rounded-xl text-sm font-semibold hover:bg-pink-50 transition-colors"
            >
              <MessageCircle size={18} />
              Line
            </a>
          </div>
        </div>

        {/* FAQ */}
        <h2 className="text-[16px] font-semibold text-text-primary mb-3">คำถามที่พบบ่อย</h2>
        <div className="flex flex-col gap-2 mb-6">
          {FAQS.map(faq => (
            <button
              key={faq.id}
              onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              className="bg-white border border-separator rounded-xl p-4 text-left w-full hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium text-text-primary">{faq.question}</span>
                {expandedFaq === faq.id
                  ? <ChevronUp size={18} className="text-text-secondary shrink-0" />
                  : <ChevronDown size={18} className="text-text-secondary shrink-0" />
                }
              </div>
              {expandedFaq === faq.id && (
                <p className="text-sm text-text-secondary mt-3 leading-relaxed">{faq.answer}</p>
              )}
            </button>
          ))}
        </div>

        {/* Social */}
        <h2 className="text-[16px] font-semibold text-text-primary mb-3">ติดตามเรา</h2>
        <div className="flex gap-3">
          {[
            { icon: Facebook, color: '#1877F2' },
            { icon: Instagram, color: '#E4405F' },
            { icon: Twitter, color: '#1DA1F2' },
            { icon: Youtube, color: '#FF0000' },
          ].map(({ icon: Icon, color }, i) => (
            <button
              key={i}
              className="w-12 h-12 bg-white border border-separator rounded-xl flex items-center justify-center hover:border-gray-300 transition-colors"
            >
              <Icon size={22} style={{ color }} />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

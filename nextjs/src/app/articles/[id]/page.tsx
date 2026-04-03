'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { ARTICLES, CATEGORY_COLORS } from '@/lib/articles';

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const article = ARTICLES.find(a => a.id === id);

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">ไม่พบบทความ</p>
        <button onClick={() => router.back()} className="text-primary font-semibold text-sm">
          ← กลับ
        </button>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[article.category] || '#636366';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-separator px-4 py-3 flex items-center sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-text-primary" />
        </button>
      </header>

      <div className="max-w-lg mx-auto pb-16">
        {/* Hero */}
        <div
          className="h-44 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: article.cover_color + '18' }}
        >
          <span className="text-5xl">{article.cover_emoji}</span>
          <span
            className="px-3.5 py-1 rounded-full text-[12px] font-bold text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {article.category}
          </span>
        </div>

        <div className="px-5 pt-4">
          {/* Read time */}
          <div className="flex items-center gap-1.5 text-text-secondary mb-2">
            <Clock size={14} />
            <span className="text-[13px]">{article.read_time} นาทีในการอ่าน</span>
          </div>

          {/* Title */}
          <h1 className="text-[22px] font-extrabold text-text-primary leading-tight mb-4">
            {article.title}
          </h1>

          {/* Divider */}
          <div className="h-px bg-separator mb-5" />

          {/* Content */}
          <div className="text-[16px] text-text-primary leading-[1.75] whitespace-pre-line">
            {article.content}
          </div>

          {/* CTA */}
          <div
            className="mt-8 p-5 rounded-2xl"
            style={{ backgroundColor: article.cover_color + '15' }}
          >
            <p className="text-[16px] font-extrabold text-text-primary mb-1">สนใจพัฒนาทักษะนี้?</p>
            <p className="text-[14px] text-text-secondary leading-snug mb-4">
              Mydemy มีคอร์ส {article.category} ที่ออกแบบมาเพื่อให้คุณเริ่มต้นได้ทันที
            </p>
            <Link
              href="/explore"
              className="inline-block w-full text-center py-3 rounded-xl text-white font-bold text-[15px] transition-opacity hover:opacity-90"
              style={{ backgroundColor: article.cover_color }}
            >
              ดูคอร์สที่เกี่ยวข้อง
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

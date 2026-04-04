import Link from 'next/link';
import { Clock } from 'lucide-react';
import { ARTICLES, CATEGORY_COLORS } from '@/lib/articles';
import BackButton from './BackButton';

export async function generateStaticParams() {
  return ARTICLES.map(a => ({ id: a.id }));
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params;
  const article  = ARTICLES.find(a => a.id === id);

  if (!article) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <p className="text-ink-2">ไม่พบบทความ</p>
        <Link href="/home" className="text-brand font-semibold text-sm">← กลับหน้าหลัก</Link>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[article.category] || '#a5a5c0';

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface border-b border-rim px-4 py-3 flex items-center sticky top-0 z-10 header-shell">
        <BackButton />
      </header>

      <div className="max-w-lg mx-auto pb-16">
        {/* Hero */}
        <div className="h-44 flex flex-col items-center justify-center gap-3"
             style={{ backgroundColor: article.cover_color + '18' }}>
          <span className="text-5xl">{article.cover_emoji}</span>
          <span className="px-3.5 py-1 rounded-full text-[12px] font-bold text-white"
                style={{ backgroundColor: categoryColor }}>
            {article.category}
          </span>
        </div>

        <div className="px-5 pt-4">
          <div className="flex items-center gap-1.5 text-ink-2 mb-2">
            <Clock size={14} />
            <span className="text-[13px]">{article.read_time} นาทีในการอ่าน</span>
          </div>

          <h1 className="text-[22px] font-extrabold text-ink leading-tight mb-4">{article.title}</h1>

          <div className="h-px bg-rim mb-5" />

          <div className="text-[16px] text-ink leading-[1.75] whitespace-pre-line">{article.content}</div>

          <div className="mt-8 p-5 rounded-2xl" style={{ backgroundColor: article.cover_color + '15' }}>
            <p className="text-[16px] font-extrabold text-ink mb-1">สนใจพัฒนาทักษะนี้?</p>
            <p className="text-[14px] text-ink-2 leading-snug mb-4">
              Mydemy มีคอร์ส {article.category} ที่ออกแบบมาเพื่อให้คุณเริ่มต้นได้ทันที
            </p>
            <Link
              href="/explore"
              className="inline-block w-full text-center py-3 rounded-2xl text-white font-bold text-[15px]"
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

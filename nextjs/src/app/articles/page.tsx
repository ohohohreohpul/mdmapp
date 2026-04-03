'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import { ARTICLES, CATEGORIES, CATEGORY_COLORS } from '@/lib/articles';
import { cn } from '@/lib/utils';

export default function ArticlesPage() {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('ทั้งหมด');

  const filtered = selectedCat === 'ทั้งหมด'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === selectedCat);

  return (
    <div className="min-h-screen bg-ios-bg">
      {/* Header */}
      <header className="bg-white border-b border-separator px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="text-[17px] font-bold text-text-primary">รวมเคล็ดลับ & บทความ</h1>
        <div className="w-11" />
      </header>

      {/* Category filter */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex gap-2 px-4 py-3 w-max">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors',
                selectedCat === cat
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-secondary border border-separator hover:border-primary/30'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pb-8">
        <p className="text-sm text-text-secondary mb-3">{filtered.length} บทความ</p>

        <div className="flex flex-col gap-3">
          {filtered.map(article => (
            <button
              key={article.id}
              onClick={() => router.push(`/articles/${article.id}`)}
              className="bg-white rounded-2xl overflow-hidden border border-separator shadow-sm hover:shadow-md transition-shadow text-left w-full"
            >
              {/* Cover */}
              <div
                className="h-28 flex items-center justify-center text-4xl"
                style={{ backgroundColor: article.cover_color + '22' }}
              >
                <span>{article.cover_emoji}</span>
              </div>

              <div className="p-4">
                {/* Category badge */}
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold text-white mb-2"
                  style={{ backgroundColor: CATEGORY_COLORS[article.category] || '#636366' }}
                >
                  {article.category}
                </span>

                <h2 className="text-[15px] font-bold text-text-primary leading-snug mb-2">
                  {article.title}
                </h2>

                <div className="flex items-center gap-1 text-text-tertiary">
                  <Clock size={12} />
                  <span className="text-xs">{article.read_time} นาที</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

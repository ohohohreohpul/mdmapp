'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ARTICLES, CATEGORIES, CATEGORY_COLORS } from '@/lib/articles';
import { NavHeader } from '@/lib/ui';

export default function ArticlesPage() {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('ทั้งหมด');

  const filtered = selectedCat === 'ทั้งหมด'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === selectedCat);

  return (
    <div className="min-h-screen bg-bg">
      <NavHeader title="รวมเคล็ดลับ & บทความ" />

      {/* Category filter */}
      <div className="bg-surface border-b border-rim sticky top-[54px] z-10">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 px-4 py-3 w-max">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  selectedCat === cat
                    ? 'bg-brand text-white'
                    : 'bg-bg text-ink-2 border border-rim'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-5 pb-8 pt-4">
        <p className="text-sm text-ink-3 mb-3">{filtered.length} บทความ</p>

        <div className="flex flex-col gap-3">
          {filtered.map(article => (
            <button
              key={article.id}
              onClick={() => router.push(`/articles/${article.id}`)}
              className="rounded-2xl overflow-hidden text-left w-full active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#FFFFFF', borderRadius: 16, boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}
            >
              <div
                className="h-28 flex items-center justify-center text-4xl"
                style={{ backgroundColor: article.cover_color + '22' }}
              >
                <span>{article.cover_emoji}</span>
              </div>
              <div className="p-4">
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold text-white mb-2"
                  style={{ backgroundColor: CATEGORY_COLORS[article.category] || '#a5a5c0' }}
                >
                  {article.category}
                </span>
                <h2 className="text-[15px] font-bold text-ink leading-snug mb-2">{article.title}</h2>
                <div className="flex items-center gap-1 text-ink-3">
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

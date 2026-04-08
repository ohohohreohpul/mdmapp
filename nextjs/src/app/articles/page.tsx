'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ARTICLES, CATEGORIES, CATEGORY_COLORS } from '@/lib/articles';
import { NavHeader } from '@/lib/ui';

const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF' };
const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

export default function ArticlesPage() {
  const router = useRouter();
  const [selectedCat, setSelectedCat] = useState('ทั้งหมด');

  const filtered = selectedCat === 'ทั้งหมด'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === selectedCat);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <NavHeader title="รวมเคล็ดลับ & บทความ" />

      {/* Category filter */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.94)', borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'sticky', top: 54, zIndex: 10, backdropFilter: 'saturate(180%) blur(20px)' }}>
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ display: 'flex', gap: 8, padding: '10px 20px', width: 'max-content' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                style={{
                  padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
                  backgroundColor: selectedCat === cat ? C.brand : 'rgba(0,0,0,0.06)',
                  color: selectedCat === cat ? '#fff' : C.ink2,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 512, margin: '0 auto', padding: '16px 20px 80px' }}>
        <p style={{ fontSize: 13, color: C.ink3, marginBottom: 12 }}>{filtered.length} บทความ</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(article => (
            <button
              key={article.id}
              onClick={() => router.push(`/articles/${article.id}`)}
              style={{ ...card, overflow: 'hidden', textAlign: 'left', width: '100%', border: card.border, cursor: 'pointer' }}
            >
              <div style={{ height: 112, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, backgroundColor: article.cover_color + '22' }}>
                {article.cover_emoji}
              </div>
              <div style={{ padding: 16 }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                  fontSize: 11, fontWeight: 700, color: '#fff', marginBottom: 8,
                  backgroundColor: CATEGORY_COLORS[article.category] || '#a5a5c0',
                }}>
                  {article.category}
                </span>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.4, marginBottom: 8 }}>{article.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.ink3 }}>
                  <Clock size={12} />
                  <span style={{ fontSize: 12 }}>{article.read_time} นาที</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

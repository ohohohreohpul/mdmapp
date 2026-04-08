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
      <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: '#8E8E93' }}>ไม่พบบทความ</p>
        <Link href="/home" style={{ color: '#ef5ea8', fontWeight: 600, fontSize: 14 }}>← กลับหน้าหลัก</Link>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[article.category] || '#a5a5c0';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '0 16px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, paddingTop: 'env(safe-area-inset-top, 0px)', height: 'calc(env(safe-area-inset-top, 0px) + 52px)' }}>
        <BackButton />
      </header>

      <div style={{ maxWidth: 512, margin: '0 auto', paddingBottom: 64 }}>
        {/* Hero */}
        <div style={{ height: 176, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: article.cover_color + '18' }}>
          <span style={{ fontSize: 48 }}>{article.cover_emoji}</span>
          <span style={{ padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#fff', backgroundColor: categoryColor }}>
            {article.category}
          </span>
        </div>

        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8E8E93', marginBottom: 8 }}>
            <Clock size={14} />
            <span style={{ fontSize: 13 }}>{article.read_time} นาทีในการอ่าน</span>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C1C1E', lineHeight: 1.3, margin: '0 0 16px' }}>{article.title}</h1>

          <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginBottom: 20 }} />

          <div style={{ fontSize: 16, color: '#1C1C1E', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{article.content}</div>

          <div style={{ marginTop: 32, padding: 20, borderRadius: 16, backgroundColor: article.cover_color + '15' }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#1C1C1E', margin: '0 0 4px' }}>สนใจพัฒนาทักษะนี้?</p>
            <p style={{ fontSize: 14, color: '#8E8E93', lineHeight: 1.4, margin: '0 0 16px' }}>
              Mydemy มีคอร์ส {article.category} ที่ออกแบบมาเพื่อให้คุณเริ่มต้นได้ทันที
            </p>
            <Link
              href="/explore"
              style={{ display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 16, color: '#fff', fontWeight: 700, fontSize: 15, backgroundColor: article.cover_color, textDecoration: 'none' }}
            >
              ดูคอร์สที่เกี่ยวข้อง
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

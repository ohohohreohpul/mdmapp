'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Building2, RefreshCw, Trash2, ExternalLink, MapPin, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { cachedGet } from '@/lib/apiCache';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const ADMIN_EMAILS = ['jiranan@mydemy.co'];

const API = process.env.NEXT_PUBLIC_API_URL || '';

const CAREER_PATHS = [
  'ทั้งหมด',
  'UX Design',
  'Data Analysis',
  'Digital Marketing',
  'Full-Stack Web',
  'Sales',
  'Graphic Design',
];

const C = {
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
  primary: '#ef5ea8',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

/* ─── Source badge ───────────────────────────────────────────────────────── */

const SOURCE_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  linkedin: { label: 'LinkedIn', bg: '#E7F0FA', color: '#0A66C2' },
  seek:     { label: 'Seek',     bg: '#E8F5E9', color: '#1B5E20' },
};

function SourceBadge({ source }: { source: string }) {
  const s = SOURCE_STYLES[source] ?? { label: source, bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
      color: s.color, backgroundColor: s.bg,
      borderRadius: 6, padding: '3px 7px',
    }}>
      {s.label}
    </span>
  );
}

/* ─── Job card ───────────────────────────────────────────────────────────── */

interface Job {
  id: string;
  source: string;
  title: string;
  company: string;
  company_logo?: string;
  location?: string;
  location_type?: string;
  salary_label?: string;
  url: string;
  career_path?: string;
  posted_at?: string;
  fetched_at: string;
}

function JobCard({ job, onDelete }: { job: Job; onDelete?: (id: string) => void }) {
  const locIcon: Record<string, string> = {
    remote: '🌐', hybrid: '🏠', onsite: '🏢', unknown: '📍',
  };

  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      {/* Top row */}
      <div className="flex items-start" style={{ gap: 12, marginBottom: 10 }}>
        {/* Logo / initials */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          backgroundColor: 'rgba(239,94,168,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {job.company_logo
            ? <img src={job.company_logo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>
                {job.company.charAt(0).toUpperCase()}
              </span>
          }
        </div>

        {/* Title / company */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.3, marginBottom: 2 }}>
            {job.title}
          </p>
          <p style={{ fontSize: 12, color: C.ink2 }}>{job.company}</p>
        </div>

        <SourceBadge source={job.source} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 12 }}>
        {job.location && (
          <span style={{ fontSize: 11, color: C.ink2, display: 'flex', alignItems: 'center', gap: 3 }}>
            <span>{locIcon[job.location_type ?? 'unknown']}</span>
            {job.location}
          </span>
        )}
        {job.salary_label && (
          <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 3 }}>
            <DollarSign size={10} />
            {job.salary_label}
          </span>
        )}
        {job.career_path && (
          <span style={{
            fontSize: 10, color: C.primary, backgroundColor: 'rgba(239,94,168,0.08)',
            borderRadius: 6, padding: '2px 7px',
          }}>
            {job.career_path}
          </span>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center" style={{ gap: 8 }}>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center"
          style={{
            flex: 1, gap: 6, justifyContent: 'center',
            backgroundColor: C.primary, color: '#fff',
            borderRadius: 10, padding: '8px 14px',
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}
        >
          <ExternalLink size={13} />
          ดูงาน
        </a>
        {onDelete && (
          <button
            onClick={() => onDelete(job.id)}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
              backgroundColor: 'rgba(255,59,48,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={15} style={{ color: '#FF3B30' }} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Admin job board ─────────────────────────────────────────────────────── */

function AdminJobBoard() {
  const [jobs, setJobs]               = useState<Job[]>([]);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [syncResult, setSyncResult]   = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ทั้งหมด');

  const fetchJobs = async (path?: string) => {
    setLoading(true);
    try {
      const qs = path && path !== 'ทั้งหมด' ? `?career_path=${encodeURIComponent(path)}` : '';
      const data = await cachedGet(`${API}/api/jobs${qs}`);
      setJobs(data || []);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(activeFilter); }, [activeFilter]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`${API}/api/admin/jobs/sync`, { method: 'POST' });
      const d   = await res.json();
      if (d.errors?.length) {
        setSyncResult(`เพิ่ม ${d.upserted} งาน (${d.errors.length} ข้อผิดพลาด)`);
      } else {
        setSyncResult(`เพิ่ม ${d.upserted} งานสำเร็จ ✓`);
      }
      fetchJobs(activeFilter);
    } catch (e: any) {
      setSyncResult(`ข้อผิดพลาด: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    await fetch(`${API}/api/admin/jobs/${id}`, { method: 'DELETE' });
  };

  const counts = {
    linkedin: jobs.filter(j => j.source === 'linkedin').length,
    seek:     jobs.filter(j => j.source === 'seek').length,
  };

  return (
    <div style={{ backgroundColor: C.bg }}>
      {/* Glass header */}
      <div
        className="sticky top-0 z-20 header-shell"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-center max-w-lg mx-auto" style={{ height: 54, paddingLeft: 20, paddingRight: 20, gap: 10 }}>
          <h1 style={{ flex: 1, fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>
            Job Board
          </h1>
          {/* Admin sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center"
            style={{
              gap: 6, backgroundColor: syncing ? C.ink3 : C.primary,
              color: '#fff', borderRadius: 10, padding: '7px 14px',
              border: 'none', cursor: syncing ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 0.7s linear infinite' : 'none' }} />
            {syncing ? 'กำลังดึง…' : 'Sync'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto" style={{ padding: '16px 0 36px' }}>

        {/* Source stats */}
        <div className="flex" style={{ gap: 8, paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
          {Object.entries(counts).map(([src, n]) => {
            const s = SOURCE_STYLES[src];
            return (
              <div key={src} style={{
                flex: 1, ...cardStyle, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <SourceBadge source={src} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{n}</span>
                <span style={{ fontSize: 12, color: C.ink2 }}>งาน</span>
              </div>
            );
          })}
        </div>

        {/* Sync result toast */}
        {syncResult && (
          <div style={{
            marginLeft: 20, marginRight: 20, marginBottom: 12,
            backgroundColor: syncResult.includes('ข้อผิดพลาด') ? 'rgba(255,59,48,0.08)' : 'rgba(52,199,89,0.10)',
            border: `1px solid ${syncResult.includes('ข้อผิดพลาด') ? 'rgba(255,59,48,0.2)' : 'rgba(52,199,89,0.2)'}`,
            borderRadius: 12, padding: '10px 14px',
            fontSize: 13, color: syncResult.includes('ข้อผิดพลาด') ? '#FF3B30' : '#34C759', fontWeight: 600,
          }}>
            {syncResult}
          </div>
        )}

        {/* Career filter pills */}
        <div
          className="flex no-scrollbar"
          style={{ overflowX: 'auto', paddingLeft: 20, paddingRight: 20, gap: 8, marginBottom: 16 }}
        >
          {CAREER_PATHS.map(cp => (
            <button
              key={cp}
              onClick={() => setActiveFilter(cp)}
              style={{
                flexShrink: 0,
                backgroundColor: activeFilter === cp ? C.primary : C.surface,
                color: activeFilter === cp ? '#fff' : C.ink2,
                border: activeFilter === cp ? 'none' : '1px solid rgba(0,0,0,0.08)',
                borderRadius: 99, padding: '7px 16px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: activeFilter === cp ? '0 2px 8px rgba(239,94,168,0.30)' : 'none',
              }}
            >
              {cp}
            </button>
          ))}
        </div>

        {/* Job list */}
        <div className="flex flex-col" style={{ gap: 12, paddingLeft: 20, paddingRight: 20 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ ...cardStyle, padding: 16, height: 120 }}
                className="skel-shimmer" />
            ))
          ) : jobs.length === 0 ? (
            <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
                ยังไม่มีงาน
              </p>
              <p style={{ fontSize: 13, color: C.ink2 }}>
                กด Sync เพื่อดึงงานจาก LinkedIn และ Seek
              </p>
            </div>
          ) : (
            jobs.map(job => (
              <JobCard key={job.id} job={job} onDelete={handleDelete} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── Coming-soon view (non-admin) ──────────────────────────────────────── */

const FEATURES = [
  { emoji: '🔍', color: '#3B82F6', bg: '#EFF6FF', title: 'ค้นหางานอัจฉริยะ',      desc: 'ตำแหน่งงานที่ตรงทักษะของคุณ' },
  { emoji: '🔖', color: '#A855F7', bg: '#F3E8FF', title: 'บันทึกงานที่ถูกใจ',     desc: 'เก็บตำแหน่งงานสำหรับภายหลัง' },
  { emoji: '🔔', color: '#F59E0B', bg: '#FEF3C7', title: 'แจ้งเตือนงานใหม่',      desc: 'รับแจ้งเตือนงานที่ตรงกับคุณ' },
  { emoji: '📄', color: '#10B981', bg: '#DCFCE7', title: 'ส่งใบสมัครในคลิกเดียว', desc: 'สมัครงานได้อย่างง่ายดาย' },
];

function ComingSoon() {
  return (
    <div style={{ backgroundColor: C.bg }}>
      <div className="sticky top-0 z-20 header-shell" style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        <div className="flex items-center max-w-lg mx-auto" style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>Job Board</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto flex flex-col" style={{ padding: '20px 20px 36px', gap: 20 }}>
        <div style={{ ...cardStyle, padding: 28, textAlign: 'center' }}>
          <div className="flex items-center justify-center mx-auto" style={{
            width: 72, height: 72, borderRadius: 20,
            backgroundColor: 'rgba(239,94,168,0.10)', marginBottom: 16,
          }}>
            <Briefcase size={32} style={{ color: C.primary }} />
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600, color: C.primary,
            backgroundColor: 'rgba(239,94,168,0.10)',
            borderRadius: 99, padding: '5px 14px',
            display: 'inline-block', marginBottom: 14,
          }}>
            🚀 เร็ว ๆ นี้
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', marginBottom: 10 }}>
            Job Board
          </h2>
          <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.65 }}>
            งานที่คัดสรรมาเฉพาะสำหรับคุณ<br />อิงจากทักษะที่สะสมจาก Mydemy
          </p>
        </div>

        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12 }}>ฟีเจอร์ที่กำลังจะเปิดตัว</p>
          <div className="grid grid-cols-2" style={{ gap: 10 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ ...cardStyle, padding: 16 }}>
                <div className="flex items-center justify-center" style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: f.bg, marginBottom: 12, fontSize: 22,
                }}>
                  {f.emoji}
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4, lineHeight: 1.3 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: C.ink2, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', padding: 16, gap: 14 }}>
          <div className="flex items-center justify-center" style={{
            width: 52, height: 52, borderRadius: 14,
            backgroundColor: 'rgba(16,185,129,0.12)', flexShrink: 0,
          }}>
            <Building2 size={24} style={{ color: '#10B981' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>สำหรับบริษัท</p>
            <p style={{ fontSize: 12, color: C.ink2 }}>ต้องการลงประกาศรับสมัครงาน?</p>
          </div>
          <a href="mailto:contact@mydemy.co" className="active:scale-95 transition-transform" style={{
            fontSize: 13, fontWeight: 700, color: 'white',
            backgroundColor: '#10B981', borderRadius: 10, padding: '9px 16px', flexShrink: 0,
          }}>
            ติดต่อ
          </a>
        </div>

        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, padding: '14px 16px 10px' }}>เตรียมตัวให้พร้อมก่อน</p>
          {[
            { href: '/resume',  emoji: '📄', title: 'สร้าง Resume',    desc: 'อัปเดต Resume ให้พร้อมสมัครงาน' },
            { href: '/explore', emoji: '📚', title: 'เรียนทักษะเพิ่ม', desc: 'ฝึกทักษะที่นายจ้างต้องการ' },
          ].map(({ href, emoji, title, desc }) => (
            <Link key={href} href={href} className="flex items-center active:opacity-70 transition-opacity"
              style={{ gap: 12, padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{title}</p>
                <p style={{ fontSize: 12, color: C.ink2 }}>{desc}</p>
              </div>
              <span style={{ color: C.ink3, fontSize: 20, flexShrink: 0 }}>›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page entry ─────────────────────────────────────────────────────────── */

export default function JobsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checked, setChecked]     = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mdm_user');
      if (raw) {
        const u = JSON.parse(raw);
        setUserEmail(u?.email ?? null);
      }
    } catch {}
    setChecked(true);
  }, []);

  if (!checked) return null;

  const isAdmin = ADMIN_EMAILS.includes(userEmail ?? '');
  return isAdmin ? <AdminJobBoard /> : <ComingSoon />;
}

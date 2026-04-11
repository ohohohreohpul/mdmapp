'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Building2, RefreshCw, Trash2, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { cachedGet } from '@/lib/apiCache';
import { useUser } from '@/contexts/UserContext';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const ADMIN_EMAILS = ['jiranan@mydemy.co'];
const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

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

const LOC_ICON: Record<string, string> = {
  remote: '🌐', hybrid: '🏠', onsite: '🏢', unknown: '📍',
};

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface Job {
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
  description?: string;
  posted_at?: string;
  fetched_at: string;
}

/* ─── Job card ───────────────────────────────────────────────────────────── */

function JobCard({ job, isAdmin, onDelete }: { job: Job; isAdmin: boolean; onDelete: (id: string) => void }) {
  return (
    <div style={{ position: 'relative' }}>
      <Link
        href={`/jobs/${job.id}`}
        className="flex items-center active:opacity-70 transition-opacity"
        style={{ ...cardStyle, padding: '14px 16px', gap: 14, textDecoration: 'none', display: 'flex' }}
      >
        {/* Company avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          backgroundColor: 'rgba(239,94,168,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {job.company_logo
            ? <img src={job.company_logo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>
                {job.company.charAt(0).toUpperCase()}
              </span>
          }
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.3, marginBottom: 3 }}>
            {job.title}
          </p>
          <p style={{ fontSize: 12, color: C.ink2, marginBottom: 6 }}>{job.company}</p>

          {/* Tags */}
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {job.location && (
              <span style={{ fontSize: 11, color: C.ink2, display: 'flex', alignItems: 'center', gap: 3 }}>
                {LOC_ICON[job.location_type ?? 'unknown']} {job.location}
              </span>
            )}
            {job.salary_label && (
              <span style={{
                fontSize: 11, color: '#10B981', fontWeight: 600,
                backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 6, padding: '1px 6px',
              }}>
                {job.salary_label}
              </span>
            )}
            {job.career_path && (
              <span style={{
                fontSize: 11, color: C.primary, fontWeight: 600,
                backgroundColor: 'rgba(239,94,168,0.08)', borderRadius: 6, padding: '1px 6px',
              }}>
                {job.career_path}
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={18} style={{ color: C.ink3, flexShrink: 0 }} />
      </Link>

      {/* Admin delete — floats over card */}
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
          style={{
            position: 'absolute', top: 10, right: 38,
            width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
            backgroundColor: 'rgba(255,59,48,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Trash2 size={13} style={{ color: '#FF3B30' }} />
        </button>
      )}
    </div>
  );
}

/* ─── Admin job board ─────────────────────────────────────────────────────── */

function AdminJobBoard() {
  const [jobs, setJobs]             = useState<Job[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
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
      setSyncResult(d.errors?.length
        ? `เพิ่ม ${d.upserted} งาน (${d.errors.length} error)`
        : `เพิ่ม ${d.upserted} งานสำเร็จ ✓`
      );
      fetchJobs(activeFilter);
    } catch (e: any) {
      setSyncResult(`ข้อผิดพลาด: ${e.message}`);
    } finally { setSyncing(false); }
  };

  const handleDelete = async (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    await fetch(`${API}/api/admin/jobs/${id}`, { method: 'DELETE' });
  };

  return (
    <div style={{ backgroundColor: C.bg }}>
      {/* Glass header */}
      <div className="sticky top-0 z-20 header-shell" style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        <div className="flex items-center max-w-lg mx-auto" style={{ height: 54, paddingLeft: 20, paddingRight: 20, gap: 10 }}>
          <h1 style={{ flex: 1, fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>งาน</h1>
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

        {/* Sync result */}
        {syncResult && (
          <div style={{
            margin: '0 20px 12px',
            backgroundColor: syncResult.includes('ข้อผิดพลาด') ? 'rgba(255,59,48,0.08)' : 'rgba(52,199,89,0.10)',
            border: `1px solid ${syncResult.includes('ข้อผิดพลาด') ? 'rgba(255,59,48,0.2)' : 'rgba(52,199,89,0.2)'}`,
            borderRadius: 12, padding: '10px 14px',
            fontSize: 13, color: syncResult.includes('ข้อผิดพลาด') ? '#FF3B30' : '#34C759', fontWeight: 600,
          }}>
            {syncResult}
          </div>
        )}

        {/* Career filter pills */}
        <div className="flex no-scrollbar" style={{ overflowX: 'auto', paddingLeft: 20, paddingRight: 20, gap: 8, marginBottom: 16 }}>
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
        <div className="flex flex-col" style={{ gap: 10, paddingLeft: 20, paddingRight: 20 }}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skel-shimmer" style={{ ...cardStyle, height: 88 }} />
              ))
            : jobs.length === 0
              ? (
                <div style={{ ...cardStyle, padding: 36, textAlign: 'center' }}>
                  <p style={{ fontSize: 28, marginBottom: 10 }}>🔍</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>ยังไม่มีงาน</p>
                  <p style={{ fontSize: 13, color: C.ink2 }}>กด Sync เพื่อดึงงานจาก LinkedIn และ Seek</p>
                </div>
              )
              : jobs.map(job => (
                  <JobCard key={job.id} job={job} isAdmin onDelete={handleDelete} />
                ))
          }
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>งาน</h1>
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
          <a href="mailto:contact@mydemy.co" style={{
            fontSize: 13, fontWeight: 700, color: 'white',
            backgroundColor: '#10B981', borderRadius: 10, padding: '9px 16px', flexShrink: 0,
            textDecoration: 'none',
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
              style={{ gap: 12, padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.05)', textDecoration: 'none' }}>
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
  const { user, loading } = useUser();
  if (loading) return null;
  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? '');
  return isAdmin ? <AdminJobBoard /> : <ComingSoon />;
}

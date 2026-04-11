'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Building2, MapPin, RefreshCw, ExternalLink, ChevronRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL      = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

const C = {
  primary: '#ef5ea8',
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

const PATHS = [
  { key: '',                   label: 'ทั้งหมด',        color: '#ef5ea8', bg: '#FFF0F7' },
  { key: 'UX Design',          label: 'UX Design',      color: '#6366F1', bg: '#EEF2FF' },
  { key: 'Data Analysis',      label: 'Data',           color: '#10B981', bg: '#ECFDF5' },
  { key: 'Digital Marketing',  label: 'Marketing',      color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'Project Management', label: 'Project Mgmt',   color: '#ef5ea8', bg: '#FFF0F7' },
  { key: 'Learning Designer',  label: 'L&D',            color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'QA Tester',          label: 'QA',             color: '#D946EF', bg: '#FDF4FF' },
];

const LOC_LABEL: Record<string, string> = {
  remote: '🌐 Remote', hybrid: '🏢 Hybrid', onsite: '📍 Onsite', unknown: '📍',
};

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return 'วันนี้';
  if (d === 1) return 'เมื่อวาน';
  if (d < 7)   return `${d} วันที่แล้ว`;
  if (d < 30)  return `${Math.floor(d / 7)} สัปดาห์ที่แล้ว`;
  return `${Math.floor(d / 30)} เดือนที่แล้ว`;
}

// ── Coming-soon screen (non-admin) ───────────────────────────────────────────
const FEATURES = [
  { emoji: '🔍', color: '#3B82F6', bg: '#EFF6FF', title: 'ค้นหางานอัจฉริยะ',      desc: 'ตำแหน่งงานที่ตรงทักษะของคุณ' },
  { emoji: '🔖', color: '#A855F7', bg: '#F3E8FF', title: 'บันทึกงานที่ถูกใจ',     desc: 'เก็บตำแหน่งงานสำหรับภายหลัง' },
  { emoji: '🔔', color: '#F59E0B', bg: '#FEF3C7', title: 'แจ้งเตือนงานใหม่',      desc: 'รับแจ้งเตือนงานที่ตรงกับคุณ' },
  { emoji: '📄', color: '#10B981', bg: '#DCFCE7', title: 'ส่งใบสมัครในคลิกเดียว',  desc: 'สมัครงานได้อย่างง่ายดาย' },
];

function ComingSoon() {
  return (
    <div style={{ backgroundColor: C.bg }}>
      <div className="sticky top-0 z-20 header-shell" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center max-w-lg mx-auto" style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>Job Board</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto flex flex-col" style={{ padding: '20px 20px 36px', gap: 20 }}>
        <div style={{ ...cardStyle, padding: 28, textAlign: 'center' }}>
          <div className="flex items-center justify-center mx-auto" style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(239,94,168,0.10)', marginBottom: 16 }}>
            <Briefcase size={32} style={{ color: C.primary }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.primary, backgroundColor: 'rgba(239,94,168,0.10)', borderRadius: 99, padding: '5px 14px', display: 'inline-block', marginBottom: 14 }}>🚀 เร็วๆ นี้</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', marginBottom: 10 }}>Job Board</h2>
          <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.65 }}>งานที่คัดสรรมาเฉพาะสำหรับคุณ<br />อิงจากทักษะที่สะสมจาก Mydemy</p>
        </div>
        <div className="grid grid-cols-2" style={{ gap: 10 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ ...cardStyle, padding: 16 }}>
              <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: f.bg, marginBottom: 12, fontSize: 22 }}>{f.emoji}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4, lineHeight: 1.3 }}>{f.title}</p>
              <p style={{ fontSize: 12, color: C.ink2, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', padding: 16, gap: 14 }}>
          <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.12)', flexShrink: 0 }}>
            <Building2 size={24} style={{ color: '#10B981' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>สำหรับบริษัท</p>
            <p style={{ fontSize: 12, color: C.ink2 }}>ต้องการลงประกาศรับสมัครงาน?</p>
          </div>
          <a href="mailto:contact@mydemy.co" style={{ fontSize: 13, fontWeight: 700, color: 'white', backgroundColor: '#10B981', borderRadius: 10, padding: '9px 16px', flexShrink: 0 }}>ติดต่อ</a>
        </div>
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, padding: '14px 16px 10px' }}>เตรียมตัวให้พร้อมก่อน</p>
          {[
            { href: '/resume',  emoji: '📄', title: 'สร้าง Resume',    desc: 'อัปเดต Resume ให้พร้อมสมัครงาน' },
            { href: '/explore', emoji: '📚', title: 'เรียนทักษะเพิ่ม', desc: 'ฝึกทักษะที่นายจ้างต้องการ' },
          ].map(({ href, emoji, title, desc }) => (
            <Link key={href} href={href} className="flex items-center active:opacity-70 transition-opacity" style={{ gap: 12, padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{title}</p>
                <p style={{ fontSize: 12, color: C.ink2 }}>{desc}</p>
              </div>
              <ChevronRight size={17} style={{ color: C.ink3, flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Job card ─────────────────────────────────────────────────────────────────
function JobCard({ job, isAdmin, onDelete }: { job: any; isAdmin: boolean; onDelete: (id: string) => void }) {
  const path  = PATHS.find(p => p.key === job.career_path);
  const color = path?.color ?? C.primary;
  const bg    = path?.bg    ?? 'rgba(239,94,168,0.08)';

  return (
    <div style={{ ...cardStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Company logo / fallback */}
        <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden' }}>
          {job.company_logo
            ? <img src={job.company_logo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <Building2 size={20} style={{ color }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="line-clamp-2" style={{ fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.35, marginBottom: 2 }}>{job.title}</p>
          <p style={{ fontSize: 12, color: C.ink2 }}>{job.company}</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => onDelete(job.id)}
            style={{ padding: 6, borderRadius: 8, border: 'none', backgroundColor: 'rgba(255,59,48,0.08)', cursor: 'pointer', flexShrink: 0 }}
          >
            <Trash2 size={14} style={{ color: '#FF3B30' }} />
          </button>
        )}
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {job.career_path && (
          <span style={{ fontSize: 11, fontWeight: 600, color, backgroundColor: bg, borderRadius: 99, padding: '3px 9px' }}>
            {job.career_path}
          </span>
        )}
        {job.location_type && job.location_type !== 'unknown' && (
          <span style={{ fontSize: 11, color: C.ink2, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 99, padding: '3px 9px' }}>
            {LOC_LABEL[job.location_type]}
          </span>
        )}
        {job.location && (
          <span style={{ fontSize: 11, color: C.ink2, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 99, padding: '3px 9px', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={10} /> {job.location.split(',')[0]}
          </span>
        )}
        {job.salary_label && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 99, padding: '3px 9px' }}>
            💰 {job.salary_label}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: C.ink3 }}>{timeAgo(job.posted_at || job.fetched_at)}</span>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: C.primary, backgroundColor: 'rgba(239,94,168,0.08)', borderRadius: 10, padding: '7px 12px', textDecoration: 'none' }}
        >
          <ExternalLink size={13} /> สมัครงาน
        </a>
      </div>
    </div>
  );
}

// ── Main page (admin) ─────────────────────────────────────────────────────────
export default function JobsPage() {
  const { user } = useUser();
  const isAdmin  = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  const [jobs, setJobs]               = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [syncMsg, setSyncMsg]         = useState('');
  const [selectedPath, setSelectedPath] = useState('');

  // Non-admin sees coming-soon page
  if (!isAdmin) return <ComingSoon />;

  useEffect(() => { loadJobs(); }, [selectedPath]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (selectedPath) params.career_path = selectedPath;
      const res = await axios.get(`${API_URL}/api/jobs`, { params });
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch { setJobs([]); }
    finally { setLoading(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await axios.post(`${API_URL}/api/admin/jobs/sync`);
      setSyncMsg(`✅ Synced ${res.data.synced} jobs${res.data.errors?.length ? ` (${res.data.errors.length} errors)` : ''}`);
      await loadJobs();
    } catch (e: any) {
      setSyncMsg(`❌ ${e?.response?.data?.detail || e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    await axios.delete(`${API_URL}/api/admin/jobs/${id}`).catch(() => {});
  };

  const activeJobs = selectedPath ? jobs.filter(j => j.career_path === selectedPath) : jobs;

  return (
    <div style={{ backgroundColor: C.bg }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 header-shell" style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-between max-w-lg mx-auto" style={{ height: 54, paddingLeft: 20, paddingRight: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>Job Board</h1>
            <p style={{ fontSize: 11, color: C.primary, fontWeight: 600 }}>Admin Preview</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: syncing ? C.ink3 : C.primary, backgroundColor: syncing ? 'rgba(0,0,0,0.05)' : 'rgba(239,94,168,0.10)', borderRadius: 20, padding: '8px 14px', border: 'none', cursor: syncing ? 'default' : 'pointer' }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing…' : 'Sync Jobs'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto flex flex-col" style={{ padding: '16px 20px 0', gap: 16 }}>

        {/* Sync feedback */}
        {syncMsg && (
          <p style={{ fontSize: 13, fontWeight: 600, color: syncMsg.startsWith('✅') ? '#34C759' : '#FF3B30', textAlign: 'center', padding: '8px 0' }}>
            {syncMsg}
          </p>
        )}

        {/* Career path filter pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
          {PATHS.map(p => {
            const active = selectedPath === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setSelectedPath(p.key)}
                style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', backgroundColor: active ? p.color : 'rgba(0,0,0,0.06)', color: active ? '#fff' : C.ink2, transition: 'all 0.15s' }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Stats bar */}
        {!loading && (
          <p style={{ fontSize: 13, color: C.ink2, fontWeight: 500 }}>
            {activeJobs.length} ตำแหน่งงาน{selectedPath ? ` · ${selectedPath}` : ' · ทุก career path'}
          </p>
        )}

        {/* Job list */}
        <div style={{ paddingBottom: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ height: 14, width: '65%', borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.06)' }} />
                    <div style={{ height: 11, width: '40%', borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.04)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : activeJobs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(239,94,168,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={28} style={{ color: C.primary }} />
              </div>
              <p style={{ fontSize: 15, color: C.ink2, fontWeight: 500 }}>ยังไม่มีงาน</p>
              <p style={{ fontSize: 13, color: C.ink3 }}>กด Sync Jobs เพื่อดึงงานจาก LinkedIn</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeJobs.map(job => (
                <JobCard key={job.id} job={job} isAdmin={isAdmin} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

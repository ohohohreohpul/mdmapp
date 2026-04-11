'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ExternalLink, MapPin, Banknote, Briefcase, Trash2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const ADMIN_EMAILS = ['jiranan@mydemy.co'];
const API = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const C = {
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
  primary: '#ef5ea8',
};

const LOC_LABEL: Record<string, string> = {
  remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site', unknown: '',
};
const LOC_COLOR: Record<string, { bg: string; color: string }> = {
  remote:  { bg: '#EFF6FF', color: '#1D4ED8' },
  hybrid:  { bg: '#FFF7ED', color: '#C2410C' },
  onsite:  { bg: '#F0FDF4', color: '#15803D' },
  unknown: { bg: '#F3F4F6', color: '#6B7280' },
};

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
  description?: string;
  posted_at?: string;
}

export default function JobDetailPage() {
  const router   = useRouter();
  const pathname = usePathname();
  const id       = pathname.split('/').filter(Boolean).pop() || '';
  const { user } = useUser();

  const [job, setJob]         = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleted, setDeleted] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? '');

  useEffect(() => {
    if (!id || id === '_') return;
    fetch(`${API}/api/jobs/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setJob(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!job) return;
    await fetch(`${API}/api/admin/jobs/${job.id}`, { method: 'DELETE' });
    setDeleted(true);
    setTimeout(() => router.back(), 800);
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div style={{ backgroundColor: C.bg, minHeight: '100vh' }}>
        <header className="sticky top-0 z-20 header-shell" style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}>
          <div className="flex items-center max-w-lg mx-auto" style={{ height: 54, paddingLeft: 16, paddingRight: 16, gap: 8 }}>
            <button onClick={() => router.back()} style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeft size={22} style={{ color: C.primary }} />
            </button>
            <div className="skel-shimmer" style={{ flex: 1, height: 18, borderRadius: 6 }} />
          </div>
        </header>
        <div className="max-w-lg mx-auto" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skel-shimmer" style={{ height: 120, borderRadius: 16 }} />
          <div className="skel-shimmer" style={{ height: 48, borderRadius: 12 }} />
          <div className="skel-shimmer" style={{ height: 200, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!job) {
    return (
      <div style={{ backgroundColor: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ fontSize: 40 }}>🔍</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>ไม่พบงานนี้</p>
        <button onClick={() => router.back()} style={{ fontSize: 14, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          ← กลับ
        </button>
      </div>
    );
  }

  const locType = job.location_type ?? 'unknown';
  const locStyle = LOC_COLOR[locType] ?? LOC_COLOR.unknown;

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', paddingBottom: 80 }}>

      {/* Glass header */}
      <header className="sticky top-0 z-20 header-shell" style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        <div className="flex items-center max-w-lg mx-auto" style={{ height: 54, paddingLeft: 16, paddingRight: 16, gap: 8 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <ArrowLeft size={22} style={{ color: C.primary }} />
          </button>
          <h1 className="truncate" style={{ flex: 1, fontSize: 17, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em' }}>
            {job.title}
          </h1>
          {isAdmin && (
            <button
              onClick={handleDelete}
              style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Trash2 size={18} style={{ color: deleted ? C.ink3 : '#FF3B30' }} />
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto" style={{ padding: '20px 20px 0' }}>

        {/* Hero card */}
        <div style={{
          backgroundColor: C.surface, borderRadius: 20,
          padding: 20, marginBottom: 12,
          boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div className="flex items-center" style={{ gap: 16, marginBottom: 16 }}>
            {/* Big logo */}
            <div style={{
              width: 64, height: 64, borderRadius: 18, flexShrink: 0,
              backgroundColor: 'rgba(239,94,168,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {job.company_logo
                ? <img src={job.company_logo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 28, fontWeight: 700, color: C.primary }}>
                    {job.company.charAt(0).toUpperCase()}
                  </span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.3, marginBottom: 4 }}>
                {job.title}
              </h2>
              <p style={{ fontSize: 14, color: C.ink2 }}>{job.company}</p>
            </div>
          </div>

          {/* Tag pills */}
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {job.location && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: C.ink2,
                backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <MapPin size={11} /> {job.location}
              </span>
            )}
            {locType !== 'unknown' && LOC_LABEL[locType] && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: locStyle.color, backgroundColor: locStyle.bg,
                borderRadius: 8, padding: '5px 10px',
              }}>
                {LOC_LABEL[locType]}
              </span>
            )}
            {job.salary_label && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#15803D',
                backgroundColor: '#F0FDF4', borderRadius: 8, padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Banknote size={12} /> {job.salary_label}
              </span>
            )}
            {job.career_path && (
              <span style={{
                fontSize: 12, fontWeight: 600, color: C.primary,
                backgroundColor: 'rgba(239,94,168,0.08)', borderRadius: 8, padding: '5px 10px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Briefcase size={11} /> {job.career_path}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div style={{
            backgroundColor: C.surface, borderRadius: 20,
            padding: 20, marginBottom: 12,
            boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.ink2, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              รายละเอียดงาน
            </p>
            <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {job.description}
            </p>
          </div>
        )}

      </div>

      {/* Sticky Apply CTA — sits above tab bar (tab bar is z-50, this is z-40 but rendered inside main scroll area via fixed) */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'linear-gradient(to top, rgba(242,242,247,1) 60%, rgba(242,242,247,0))',
        /* bottom padding = tab bar height (96px) + safe area + 12px gap */
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 108px)',
        paddingTop: 20, paddingLeft: 20, paddingRight: 20,
        pointerEvents: 'none',
      }}>
        <div className="max-w-lg mx-auto" style={{ pointerEvents: 'auto' }}>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center"
            style={{
              gap: 8, backgroundColor: C.primary, color: '#fff',
              borderRadius: 16, padding: '16px 24px',
              fontSize: 16, fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(239,94,168,0.40)',
            }}
          >
            <ExternalLink size={18} />
            สมัครงานนี้
          </a>
        </div>
      </div>
    </div>
  );
}

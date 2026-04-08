'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, Loader2, FileText, Ribbon } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const C = {
  brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC',
  bg: '#F2F2F7', surface: '#FFFFFF', sep: 'rgba(0,0,0,0.08)',
};

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ marginTop: 20, marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>{title}</p>
      <div style={{ height: 1.5, backgroundColor: '#E5E7EB' }} />
    </div>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <span style={{ backgroundColor: '#F3F4F6', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#374151', margin: 3, display: 'inline-block' }}>
      {label}
    </span>
  );
}

function AtsBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 70 ? 'ดีมาก' : score >= 40 ? 'พอใช้' : 'ควรปรับปรุง';
  return (
    <div style={{ width: 56, height: 56, borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color }}>{score}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color }}>{label}</span>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  backgroundColor: C.surface, borderBottom: `1px solid ${C.sep}`,
  position: 'sticky', top: 0, zIndex: 10,
  paddingTop: 'env(safe-area-inset-top, 0px)',
};

const navBtn: React.CSSProperties = {
  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
};

export default function ResumePreviewPage() {
  const router = useRouter();
  const { user } = useUser();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user?._id) { setLoading(false); return; }
    axios.get(`${API_URL}/api/resume/${user._id}`)
      .then(r => setResume(r.data || null))
      .catch(() => setResume(null))
      .finally(() => setLoading(false));
  }, [user?._id]);

  const handleExportPDF = () => {
    if (!resume || !user?._id) return;
    setExporting(true);
    const url = `${API_URL}/api/resume/${user._id}/export-pdf`;
    const a = document.createElement('a');
    a.href = url; a.download = 'resume.pdf'; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => setExporting(false), 1500);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color={C.brand} className="animate-spin" />
      </div>
    );
  }

  if (!resume || resume.resume_type !== 'created') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
        <header style={headerStyle}>
          <div style={{ maxWidth: 512, margin: '0 auto', padding: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => router.back()} style={navBtn}><ChevronLeft size={22} color={C.ink} /></button>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: 0 }}>Resume</h1>
            <div style={{ width: 40 }} />
          </div>
        </header>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 24px', textAlign: 'center' }}>
          <FileText size={52} color={C.ink3} />
          <p style={{ fontSize: 16, fontWeight: 600, color: C.ink2, margin: 0 }}>ไม่พบ Resume</p>
          <button onClick={() => router.push('/resume-setup')}
            style={{ backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '12px 24px', borderRadius: 16, border: 'none', cursor: 'pointer' }}>
            สร้าง Resume
          </button>
        </div>
      </div>
    );
  }

  const data = resume.resume_data || {};
  const skills: string[] = data.skills || [];
  const workExp: any[] = data.work_experience || [];
  const education: any[] = data.education || [];
  const languages: any[] = data.languages || [];
  const certifications: any[] = data.certifications || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      <header style={headerStyle}>
        <div style={{ maxWidth: 512, margin: '0 auto', padding: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.back()} style={navBtn}><ChevronLeft size={22} color={C.ink} /></button>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: 0 }}>Resume</h1>
          <button onClick={handleExportPDF} disabled={exporting}
            style={{ ...navBtn, opacity: exporting ? 0.5 : 1 }}>
            {exporting ? <Loader2 size={20} color={C.brand} className="animate-spin" /> : <Download size={20} color={C.brand} />}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '16px 16px 64px' }}>
        {/* Paper card */}
        <div style={{ backgroundColor: C.surface, borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          {/* Name & contact */}
          <p style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {data.full_name || user?.display_name || user?.username}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
            {data.email && (
              <span style={{ fontSize: 12, color: C.ink2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>✉️</span>{data.email}
              </span>
            )}
            {data.phone && (
              <span style={{ fontSize: 12, color: C.ink2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>📞</span>{data.phone}
              </span>
            )}
            {data.linkedin && (
              <a
                href={data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#0A66C2', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>🔗</span>LinkedIn
              </a>
            )}
          </div>

          {skills.length > 0 && (
            <>
              <SectionDivider title="ทักษะ" />
              <div style={{ margin: '-3px' }}>
                {skills.map((sk, i) => <SkillChip key={i} label={sk} />)}
              </div>
            </>
          )}

          {workExp.length > 0 && (
            <>
              <SectionDivider title="ประสบการณ์ทำงาน" />
              {workExp.map((job: any, i: number) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{job.role}</p>
                      <p style={{ fontSize: 13, color: C.ink2, margin: 0 }}>{job.company}</p>
                    </div>
                    <p style={{ fontSize: 12, color: C.ink3, flexShrink: 0, margin: 0 }}>
                      {[job.start_date, job.end_date].filter(Boolean).join(' – ')}
                    </p>
                  </div>
                  {Array.isArray(job.bullets) && job.bullets.map((b: string, bi: number) => (
                    <div key={bi} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 13, color: C.ink2 }}>•</span>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: '20px', margin: 0 }}>{b}</p>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {education.length > 0 && (
            <>
              <SectionDivider title="การศึกษา" />
              {education.map((edu: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>
                      {edu.degree}{edu.field ? `, ${edu.field}` : ''}
                    </p>
                    <p style={{ fontSize: 13, color: C.ink2, margin: 0 }}>{edu.institution}</p>
                  </div>
                  {edu.graduation_year && (
                    <p style={{ fontSize: 12, color: C.ink3, flexShrink: 0, margin: 0 }}>{edu.graduation_year}</p>
                  )}
                </div>
              ))}
            </>
          )}

          {languages.length > 0 && (
            <>
              <SectionDivider title="ภาษา" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {languages.map((lang: any, i: number) => (
                  <div key={i} style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', minWidth: 140 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{lang.language}</p>
                    <p style={{ fontSize: 12, color: C.ink2, margin: '2px 0 0' }}>{lang.level}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {certifications.length > 0 && (
            <>
              <SectionDivider title="ใบประกาศนียบัตร" />
              {certifications.map((cert: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < certifications.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    {cert.is_mydemy && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,94,168,0.10)', color: C.brand, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, marginBottom: 4 }}>
                        <Ribbon size={10} /> Mydemy
                      </span>
                    )}
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{cert.name}</p>
                    <p style={{ fontSize: 12, color: C.ink2, margin: '2px 0 0' }}>
                      {cert.issuer}{cert.year ? ` · ${cert.year}` : ''}
                    </p>
                  </div>
                  {cert.url && (
                    <a href={cert.url} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#3B82F6', marginLeft: 8, marginTop: 4 }}>
                      🔗
                    </a>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {resume.ats_score != null && resume.ats_score < 60 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 13, color: '#92400E', lineHeight: '20px', margin: 0 }}>
              เพิ่มคะแนน ATS ด้วยการเพิ่มทักษะ, ประสบการณ์ทำงาน, ใบประกาศ หรือภาษา
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

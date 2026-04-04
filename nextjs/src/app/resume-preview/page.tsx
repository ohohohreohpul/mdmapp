'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, Loader2, FileText, Ribbon } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="mt-5 mb-3">
      <p className="text-[11px] font-extrabold text-[#374151] tracking-widest uppercase mb-1.5">{title}</p>
      <div className="h-[1.5px] bg-[#E5E7EB]" />
    </div>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <span className="bg-[#F3F4F6] rounded-md px-2.5 py-1 text-[12px] font-semibold text-[#374151] m-[3px]">
      {label}
    </span>
  );
}

function AtsBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 70 ? 'ดีมาก' : score >= 40 ? 'พอใช้' : 'ควรปรับปรุง';
  return (
    <div
      className="w-14 h-14 rounded-full border-[3px] flex flex-col items-center justify-center shrink-0"
      style={{ borderColor: color }}
    >
      <span className="text-[18px] font-extrabold leading-none" style={{ color }}>{score}</span>
      <span className="text-[9px] font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

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
    a.href = url;
    a.download = 'resume.pdf';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setExporting(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  if (!resume || resume.resume_type !== 'created') {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <header className="bg-surface border-b border-rim sticky top-0 z-10 header-shell">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg transition-colors">
              <ChevronLeft size={22} className="text-ink" />
            </button>
            <h1 className="text-[17px] font-bold text-ink">Resume</h1>
            <div className="w-10" />
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <FileText size={52} className="text-ink-3" />
          <p className="text-[16px] font-semibold text-ink-2">ไม่พบ Resume</p>
          <button onClick={() => router.push('/resume-setup')} className="bg-brand text-white font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity">
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
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Toolbar */}
      <header className="bg-surface border-b border-rim sticky top-0 z-10 header-shell">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg transition-colors">
            <ChevronLeft size={22} className="text-ink" />
          </button>
          <h1 className="text-[17px] font-bold text-ink">Resume</h1>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 size={20} className="animate-spin text-brand" /> : <Download size={20} className="text-brand" />}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 pb-16">
        {/* Paper card */}
        <div className="bg-surface rounded-2xl p-6 shadow-md">
          {/* Name & contact */}
          <p className="text-[24px] font-extrabold text-[#111827] mb-2 tracking-tight">
            {data.full_name || user?.display_name || user?.username}
          </p>
          <div className="flex flex-wrap gap-3 mb-1">
            {data.email && (
              <span className="text-[12px] text-ink-2 flex items-center gap-1">
                <span>✉️</span>{data.email}
              </span>
            )}
            {data.phone && (
              <span className="text-[12px] text-ink-2 flex items-center gap-1">
                <span>📞</span>{data.phone}
              </span>
            )}
            {data.linkedin && (
              <a
                href={data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[#0A66C2] flex items-center gap-1"
              >
                <span>🔗</span>LinkedIn
              </a>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <>
              <SectionDivider title="ทักษะ" />
              <div className="flex flex-wrap -mx-[3px]">
                {skills.map((sk, i) => <SkillChip key={i} label={sk} />)}
              </div>
            </>
          )}

          {/* Work Experience */}
          {workExp.length > 0 && (
            <>
              <SectionDivider title="ประสบการณ์ทำงาน" />
              {workExp.map((job: any, i: number) => (
                <div key={i} className="mb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-bold text-[#111827]">{job.role}</p>
                      <p className="text-[13px] text-ink-2">{job.company}</p>
                    </div>
                    <p className="text-[12px] text-ink-3 shrink-0">
                      {[job.start_date, job.end_date].filter(Boolean).join(' – ')}
                    </p>
                  </div>
                  {Array.isArray(job.bullets) && job.bullets.map((b: string, bi: number) => (
                    <div key={bi} className="flex gap-2 mt-1">
                      <span className="text-[13px] text-ink-2">•</span>
                      <p className="text-[13px] text-[#374151] leading-5">{b}</p>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* Education */}
          {education.length > 0 && (
            <>
              <SectionDivider title="การศึกษา" />
              {education.map((edu: any, i: number) => (
                <div key={i} className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-[14px] font-bold text-[#111827]">
                      {edu.degree}{edu.field ? `, ${edu.field}` : ''}
                    </p>
                    <p className="text-[13px] text-ink-2">{edu.institution}</p>
                  </div>
                  {edu.graduation_year && (
                    <p className="text-[12px] text-ink-3 shrink-0">{edu.graduation_year}</p>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <>
              <SectionDivider title="ภาษา" />
              <div className="flex flex-wrap gap-2">
                {languages.map((lang: any, i: number) => (
                  <div key={i} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 min-w-[140px]">
                    <p className="text-[13px] font-bold text-[#111827]">{lang.language}</p>
                    <p className="text-[12px] text-ink-2 mt-0.5">{lang.level}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <>
              <SectionDivider title="ใบประกาศนียบัตร" />
              {certifications.map((cert: any, i: number) => (
                <div key={i} className="flex items-start justify-between py-2 border-b border-[#F3F4F6] last:border-0">
                  <div className="flex-1">
                    {cert.is_mydemy && (
                      <span className="inline-flex items-center gap-1 bg-brand/10 text-brand text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                        <Ribbon size={10} /> Mydemy
                      </span>
                    )}
                    <p className="text-[13px] font-bold text-[#111827]">{cert.name}</p>
                    <p className="text-[12px] text-ink-2 mt-0.5">
                      {cert.issuer}{cert.year ? ` · ${cert.year}` : ''}
                    </p>
                  </div>
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3B82F6] hover:opacity-70 transition-opacity ml-2 mt-1"
                    >
                      🔗
                    </a>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* ATS tip */}
        {resume.ats_score != null && resume.ats_score < 60 && (
          <div className="flex items-start gap-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 mt-3">
            <span className="text-lg shrink-0">💡</span>
            <p className="text-[13px] text-[#92400E] leading-5">
              เพิ่มคะแนน ATS ด้วยการเพิ่มทักษะ, ประสบการณ์ทำงาน, ใบประกาศ หรือภาษา
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

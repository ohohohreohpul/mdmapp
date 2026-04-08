'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, PenLine, Trash2, Copy, Plus, Edit2, Info, ExternalLink, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { NavHeader } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF', red: '#EF4444' };
const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};
const btnBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  backgroundColor: C.bg, border: '1px solid rgba(0,0,0,0.08)', color: C.ink,
};

function AtsScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : C.red;
  const label = score >= 70 ? 'ดีมาก' : score >= 40 ? 'พอใช้' : 'ควรปรับปรุง';
  return (
    <div style={{ width: 72, height: 72, borderRadius: 36, border: `4px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color }}>{score}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

export default function ResumePage() {
  const { user } = useUser();
  const [resume, setResume]           = useState<any>(null);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [loadingResume, setLoadingResume] = useState(true);
  const [loadingCL, setLoadingCL]     = useState(true);
  const [deletingResume, setDeletingResume] = useState(false);
  const [deletingCLId, setDeletingCLId]     = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const [clOpen, setClOpen]         = useState(false);
  const [editingCL, setEditingCL]   = useState<any | null>(null);
  const [clTitle, setClTitle]       = useState('');
  const [clCompany, setClCompany]   = useState('');
  const [clPosition, setClPosition] = useState('');
  const [clContent, setClContent]   = useState('');
  const [savingCL, setSavingCL]     = useState(false);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    setLoadingResume(true);
    axios.get(`${API_URL}/api/resume/${user._id}`)
      .then(r => setResume(r.data || null)).catch(() => setResume(null))
      .finally(() => setLoadingResume(false));
    setLoadingCL(true);
    axios.get(`${API_URL}/api/cover-letters/${user._id}`)
      .then(r => setCoverLetters(r.data || [])).catch(() => setCoverLetters([]))
      .finally(() => setLoadingCL(false));
  }, [user?._id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteResume = async () => {
    if (!resume) return;
    if (!deletingResume) { setDeletingResume(true); setTimeout(() => setDeletingResume(false), 3000); return; }
    try { await axios.delete(`${API_URL}/api/resume/${resume._id || resume.id}`); setResume(null); setDeletingResume(false); }
    catch { toast.error('ลบไม่สำเร็จ'); }
  };

  const openNewCL  = () => { setEditingCL(null); setClTitle(''); setClCompany(''); setClPosition(''); setClContent(''); setClOpen(true); };
  const openEditCL = (cl: any) => { setEditingCL(cl); setClTitle(cl.title || ''); setClCompany(cl.company_name || ''); setClPosition(cl.position || ''); setClContent(cl.content || ''); setClOpen(true); };

  const handleSaveCL = async () => {
    if (!clTitle.trim())   { toast.error('กรุณาใส่ชื่อ Cover Letter'); return; }
    if (!clContent.trim()) { toast.error('กรุณาใส่เนื้อหา Cover Letter'); return; }
    if (!user?._id) return;
    setSavingCL(true);
    try {
      const data = { title: clTitle.trim(), company_name: clCompany.trim(), position: clPosition.trim(), content: clContent.trim() };
      if (editingCL) {
        const clId = editingCL._id || editingCL.id;
        const r = await axios.put(`${API_URL}/api/cover-letters/${clId}`, data);
        setCoverLetters(prev => prev.map(c => (c._id || c.id) === clId ? { ...r.data, _id: clId } : c));
      } else {
        const r = await axios.post(`${API_URL}/api/cover-letters`, { user_id: user._id, ...data });
        setCoverLetters(prev => [r.data, ...prev]);
      }
      setClOpen(false);
    } catch { toast.error('บันทึกไม่สำเร็จ'); }
    finally   { setSavingCL(false); }
  };

  const handleDeleteCL = async (cl: any) => {
    const clId = cl._id || cl.id;
    if (deletingCLId !== clId) { setDeletingCLId(clId); setTimeout(() => setDeletingCLId(null), 3000); return; }
    try { await axios.delete(`${API_URL}/api/cover-letters/${clId}`); setCoverLetters(prev => prev.filter(c => (c._id || c.id) !== clId)); setDeletingCLId(null); }
    catch { toast.error('ลบไม่สำเร็จ'); }
  };

  const handleCopyCL = async (cl: any) => {
    try { await navigator.clipboard.writeText(cl.content); toast.success('คัดลอกแล้ว'); }
    catch { toast.error('ไม่สามารถคัดลอกได้'); }
  };

  const formatDate = (iso: string) => {
    try { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`; }
    catch { return '-'; }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <NavHeader title="Resume & Career" />

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '20px 20px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Resume ── */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 4, marginBottom: 8 }}>Resume</p>

          {loadingResume ? (
            <div style={{ ...card, padding: 32, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={24} color={C.brand} className="animate-spin" />
            </div>
          ) : resume ? (
            <div style={{ ...card, padding: 16 }}>
              {/* Type badge + ATS score */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, color: '#fff', backgroundColor: resume.resume_type === 'uploaded' ? '#3B82F6' : C.brand }}>
                  {resume.resume_type === 'uploaded' ? '☁️ อัปโหลด PDF' : '✏️ สร้างจาก Template'}
                </span>
                {resume.ats_score != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AtsScoreRing score={resume.ats_score} />
                    <button onClick={() => setShowTooltip(v => !v)} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: C.ink3, display: 'flex' }}>
                      <Info size={16} />
                    </button>
                  </div>
                )}
              </div>

              {showTooltip && (
                <p style={{ fontSize: 12, color: C.ink2, backgroundColor: C.bg, borderRadius: 12, padding: 12, marginBottom: 12, lineHeight: 1.6 }}>
                  คะแนน ATS บอกว่า Resume ของคุณอ่านง่ายสำหรับระบบคัดกรอง ยิ่งสูงยิ่งมีโอกาสผ่านการคัดกรองเบื้องต้น
                </p>
              )}

              <p style={{ fontWeight: 600, color: C.ink, fontSize: 14, marginBottom: 2 }}>{resume.file_name || 'Resume ของฉัน'}</p>
              <p style={{ fontSize: 12, color: C.ink2, marginBottom: 10 }}>
                {formatDate(resume.created_at)}{resume.file_size ? ` · ${formatSize(resume.file_size)}` : ''}
              </p>

              {resume.parsed_skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {resume.parsed_skills.slice(0, 8).map((s: string) => (
                    <span key={s} style={{ backgroundColor: 'rgba(239,94,168,0.10)', color: C.brand, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>{s}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {resume.file_url && (
                  <a href={resume.file_url} target="_blank" rel="noopener noreferrer" style={{ ...btnBase, flex: 1, textDecoration: 'none' }}>
                    <ExternalLink size={14} /> ดู PDF
                  </a>
                )}
                <Link href="/resume-setup" style={{ ...btnBase, flex: 1, textDecoration: 'none' }}>
                  <Edit2 size={14} /> แก้ไข
                </Link>
                <button onClick={handleDeleteResume} style={{ ...btnBase, paddingLeft: 12, paddingRight: 12, flex: 'none', backgroundColor: deletingResume ? C.red : C.bg, color: deletingResume ? '#fff' : C.red, border: deletingResume ? 'none' : '1px solid rgba(239,68,68,0.20)' }}>
                  <Trash2 size={14} />
                  {deletingResume && <span style={{ fontSize: 12 }}>กดอีกครั้งเพื่อลบ</span>}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239,94,168,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={28} color={C.brand} />
              </div>
              <p style={{ fontWeight: 700, color: C.ink }}>ยังไม่มี Resume</p>
              <p style={{ fontSize: 14, color: C.ink2 }}>สร้างหรืออัปโหลด Resume เพื่อเพิ่มโอกาสในการสมัครงาน</p>
              <Link href="/resume-setup" style={{ backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '12px 24px', borderRadius: 14, textDecoration: 'none' }}>
                สร้าง Resume
              </Link>
            </div>
          )}
        </div>

        {/* ── Cover Letters ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4, marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cover Letters</p>
            <button onClick={openNewCL} style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.brand, fontSize: 13, fontWeight: 600, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
              <Plus size={16} /> สร้างใหม่
            </button>
          </div>

          {loadingCL ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <Loader2 size={24} color={C.brand} className="animate-spin" />
            </div>
          ) : coverLetters.length === 0 ? (
            <div style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
              <PenLine size={32} color={C.ink3} />
              <p style={{ fontSize: 14, color: C.ink2 }}>ยังไม่มี Cover Letter</p>
              <button onClick={openNewCL} style={{ color: C.brand, fontSize: 14, fontWeight: 600, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
                + สร้าง Cover Letter แรก
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {coverLetters.map((cl: any) => {
                const clId = cl._id || cl.id;
                return (
                  <div key={clId} style={{ ...card, padding: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{cl.title}</p>
                    {cl.company_name && <p style={{ fontSize: 12, color: C.ink2 }}>{cl.company_name}{cl.position ? ` · ${cl.position}` : ''}</p>}
                    <p style={{ fontSize: 11, color: C.ink3, marginTop: 2, marginBottom: 6 }}>{formatDate(cl.created_at)}</p>
                    <p style={{ fontSize: 12, color: C.ink2, marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cl.content}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEditCL(cl)} style={{ ...btnBase, flex: 1, fontSize: 12, padding: '8px 0' }}>
                        <Edit2 size={13} /> แก้ไข
                      </button>
                      <button onClick={() => handleCopyCL(cl)} style={{ ...btnBase, flex: 1, fontSize: 12, padding: '8px 0' }}>
                        <Copy size={13} /> คัดลอก
                      </button>
                      <button onClick={() => handleDeleteCL(cl)} style={{ ...btnBase, paddingLeft: 10, paddingRight: 10, flex: 'none', fontSize: 12, padding: '8px 10px', backgroundColor: deletingCLId === clId ? C.red : C.bg, color: deletingCLId === clId ? '#fff' : C.red, border: deletingCLId === clId ? 'none' : '1px solid rgba(239,68,68,0.20)' }}>
                        <Trash2 size={13} />
                        {deletingCLId === clId && <span>ยืนยัน</span>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Cover Letter Modal ── */}
      {clOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.50)', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 512, margin: '0 auto', display: 'flex', flexDirection: 'column', maxHeight: '90vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <button onClick={() => setClOpen(false)} style={{ fontSize: 14, color: C.ink2, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>ยกเลิก</button>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{editingCL ? 'แก้ไข Cover Letter' : 'สร้าง Cover Letter'}</h2>
              <button onClick={handleSaveCL} disabled={savingCL} style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.brand, fontWeight: 700, fontSize: 14, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
                {savingCL && <Loader2 size={14} className="animate-spin" />} บันทึก
              </button>
            </div>
            {/* Modal body */}
            <div style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FormField label="ชื่อ Cover Letter *" value={clTitle}    onChange={setClTitle}    placeholder="เช่น Cover Letter — UX Designer" />
              <FormField label="บริษัท"              value={clCompany}  onChange={setClCompany}  placeholder="ชื่อบริษัท" />
              <FormField label="ตำแหน่งที่สมัคร"     value={clPosition} onChange={setClPosition} placeholder="เช่น UX Designer" />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 6 }}>เนื้อหา *</label>
                <textarea
                  value={clContent}
                  onChange={e => setClContent(e.target.value)}
                  placeholder="เขียน Cover Letter ที่นี่..."
                  rows={10}
                  style={{ width: '100%', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 14, padding: '12px 16px', fontSize: 14, color: C.ink, outline: 'none', resize: 'none', backgroundColor: C.bg, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1C1C1E', marginBottom: 6 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 14, padding: '12px 16px', fontSize: 14, color: '#1C1C1E', outline: 'none', backgroundColor: '#F2F2F7', boxSizing: 'border-box' }}
      />
    </div>
  );
}

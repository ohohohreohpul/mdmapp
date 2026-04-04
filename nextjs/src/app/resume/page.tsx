'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, PenLine, Trash2, Copy, Plus, Edit2, Info, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { NavHeader } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

function AtsScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 70 ? 'ดีมาก' : score >= 40 ? 'พอใช้' : 'ควรปรับปรุง';
  return (
    <div className="w-[72px] h-[72px] rounded-full border-4 flex flex-col items-center justify-center" style={{ borderColor: color }}>
      <span className="text-[22px] font-extrabold leading-tight" style={{ color }}>{score}</span>
      <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

export default function ResumePage() {
  const { user } = useUser();
  const [resume, setResume]         = useState<any>(null);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [loadingResume, setLoadingResume] = useState(true);
  const [loadingCL, setLoadingCL]   = useState(true);
  const [deletingResume, setDeletingResume] = useState(false);
  const [deletingCLId, setDeletingCLId]     = useState<string | null>(null);
  const [showTooltip, setShowTooltip]       = useState(false);

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
    <div className="min-h-screen bg-bg">
      <NavHeader title="Resume & Career" />

      <div className="max-w-lg mx-auto px-4 py-5 pb-10 flex flex-col gap-5">
        {/* Resume */}
        <div>
          <p className="text-[12px] font-bold text-ink-3 uppercase tracking-wider px-1 mb-2">Resume</p>
          {loadingResume ? (
            <div className="bg-surface rounded-2xl p-8 flex justify-center card-shadow">
              <Loader2 size={24} className="animate-spin text-brand" />
            </div>
          ) : resume ? (
            <div className="bg-surface rounded-2xl p-4 border border-rim card-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full text-white ${resume.resume_type === 'uploaded' ? 'bg-[#3B82F6]' : 'bg-brand'}`}>
                  {resume.resume_type === 'uploaded' ? '☁️ อัปโหลด PDF' : '✏️ สร้างจาก Template'}
                </span>
                {resume.ats_score != null && (
                  <div className="flex items-center gap-1">
                    <AtsScoreRing score={resume.ats_score} />
                    <button onClick={() => setShowTooltip(v => !v)} className="text-ink-3 hover:text-ink-2">
                      <Info size={16} />
                    </button>
                  </div>
                )}
              </div>
              {showTooltip && (
                <p className="text-[12px] text-ink-2 bg-bg rounded-xl p-3 mb-3 leading-relaxed">
                  คะแนน ATS บอกว่า Resume ของคุณอ่านง่ายสำหรับระบบคัดกรอง ยิ่งสูงยิ่งมีโอกาสผ่านการคัดกรองเบื้องต้น
                </p>
              )}
              <p className="font-semibold text-ink text-[14px] mb-0.5">{resume.file_name || 'Resume ของฉัน'}</p>
              <p className="text-[12px] text-ink-2 mb-3">
                {formatDate(resume.created_at)}{resume.file_size ? ` · ${formatSize(resume.file_size)}` : ''}
              </p>
              {resume.parsed_skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {resume.parsed_skills.slice(0, 8).map((s: string) => (
                    <span key={s} className="bg-brand/10 text-brand text-[11px] font-semibold px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                {resume.file_url && (
                  <a href={resume.file_url} target="_blank" rel="noopener noreferrer"
                     className="flex-1 flex items-center justify-center gap-1.5 bg-bg border border-rim rounded-2xl py-2.5 text-[13px] font-semibold text-ink">
                    <ExternalLink size={15} /> ดู PDF
                  </a>
                )}
                <Link href="/resume-setup"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-bg border border-rim rounded-2xl py-2.5 text-[13px] font-semibold text-ink">
                  <Edit2 size={15} /> แก้ไข
                </Link>
                <button onClick={handleDeleteResume}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-colors ${deletingResume ? 'bg-[#EF4444] text-white' : 'bg-bg border border-rim text-[#EF4444]'}`}>
                  <Trash2 size={15} />
                  {deletingResume ? 'กดอีกครั้งเพื่อลบ' : ''}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl p-6 border border-rim card-shadow flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 bg-brand/10 rounded-full flex items-center justify-center">
                <FileText size={28} className="text-brand" />
              </div>
              <p className="font-bold text-ink">ยังไม่มี Resume</p>
              <p className="text-sm text-ink-2">สร้างหรืออัปโหลด Resume เพื่อเพิ่มโอกาสในการสมัครงาน</p>
              <Link href="/resume-setup" className="bg-brand text-white font-bold px-6 py-3 rounded-2xl">สร้าง Resume</Link>
            </div>
          )}
        </div>

        {/* Cover Letters */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[12px] font-bold text-ink-3 uppercase tracking-wider">Cover Letters</p>
            <button onClick={openNewCL} className="flex items-center gap-1 text-brand text-[13px] font-semibold">
              <Plus size={16} /> สร้างใหม่
            </button>
          </div>
          {loadingCL ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand" /></div>
          ) : coverLetters.length === 0 ? (
            <div className="bg-surface rounded-2xl p-5 border border-rim card-shadow flex flex-col items-center text-center gap-2">
              <PenLine size={32} className="text-ink-3" />
              <p className="text-sm text-ink-2">ยังไม่มี Cover Letter</p>
              <button onClick={openNewCL} className="text-brand text-sm font-semibold">+ สร้าง Cover Letter แรก</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {coverLetters.map((cl: any) => {
                const clId = cl._id || cl.id;
                return (
                  <div key={clId} className="bg-surface rounded-2xl p-4 border border-rim card-shadow">
                    <div className="flex-1 min-w-0 mb-1">
                      <p className="font-bold text-[14px] text-ink truncate">{cl.title}</p>
                      {cl.company_name && <p className="text-[12px] text-ink-2">{cl.company_name}{cl.position ? ` · ${cl.position}` : ''}</p>}
                      <p className="text-[11px] text-ink-3 mt-0.5">{formatDate(cl.created_at)}</p>
                    </div>
                    <p className="text-[12px] text-ink-2 line-clamp-2 mb-3">{cl.content}</p>
                    <div className="flex gap-2">
                      <button onClick={() => openEditCL(cl)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-bg border border-rim rounded-2xl py-2 text-[12px] font-semibold text-ink">
                        <Edit2 size={13} /> แก้ไข
                      </button>
                      <button onClick={() => handleCopyCL(cl)}
                              className="flex-1 flex items-center justify-center gap-1.5 bg-bg border border-rim rounded-2xl py-2 text-[12px] font-semibold text-ink">
                        <Copy size={13} /> คัดลอก
                      </button>
                      <button onClick={() => handleDeleteCL(cl)}
                              className={`flex items-center justify-center gap-1 px-3 py-2 rounded-2xl text-[12px] font-semibold transition-colors ${deletingCLId === clId ? 'bg-[#EF4444] text-white' : 'bg-bg border border-rim text-[#EF4444]'}`}>
                        <Trash2 size={13} />
                        {deletingCLId === clId ? 'ยืนยัน' : ''}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cover letter modal */}
      {clOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end">
          <div className="bg-surface rounded-t-3xl w-full max-w-lg mx-auto flex flex-col"
               style={{ maxHeight: '90vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-rim">
              <button onClick={() => setClOpen(false)} className="text-ink-2 text-sm">ยกเลิก</button>
              <h2 className="text-[17px] font-bold text-ink">{editingCL ? 'แก้ไข Cover Letter' : 'สร้าง Cover Letter'}</h2>
              <button onClick={handleSaveCL} disabled={savingCL} className="text-brand font-bold text-sm flex items-center gap-1">
                {savingCL && <Loader2 size={14} className="animate-spin" />} บันทึก
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex flex-col gap-3">
              <FormField label="ชื่อ Cover Letter *" value={clTitle}   onChange={setClTitle}   placeholder="เช่น Cover Letter — UX Designer" />
              <FormField label="บริษัท"               value={clCompany} onChange={setClCompany} placeholder="ชื่อบริษัท" />
              <FormField label="ตำแหน่งที่สมัคร"      value={clPosition} onChange={setClPosition} placeholder="เช่น UX Designer" />
              <div>
                <label className="block text-[13px] font-semibold text-ink mb-1.5">เนื้อหา *</label>
                <textarea
                  value={clContent}
                  onChange={e => setClContent(e.target.value)}
                  placeholder="เขียน Cover Letter ที่นี่..."
                  rows={10}
                  className="w-full border border-rim rounded-2xl px-4 py-3 text-[14px] text-ink outline-none focus:border-brand transition-colors resize-none bg-bg"
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
      <label className="block text-[13px] font-semibold text-ink mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-rim rounded-2xl px-4 py-3 text-[14px] text-ink outline-none focus:border-brand transition-colors bg-bg placeholder:text-ink-3"
      />
    </div>
  );
}

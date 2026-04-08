'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2, Upload, PenLine, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const C = {
  brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC',
  bg: '#F2F2F7', surface: '#FFFFFF', sep: 'rgba(0,0,0,0.08)',
  red: '#EF4444', blue: '#3B82F6', green: '#10B981',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: C.surface, borderRadius: 16,
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06)',
};

type Step = 'choice' | 'upload' | 'create' | 'done';

const LEVEL_OPTIONS = ['Native', 'Fluent / C1-C2', 'Upper-Intermediate / B2', 'Intermediate / B1', 'Basic / A1-A2'];

const E_WORK = { company: '', role: '', start_date: '', end_date: '', bullets: '' };
const E_EDU  = { institution: '', degree: '', field: '', graduation_year: '' };
const E_LANG = { language: '', level: '' };
const E_CERT = { name: '', issuer: '', year: '', url: '' };

export default function ResumeSetupPage() {
  const router = useRouter();
  const { user, markResumeSetup } = useUser();

  const [step, setStep] = useState<Step>('choice');
  const [loading, setLoading] = useState(false);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [workEntries, setWorkEntries] = useState([{ ...E_WORK }]);
  const [eduEntries, setEduEntries] = useState([{ ...E_EDU }]);
  const [langEntries, setLangEntries] = useState<typeof E_LANG[]>([]);
  const [certEntries, setCertEntries] = useState<typeof E_CERT[]>([]);
  const [existingResumeId, setExistingResumeId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    axios.get(`${API_URL}/api/resume/${user._id}`).then(r => {
      const ex = r.data;
      if (!ex || ex.resume_type !== 'created') return;
      const d = ex.resume_data || {};
      setExistingResumeId(ex._id || ex.id);
      setStep('create');
      setFullName(d.full_name || '');
      setEmail(d.email || user?.email || '');
      setPhone(d.phone || '');
      setLinkedin(d.linkedin || '');
      setSkillsText((d.skills || []).join(', '));
      setWorkEntries(d.work_experience?.length ? d.work_experience.map((w: any) => ({
        company: w.company || '', role: w.role || '', start_date: w.start_date || '',
        end_date: w.end_date || '', bullets: Array.isArray(w.bullets) ? w.bullets.join('\n') : (w.bullets || ''),
      })) : [{ ...E_WORK }]);
      setEduEntries(d.education?.length ? d.education.map((e: any) => ({
        institution: e.institution || '', degree: e.degree || '', field: e.field || '', graduation_year: e.graduation_year || '',
      })) : [{ ...E_EDU }]);
      setLangEntries((d.languages || []).map((l: any) => ({ language: l.language || '', level: l.level || '' })));
      setCertEntries((d.certifications || []).map((c: any) => ({ name: c.name || '', issuer: c.issuer || '', year: c.year || '', url: c.url || '' })));
    }).catch(() => {});
  }, [user?._id]);

  const handleUpload = async () => {
    if (!pickedFile || !user?._id) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', pickedFile);
      form.append('user_id', user._id);
      await axios.post(`${API_URL}/api/resume/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await markResumeSetup(user._id);
      setStep('done');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'อัปโหลดไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user?._id) return;
    if (!fullName.trim()) { toast.error('กรุณากรอกชื่อ'); return; }
    setLoading(true);
    try {
      const payload = {
        user_id: user._id,
        resume_data: {
          full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), linkedin: linkedin.trim(),
          skills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
          work_experience: workEntries.filter(w => w.company || w.role).map(w => ({
            ...w, bullets: w.bullets.split('\n').map(b => b.trim()).filter(Boolean),
          })),
          education: eduEntries.filter(e => e.institution || e.degree),
          languages: langEntries.filter(l => l.language),
          certifications: certEntries.filter(c => c.name),
        },
      };
      if (existingResumeId) {
        await axios.put(`${API_URL}/api/resume/${existingResumeId}`, payload);
      } else {
        await axios.post(`${API_URL}/api/resume/create`, payload);
      }
      await markResumeSetup(user._id);
      setStep('done');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (user?._id) await markResumeSetup(user._id).catch(() => {});
    router.replace('/home');
  };

  // ── Done ──────────────────────────────────────────────────────────
  if (step === 'done') return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', gap: 20 }}>
      <CheckCircle size={80} color={C.green} />
      <h2 style={{ fontSize: 24, fontWeight: 800, color: C.ink, margin: 0 }}>บันทึก Resume แล้ว!</h2>
      <p style={{ color: C.ink2, margin: 0 }}>Resume ของคุณพร้อมใช้งานแล้ว</p>
      <button onClick={() => router.replace('/home')}
        style={{ backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '14px 32px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16 }}>
        ไปหน้าหลัก
      </button>
    </div>
  );

  // ── Choice ────────────────────────────────────────────────────────
  if (step === 'choice') return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <header style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.sep}`, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div style={{ maxWidth: 512, margin: '0 auto', padding: '0 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.back()}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <ArrowLeft size={22} color={C.ink} />
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: 0 }}>สร้าง Resume</h1>
          <button onClick={handleSkip} style={{ fontSize: 14, color: C.ink2, border: 'none', background: 'none', cursor: 'pointer' }}>ข้ามก่อน</button>
        </div>
      </header>

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ textAlign: 'center', color: C.ink2, fontSize: 14, marginBottom: 4 }}>เลือกวิธีสร้าง Resume ของคุณ</p>

        <button onClick={() => setStep('upload')}
          style={{ ...cardStyle, padding: 20, border: `2px solid ${C.sep}`, display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <div style={{ width: 48, height: 48, backgroundColor: 'rgba(59,130,246,0.10)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Upload size={24} color={C.blue} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: C.ink, fontSize: 16, margin: '0 0 4px' }}>อัปโหลด PDF</p>
            <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.5, margin: 0 }}>อัปโหลด Resume ที่มีอยู่แล้ว ระบบจะวิเคราะห์คะแนน ATS ให้</p>
          </div>
        </button>

        <button onClick={() => setStep('create')}
          style={{ ...cardStyle, padding: 20, border: `2px solid ${C.sep}`, display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <div style={{ width: 48, height: 48, backgroundColor: 'rgba(239,94,168,0.10)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PenLine size={24} color={C.brand} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: C.ink, fontSize: 16, margin: '0 0 4px' }}>สร้างจาก Template</p>
            <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.5, margin: 0 }}>กรอกข้อมูลและระบบจะสร้าง Resume ให้อัตโนมัติ</p>
          </div>
        </button>
      </div>
    </div>
  );

  // ── Upload ────────────────────────────────────────────────────────
  if (step === 'upload') return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <header style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.sep}`, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div style={{ maxWidth: 512, margin: '0 auto', padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setStep('choice')}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <ArrowLeft size={22} color={C.ink} />
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: 0 }}>อัปโหลด Resume</h1>
        </div>
      </header>

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ border: `2px dashed ${C.sep}`, borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', backgroundColor: C.surface }}>
          <Upload size={40} color={pickedFile ? C.brand : C.ink3} />
          <p style={{ fontWeight: 600, color: C.ink, margin: 0 }}>{pickedFile ? pickedFile.name : 'เลือกไฟล์ PDF'}</p>
          <p style={{ fontSize: 14, color: C.ink2, margin: 0 }}>รองรับ PDF เท่านั้น ขนาดไม่เกิน 10MB</p>
          <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setPickedFile(e.target.files?.[0] || null)} />
        </label>

        <button onClick={handleUpload} disabled={!pickedFile || loading}
          style={{ backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '16px 0', borderRadius: 16, border: 'none', cursor: pickedFile && !loading ? 'pointer' : 'not-allowed', opacity: !pickedFile || loading ? 0.5 : 1, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading && <Loader2 size={20} className="animate-spin" />}
          {loading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
        </button>
      </div>
    </div>
  );

  // ── Create form ───────────────────────────────────────────────────
  const totalSteps = 4;
  const stepPct = (formStep / totalSteps) * 100;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.sep}`, position: 'sticky', top: 0, zIndex: 10, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div style={{ maxWidth: 512, margin: '0 auto', padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => formStep > 1 ? setFormStep(f => f - 1) : setStep('choice')}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft size={22} color={C.ink} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: C.ink2, margin: '0 0 4px' }}>ขั้นตอน {formStep}/{totalSteps}</p>
            <div style={{ height: 6, backgroundColor: '#E5E5EA', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: C.brand, borderRadius: 999, width: `${stepPct}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: 512, margin: '0 auto', width: '100%', padding: '20px 20px 100px', overflowY: 'auto' }}>

        {formStep === 1 && (
          <FSec title="ข้อมูลส่วนตัว">
            <Field label="ชื่อ-นามสกุล *" value={fullName} onChange={setFullName} placeholder="ชื่อเต็ม" />
            <Field label="อีเมล" value={email} onChange={setEmail} placeholder="email@example.com" type="email" />
            <Field label="เบอร์โทร" value={phone} onChange={setPhone} placeholder="08x-xxx-xxxx" />
            <Field label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/..." />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>ทักษะ (คั่นด้วย comma)</label>
              <textarea value={skillsText} onChange={e => setSkillsText(e.target.value)} rows={3}
                placeholder="Figma, UX Research, Data Analysis..."
                style={{ width: '100%', border: `1px solid ${C.sep}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, color: C.ink, outline: 'none', resize: 'none', backgroundColor: C.surface, boxSizing: 'border-box' }} />
            </div>
          </FSec>
        )}

        {formStep === 2 && (
          <FSec title="ประสบการณ์การทำงาน">
            {workEntries.map((w, i) => (
              <div key={i} style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>ที่ทำงาน {i + 1}</p>
                  {workEntries.length > 1 && (
                    <button onClick={() => setWorkEntries(prev => prev.filter((_, j) => j !== i))}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={16} color={C.red} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Field label="บริษัท" value={w.company} onChange={v => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, company: v } : x))} placeholder="ชื่อบริษัท" />
                  <Field label="ตำแหน่ง" value={w.role} onChange={v => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, role: v } : x))} placeholder="เช่น UX Designer" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Field label="เริ่ม" value={w.start_date} onChange={v => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, start_date: v } : x))} placeholder="01/2023" />
                    <Field label="สิ้นสุด" value={w.end_date} onChange={v => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, end_date: v } : x))} placeholder="ปัจจุบัน" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>สิ่งที่ทำ (แต่ละบรรทัดคือ bullet)</label>
                    <textarea value={w.bullets} onChange={e => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, bullets: e.target.value } : x))}
                      rows={3} placeholder="- ออกแบบ UX สำหรับแอป..."
                      style={{ width: '100%', border: `1px solid ${C.sep}`, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: C.ink, outline: 'none', resize: 'none', backgroundColor: C.surface, boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setWorkEntries(prev => [...prev, { ...E_WORK }])}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.brand, fontSize: 14, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              <Plus size={16} /> เพิ่มที่ทำงาน
            </button>
          </FSec>
        )}

        {formStep === 3 && (
          <FSec title="การศึกษา">
            {eduEntries.map((e, i) => (
              <div key={i} style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: 0 }}>การศึกษา {i + 1}</p>
                  {eduEntries.length > 1 && (
                    <button onClick={() => setEduEntries(prev => prev.filter((_, j) => j !== i))}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={16} color={C.red} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Field label="สถาบัน" value={e.institution} onChange={v => setEduEntries(prev => prev.map((x, j) => j === i ? { ...x, institution: v } : x))} placeholder="ชื่อมหาวิทยาลัย" />
                  <Field label="วุฒิการศึกษา" value={e.degree} onChange={v => setEduEntries(prev => prev.map((x, j) => j === i ? { ...x, degree: v } : x))} placeholder="ปริญญาตรี" />
                  <Field label="สาขา" value={e.field} onChange={v => setEduEntries(prev => prev.map((x, j) => j === i ? { ...x, field: v } : x))} placeholder="Computer Science" />
                  <Field label="ปีจบ" value={e.graduation_year} onChange={v => setEduEntries(prev => prev.map((x, j) => j === i ? { ...x, graduation_year: v } : x))} placeholder="2023" />
                </div>
              </div>
            ))}
            <button onClick={() => setEduEntries(prev => [...prev, { ...E_EDU }])}
              style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.brand, fontSize: 14, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
              <Plus size={16} /> เพิ่มการศึกษา
            </button>
          </FSec>
        )}

        {formStep === 4 && (
          <>
            <FSec title="ภาษา">
              {langEntries.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Field label="ภาษา" value={l.language} onChange={v => setLangEntries(prev => prev.map((x, j) => j === i ? { ...x, language: v } : x))} placeholder="English" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>ระดับ</label>
                    <select value={l.level} onChange={e => setLangEntries(prev => prev.map((x, j) => j === i ? { ...x, level: e.target.value } : x))}
                      style={{ width: '100%', border: `1px solid ${C.sep}`, borderRadius: 12, padding: '10px 12px', fontSize: 13, color: C.ink, outline: 'none', backgroundColor: C.surface }}>
                      <option value="">เลือกระดับ</option>
                      {LEVEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setLangEntries(prev => prev.filter((_, j) => j !== i))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0 4px 10px' }}>
                    <Trash2 size={16} color={C.red} />
                  </button>
                </div>
              ))}
              <button onClick={() => setLangEntries(prev => [...prev, { ...E_LANG }])}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.brand, fontSize: 14, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: 0, marginBottom: 16 }}>
                <Plus size={16} /> เพิ่มภาษา
              </button>
            </FSec>

            <FSec title="ใบรับรอง / Certifications">
              {certEntries.map((c, i) => (
                <div key={i} style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>ใบรับรอง {i + 1}</p>
                    <button onClick={() => setCertEntries(prev => prev.filter((_, j) => j !== i))}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={15} color={C.red} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Field label="ชื่อ" value={c.name} onChange={v => setCertEntries(prev => prev.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="Certificate Name" />
                    <Field label="ผู้ออก" value={c.issuer} onChange={v => setCertEntries(prev => prev.map((x, j) => j === i ? { ...x, issuer: v } : x))} placeholder="Mydemy / Coursera" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <Field label="ปี" value={c.year} onChange={v => setCertEntries(prev => prev.map((x, j) => j === i ? { ...x, year: v } : x))} placeholder="2024" />
                      <Field label="URL" value={c.url} onChange={v => setCertEntries(prev => prev.map((x, j) => j === i ? { ...x, url: v } : x))} placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setCertEntries(prev => [...prev, { ...E_CERT }])}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.brand, fontSize: 14, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                <Plus size={16} /> เพิ่มใบรับรอง
              </button>
            </FSec>
          </>
        )}
      </div>

      {/* Bottom button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTop: `1px solid ${C.sep}`, padding: '12px 20px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
        <div style={{ maxWidth: 512, margin: '0 auto' }}>
          {formStep < totalSteps ? (
            <button onClick={() => setFormStep(f => f + 1)}
              style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16 }}>
              ถัดไป
            </button>
          ) : (
            <button onClick={handleCreate} disabled={loading}
              style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '16px 0', borderRadius: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading && <Loader2 size={20} className="animate-spin" />}
              {loading ? 'กำลังบันทึก...' : 'บันทึก Resume'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: '0 0 16px' }}>{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', border: `1px solid ${C.sep}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, color: C.ink, outline: 'none', backgroundColor: C.surface, boxSizing: 'border-box' }}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2, Upload, PenLine, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

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

  // Upload
  const [pickedFile, setPickedFile] = useState<File | null>(null);

  // Create form — step 1 of 4
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

  // Pre-load existing resume
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

  // Upload handler
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

  // Create handler
  const handleCreate = async () => {
    if (!user?._id) return;
    if (!fullName.trim()) { toast.error('กรุณากรอกชื่อ'); return; }
    setLoading(true);
    try {
      const payload = {
        user_id: user._id,
        resume_data: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          linkedin: linkedin.trim(),
          skills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
          work_experience: workEntries.filter(w => w.company || w.role).map(w => ({
            ...w,
            bullets: w.bullets.split('\n').map(b => b.trim()).filter(Boolean),
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

  // ── Done screen ──────────────────────────────────────────────
  if (step === 'done') return (
    <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center px-6 text-center gap-5">
      <CheckCircle size={80} className="text-[#10B981]" />
      <h2 className="text-[24px] font-extrabold text-text-primary">บันทึก Resume แล้ว!</h2>
      <p className="text-text-secondary">Resume ของคุณพร้อมใช้งานแล้ว</p>
      <button onClick={() => router.replace('/home')} className="bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity">
        ไปหน้าหลัก
      </button>
    </div>
  );

  // ── Choice screen ─────────────────────────────────────────────
  if (step === 'choice') return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator header-safe">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ios-bg transition-colors">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="text-[17px] font-bold text-text-primary">สร้าง Resume</h1>
          <button onClick={handleSkip} className="text-sm text-text-secondary hover:text-text-primary">ข้ามก่อน</button>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-4">
        <p className="text-center text-text-secondary text-sm mb-2">เลือกวิธีสร้าง Resume ของคุณ</p>
        <button onClick={() => setStep('upload')} className="bg-white rounded-2xl p-6 border-2 border-separator hover:border-primary transition-colors text-left flex items-start gap-4">
          <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center shrink-0">
            <Upload size={24} className="text-[#3B82F6]" />
          </div>
          <div>
            <p className="font-bold text-text-primary text-[16px] mb-1">อัปโหลด PDF</p>
            <p className="text-sm text-text-secondary leading-relaxed">อัปโหลด Resume ที่มีอยู่แล้ว ระบบจะวิเคราะห์คะแนน ATS ให้</p>
          </div>
        </button>
        <button onClick={() => setStep('create')} className="bg-white rounded-2xl p-6 border-2 border-separator hover:border-primary transition-colors text-left flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <PenLine size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-text-primary text-[16px] mb-1">สร้างจาก Template</p>
            <p className="text-sm text-text-secondary leading-relaxed">กรอกข้อมูลและระบบจะสร้าง Resume ให้อัตโนมัติ</p>
          </div>
        </button>
      </div>
    </div>
  );

  // ── Upload screen ─────────────────────────────────────────────
  if (step === 'upload') return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator header-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => setStep('choice')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ios-bg transition-colors">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="text-[17px] font-bold text-text-primary">อัปโหลด Resume</h1>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5">
        <label className="border-2 border-dashed border-separator rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary transition-colors bg-white">
          <Upload size={40} className={pickedFile ? 'text-primary' : 'text-text-tertiary'} />
          <p className="font-semibold text-text-primary">{pickedFile ? pickedFile.name : 'เลือกไฟล์ PDF'}</p>
          <p className="text-sm text-text-secondary">รองรับ PDF เท่านั้น ขนาดไม่เกิน 10MB</p>
          <input type="file" accept=".pdf" className="hidden" onChange={e => setPickedFile(e.target.files?.[0] || null)} />
        </label>
        <button
          onClick={handleUpload}
          disabled={!pickedFile || loading}
          className="w-full bg-primary text-white font-bold py-4 rounded-2xl disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={20} className="animate-spin" />}
          {loading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
        </button>
      </div>
    </div>
  );

  // ── Create form ───────────────────────────────────────────────
  const totalSteps = 4;
  const stepPct = (formStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col">
      <header className="bg-white border-b border-separator sticky top-0 z-10 header-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => formStep > 1 ? setFormStep(f => f - 1) : setStep('choice')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ios-bg transition-colors">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <div className="flex-1">
            <p className="text-[13px] text-text-secondary">ขั้นตอน {formStep}/{totalSteps}</p>
            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${stepPct}%` }} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5 overflow-y-auto pb-24">

        {/* Step 1: Personal info */}
        {formStep === 1 && (
          <FormSection title="ข้อมูลส่วนตัว">
            <Field label="ชื่อ-นามสกุล *" value={fullName} onChange={setFullName} placeholder="ชื่อเต็ม" />
            <Field label="อีเมล" value={email} onChange={setEmail} placeholder="email@example.com" type="email" />
            <Field label="เบอร์โทร" value={phone} onChange={setPhone} placeholder="08x-xxx-xxxx" />
            <Field label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/..." />
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">ทักษะ (คั่นด้วย comma)</label>
              <textarea value={skillsText} onChange={e => setSkillsText(e.target.value)} rows={3}
                placeholder="Figma, UX Research, Data Analysis..."
                className="w-full border border-separator rounded-2xl px-4 py-3 text-[14px] text-text-primary outline-none focus:border-primary transition-colors resize-none bg-white placeholder:text-text-tertiary" />
            </div>
          </FormSection>
        )}

        {/* Step 2: Work experience */}
        {formStep === 2 && (
          <FormSection title="ประสบการณ์การทำงาน">
            {workEntries.map((w, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-separator mb-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[14px] font-bold text-text-primary">ที่ทำงาน {i + 1}</p>
                  {workEntries.length > 1 && (
                    <button onClick={() => setWorkEntries(prev => prev.filter((_, j) => j !== i))} className="text-[#EF4444] hover:opacity-80">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Field label="บริษัท" value={w.company} onChange={v => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, company: v } : x))} placeholder="ชื่อบริษัท" />
                  <Field label="ตำแหน่ง" value={w.role} onChange={v => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, role: v } : x))} placeholder="เช่น UX Designer" />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="เริ่ม" value={w.start_date} onChange={v => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, start_date: v } : x))} placeholder="01/2023" />
                    <Field label="สิ้นสุด" value={w.end_date} onChange={v => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, end_date: v } : x))} placeholder="ปัจจุบัน" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-text-primary mb-1">สิ่งที่ทำ (แต่ละบรรทัดคือ bullet)</label>
                    <textarea value={w.bullets} onChange={e => setWorkEntries(prev => prev.map((x, j) => j === i ? { ...x, bullets: e.target.value } : x))}
                      rows={3} placeholder="- ออกแบบ UX สำหรับแอป..."
                      className="w-full border border-separator rounded-xl px-3 py-2 text-[13px] outline-none focus:border-primary resize-none" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setWorkEntries(prev => [...prev, { ...E_WORK }])} className="flex items-center gap-2 text-primary text-sm font-semibold hover:opacity-80">
              <Plus size={16} /> เพิ่มที่ทำงาน
            </button>
          </FormSection>
        )}

        {/* Step 3: Education */}
        {formStep === 3 && (
          <FormSection title="การศึกษา">
            {eduEntries.map((e, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-separator mb-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[14px] font-bold text-text-primary">การศึกษา {i + 1}</p>
                  {eduEntries.length > 1 && (
                    <button onClick={() => setEduEntries(prev => prev.filter((_, j) => j !== i))} className="text-[#EF4444] hover:opacity-80">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Field label="สถาบัน" value={e.institution} onChange={v => setEduEntries(prev => prev.map((x, j) => j === i ? { ...x, institution: v } : x))} placeholder="ชื่อมหาวิทยาลัย" />
                  <Field label="วุฒิการศึกษา" value={e.degree} onChange={v => setEduEntries(prev => prev.map((x, j) => j === i ? { ...x, degree: v } : x))} placeholder="ปริญญาตรี" />
                  <Field label="สาขา" value={e.field} onChange={v => setEduEntries(prev => prev.map((x, j) => j === i ? { ...x, field: v } : x))} placeholder="Computer Science" />
                  <Field label="ปีจบ" value={e.graduation_year} onChange={v => setEduEntries(prev => prev.map((x, j) => j === i ? { ...x, graduation_year: v } : x))} placeholder="2023" />
                </div>
              </div>
            ))}
            <button onClick={() => setEduEntries(prev => [...prev, { ...E_EDU }])} className="flex items-center gap-2 text-primary text-sm font-semibold hover:opacity-80">
              <Plus size={16} /> เพิ่มการศึกษา
            </button>
          </FormSection>
        )}

        {/* Step 4: Languages + Certs */}
        {formStep === 4 && (
          <>
            <FormSection title="ภาษา">
              {langEntries.map((l, i) => (
                <div key={i} className="flex gap-2 items-end mb-2">
                  <div className="flex-1">
                    <Field label="ภาษา" value={l.language} onChange={v => setLangEntries(prev => prev.map((x, j) => j === i ? { ...x, language: v } : x))} placeholder="English" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[12px] font-semibold text-text-primary mb-1.5">ระดับ</label>
                    <select value={l.level} onChange={e => setLangEntries(prev => prev.map((x, j) => j === i ? { ...x, level: e.target.value } : x))}
                      className="w-full border border-separator rounded-xl px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-primary">
                      <option value="">เลือกระดับ</option>
                      {LEVEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setLangEntries(prev => prev.filter((_, j) => j !== i))} className="text-[#EF4444] pb-2 hover:opacity-80">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={() => setLangEntries(prev => [...prev, { ...E_LANG }])} className="flex items-center gap-2 text-primary text-sm font-semibold hover:opacity-80 mb-4">
                <Plus size={16} /> เพิ่มภาษา
              </button>
            </FormSection>
            <FormSection title="ใบรับรอง / Certifications">
              {certEntries.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-separator mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-bold text-text-primary">ใบรับรอง {i + 1}</p>
                    <button onClick={() => setCertEntries(prev => prev.filter((_, j) => j !== i))} className="text-[#EF4444] hover:opacity-80"><Trash2 size={15} /></button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Field label="ชื่อ" value={c.name} onChange={v => setCertEntries(prev => prev.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="Certificate Name" />
                    <Field label="ผู้ออก" value={c.issuer} onChange={v => setCertEntries(prev => prev.map((x, j) => j === i ? { ...x, issuer: v } : x))} placeholder="Mydemy / Coursera" />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="ปี" value={c.year} onChange={v => setCertEntries(prev => prev.map((x, j) => j === i ? { ...x, year: v } : x))} placeholder="2024" />
                      <Field label="URL" value={c.url} onChange={v => setCertEntries(prev => prev.map((x, j) => j === i ? { ...x, url: v } : x))} placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setCertEntries(prev => [...prev, { ...E_CERT }])} className="flex items-center gap-2 text-primary text-sm font-semibold hover:opacity-80">
                <Plus size={16} /> เพิ่มใบรับรอง
              </button>
            </FormSection>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-separator px-4 py-4 flex gap-3 max-w-lg mx-auto">
        {formStep < totalSteps ? (
          <button onClick={() => setFormStep(f => f + 1)} className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity">
            ถัดไป
          </button>
        ) : (
          <button onClick={handleCreate} disabled={loading} className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            {loading && <Loader2 size={20} className="animate-spin" />}
            {loading ? 'กำลังบันทึก...' : 'บันทึก Resume'}
          </button>
        )}
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-[18px] font-extrabold text-text-primary mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-text-primary mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-separator rounded-xl px-3 py-2.5 text-[14px] text-text-primary outline-none focus:border-primary transition-colors bg-white placeholder:text-text-tertiary"
      />
    </div>
  );
}

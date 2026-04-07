'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff, Info, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
type Screen = 'login' | 'register' | 'reset-password' | 'first-login';

const C = {
  primary:  '#ef5ea8',
  bg:       '#F2F2F7',
  surface:  '#FFFFFF',
  ink:      '#1C1C1E',
  ink2:     '#8E8E93',
  ink3:     '#C7C7CC',
  rim:      'rgba(0,0,0,0.08)',
};

/* ── Input field ──────────────────────────────── */
function Field({ icon, label, type, value, onChange, placeholder, right }: {
  icon: React.ReactNode; label: string; type: string;
  value: string; onChange: (v: string) => void;
  placeholder: string; right?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-[12px] font-bold uppercase tracking-widest mb-2" style={{ color: C.ink2 }}>{label}</p>
      <div
        className="flex items-center gap-3 rounded-[14px] px-4 py-3.5"
        style={{ backgroundColor: C.bg, border: '1px solid rgba(0,0,0,0.08)' }}
      >
        <span style={{ color: C.ink3 }} className="shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: '15px', color: C.ink }}
          autoCapitalize="none"
          autoCorrect="off"
        />
        {right}
      </div>
    </div>
  );
}

/* ── Primary button ────────────────────────────── */
function Btn({ onClick, children, loading }: { onClick: () => void; children: React.ReactNode; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-[16px] font-bold text-white active:scale-[0.97] transition-transform disabled:opacity-50 mt-2"
      style={{ backgroundColor: C.primary, padding: '16px 24px', fontSize: '16px', boxShadow: '0px 16px 32px rgba(239,94,168,0.20)' }}
    >
      {loading
        ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : children}
    </button>
  );
}

/* ── Main ──────────────────────────────────────── */
export default function AuthPage() {
  const router = useRouter();
  const { login, loginWithData, register, changePassword, user } = useUser();

  const [screen, setScreen]           = useState<Screen>('login');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [username, setUsername]       = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [showNew, setShowNew]         = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { toast.error('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setLoading(true);
    try {
      const { mustResetPassword, hasResumeSetup } = await login(email.trim(), password);
      if (mustResetPassword) setScreen('reset-password');
      else if (!hasResumeSetup) router.replace('/resume-setup');
      else router.replace('/home');
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (detail?.includes('ยังไม่ได้ตั้งรหัสผ่าน')) {
        if (confirm('บัญชีถูกโอนมาจากระบบ Mydemy เดิม กรุณาตั้งรหัสผ่านใหม่\n\nกด OK เพื่อตั้งรหัสผ่าน')) {
          setScreen('first-login'); setPassword('');
        }
      } else toast.error(detail || e.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!username || !email || !password) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    if (password.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    setLoading(true);
    try {
      await register(username, email.trim(), password);
      router.replace('/resume-setup');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  const handleFirstLogin = async () => {
    if (!email || !newPassword || !confirmPw) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    if (newPassword.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (newPassword !== confirmPw) { toast.error('รหัสผ่านไม่ตรงกัน'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/setup-password`, {
        email: email.trim(), new_password: newPassword,
      });
      loginWithData(res.data);
      router.replace(res.data?.has_resume_setup ? '/home' : '/resume-setup');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!newPassword || !confirmPw) { toast.error('กรุณากรอกรหัสผ่านใหม่'); return; }
    if (newPassword.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (newPassword !== confirmPw) { toast.error('รหัสผ่านไม่ตรงกัน'); return; }
    if (!user?._id) { setScreen('login'); return; }
    setLoading(true);
    try {
      await changePassword(user._id, newPassword);
      router.replace(user?.has_resume_setup ? '/home' : '/resume-setup');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  /* ── Shared page wrapper ───────────────────────── */
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: C.bg, paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Brand header */}
      <div className="flex flex-col items-center pt-14 pb-8 px-6">
        <Image
          src="/images/mascot.png"
          alt="Mydemy"
          width={72} height={72}
          className="rounded-[20px] mb-4"
          style={{ boxShadow: '0px 8px 24px rgba(0,0,0,0.12)' }}
          priority
        />
        <Image
          src="/images/logo-wordmark.png"
          alt="Mydemy"
          width={110} height={34}
          className="object-contain h-[30px] w-auto mb-1"
          style={{ filter: 'brightness(0) saturate(100%) invert(44%) sepia(77%) saturate(1032%) hue-rotate(295deg) brightness(98%) contrast(95%)' }}
          priority
        />
        <p style={{ fontSize: '14px', color: C.ink2 }}>เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน</p>
      </div>

      {/* Form card */}
      <div
        className="flex-1 mx-4 mb-4 rounded-[28px] p-6"
        style={{ backgroundColor: C.surface, boxShadow: '0px 8px 32px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)' }}
      >
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );

  /* ── First-login ───────────────────────────────── */
  if (screen === 'first-login') return (
    <Shell>
      <h2 className="mb-1" style={{ fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>ตั้งรหัสผ่านใหม่</h2>
      <p className="mb-5" style={{ fontSize: '14px', color: C.ink2 }}>สำหรับผู้ใช้จากระบบ Mydemy เดิม</p>
      <div className="flex items-start gap-2.5 rounded-[14px] p-3.5 mb-5" style={{ backgroundColor: 'rgba(239,94,168,0.08)', border: '1px solid rgba(239,94,168,0.15)' }}>
        <UserCircle size={18} style={{ color: C.primary }} className="shrink-0 mt-0.5" />
        <p style={{ fontSize: '13px', color: C.primary, lineHeight: '1.5' }}>กรอกอีเมลที่ลงทะเบียนไว้ และตั้งรหัสผ่านใหม่</p>
      </div>
      <Field icon={<Mail size={18} />} label="อีเมล" type="email" value={email} onChange={setEmail} placeholder="อีเมลที่ลงทะเบียนไว้" />
      <Field icon={<Lock size={18} />} label="รหัสผ่านใหม่" type={showNew ? 'text' : 'password'} value={newPassword} onChange={setNewPassword} placeholder="อย่างน้อย 8 ตัวอักษร"
        right={<button type="button" onClick={() => setShowNew(!showNew)} style={{ color: C.ink3 }}>{showNew ? <EyeOff size={16}/> : <Eye size={16}/>}</button>} />
      <Field icon={<Lock size={18} />} label="ยืนยันรหัสผ่าน" type={showNew ? 'text' : 'password'} value={confirmPw} onChange={setConfirmPw} placeholder="กรอกอีกครั้ง" />
      <Btn onClick={handleFirstLogin} loading={loading}>ตั้งรหัสผ่านและเข้าสู่ระบบ</Btn>
      <button onClick={() => setScreen('login')} className="w-full text-center py-4" style={{ fontSize: '13px', color: C.ink3 }}>← กลับ</button>
    </Shell>
  );

  /* ── Reset password ────────────────────────────── */
  if (screen === 'reset-password') return (
    <Shell>
      <h2 className="mb-1" style={{ fontSize: '22px', fontWeight: 700, color: C.ink, letterSpacing: '-0.02em' }}>ตั้งรหัสผ่านใหม่</h2>
      <p className="mb-5" style={{ fontSize: '14px', color: C.ink2 }}>เพื่อความปลอดภัยของบัญชีคุณ</p>
      <div className="flex items-start gap-2.5 rounded-[14px] p-3.5 mb-5" style={{ backgroundColor: 'rgba(239,94,168,0.08)', border: '1px solid rgba(239,94,168,0.15)' }}>
        <Info size={18} style={{ color: C.primary }} className="shrink-0 mt-0.5" />
        <p style={{ fontSize: '13px', color: C.primary, lineHeight: '1.5' }}>กรุณาตั้งรหัสผ่านใหม่เพื่อเข้าใช้งานต่อ</p>
      </div>
      <Field icon={<Lock size={18} />} label="รหัสผ่านใหม่" type={showNew ? 'text' : 'password'} value={newPassword} onChange={setNewPassword} placeholder="อย่างน้อย 8 ตัวอักษร"
        right={<button type="button" onClick={() => setShowNew(!showNew)} style={{ color: C.ink3 }}>{showNew ? <EyeOff size={16}/> : <Eye size={16}/>}</button>} />
      <Field icon={<Lock size={18} />} label="ยืนยันรหัสผ่านใหม่" type={showNew ? 'text' : 'password'} value={confirmPw} onChange={setConfirmPw} placeholder="กรอกอีกครั้ง" />
      <Btn onClick={handleReset} loading={loading}>บันทึกรหัสผ่านใหม่</Btn>
    </Shell>
  );

  /* ── Login / Register ──────────────────────────── */
  return (
    <Shell>
      {/* Tab switcher */}
      <div
        className="flex rounded-[14px] p-1 mb-6"
        style={{ backgroundColor: C.bg }}
      >
        {(['login', 'register'] as const).map(s => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className="flex-1 py-2.5 rounded-[10px] font-bold transition-all"
            style={{
              fontSize: '14px',
              backgroundColor: screen === s ? C.surface : 'transparent',
              color: screen === s ? C.ink : C.ink3,
              boxShadow: screen === s ? '0px 1px 6px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {s === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        ))}
      </div>

      {screen === 'register' && (
        <Field icon={<User size={18} />} label="ชื่อผู้ใช้" type="text" value={username} onChange={setUsername} placeholder="ชื่อที่ต้องการแสดง" />
      )}
      <Field icon={<Mail size={18} />} label="อีเมล" type="email" value={email} onChange={setEmail} placeholder="example@email.com" />
      <Field
        icon={<Lock size={18} />} label="รหัสผ่าน" type={showPw ? 'text' : 'password'}
        value={password} onChange={setPassword}
        placeholder={screen === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : '••••••••'}
        right={<button type="button" onClick={() => setShowPw(!showPw)} style={{ color: C.ink3 }}>{showPw ? <EyeOff size={16}/> : <Eye size={16}/>}</button>}
      />

      {screen === 'login' && (
        <div className="flex justify-between -mt-2 mb-5">
          <button onClick={() => { setNewPassword(''); setConfirmPw(''); setScreen('first-login'); }} style={{ fontSize: '12px', color: C.ink3 }}>
            เข้าสู่ระบบครั้งแรก?
          </button>
          <button style={{ fontSize: '12px', color: C.primary, fontWeight: 600 }}>ลืมรหัสผ่าน?</button>
        </div>
      )}

      <Btn onClick={screen === 'login' ? handleLogin : handleRegister} loading={loading}>
        {screen === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกฟรี'}
      </Btn>

      <button onClick={() => router.replace('/home')} className="w-full text-center py-4 mt-1" style={{ fontSize: '13px', color: C.ink3 }}>
        ข้ามไปก่อน
      </button>
    </Shell>
  );
}

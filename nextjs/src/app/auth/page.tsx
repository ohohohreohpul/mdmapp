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
  primary: '#ef5ea8',
  bg:      '#F2F2F7',
  surface: '#FFFFFF',
  ink:     '#1C1C1E',
  ink2:    '#8E8E93',
  ink3:    '#C7C7CC',
};

/* ── Input field ──────────────────────────────────────────── */
function Field({
  icon, label, type, value, onChange, placeholder, right,
}: {
  icon: React.ReactNode; label: string; type: string;
  value: string; onChange: (v: string) => void;
  placeholder: string; right?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>{label}</p>
      <div
        className="flex items-center"
        style={{
          gap: 10,
          backgroundColor: C.bg,
          borderRadius: 12,
          padding: '13px 14px',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ color: C.ink3, flexShrink: 0, display: 'flex' }}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: 15, color: C.ink }}
          autoCapitalize="none"
          autoCorrect="off"
        />
        {right}
      </div>
    </div>
  );
}

/* ── Submit button ────────────────────────────────────────── */
function Btn({
  onClick, children, loading,
}: { onClick: () => void; children: React.ReactNode; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center active:scale-[0.97] transition-transform disabled:opacity-50"
      style={{
        backgroundColor: C.primary,
        color: 'white', fontWeight: 700, fontSize: 16,
        padding: '16px 24px', borderRadius: 14, marginTop: 8,
        boxShadow: '0px 8px 24px rgba(239,94,168,0.30)',
        gap: 8,
      }}
    >
      {loading
        ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : children}
    </button>
  );
}

/* ── Info banner ──────────────────────────────────────────── */
function InfoBanner({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div
      className="flex items-start"
      style={{
        gap: 10, borderRadius: 12, padding: '12px 14px', marginBottom: 16,
        backgroundColor: 'rgba(239,94,168,0.08)',
        border: '1px solid rgba(239,94,168,0.15)',
      }}
    >
      <Icon size={17} style={{ color: C.primary, flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 13, color: C.primary, lineHeight: 1.55 }}>{text}</p>
    </div>
  );
}

/* ── Page shell ───────────────────────────────────────────── */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{
        backgroundColor: C.bg,
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)',
        paddingBottom: 40,
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      {/* Brand */}
      <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
        <Image
          src="/images/mascot.png"
          alt="Mydemy"
          width={80} height={80}
          className="rounded-[22px] mb-4"
          style={{ boxShadow: '0px 8px 28px rgba(0,0,0,0.14)' }}
          priority
        />
        <Image
          src="/images/logo-wordmark.png"
          alt="Mydemy"
          width={120} height={38}
          className="object-contain mb-2"
          style={{
            filter: 'brightness(0) saturate(100%) invert(44%) sepia(77%) saturate(1032%) hue-rotate(295deg) brightness(98%) contrast(95%)',
            height: 32, width: 'auto',
          }}
          priority
        />
        <p style={{ fontSize: 14, color: C.ink2 }}>เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน</p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md"
        style={{
          backgroundColor: C.surface,
          borderRadius: 24,
          padding: 24,
          boxShadow: '0px 4px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────── */
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

  /* ── First-login screen ──────────────────────── */
  if (screen === 'first-login') return (
    <Shell>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4, letterSpacing: '-0.02em' }}>
        ตั้งรหัสผ่านใหม่
      </h2>
      <p style={{ fontSize: 14, color: C.ink2, marginBottom: 20 }}>สำหรับผู้ใช้จากระบบ Mydemy เดิม</p>
      <InfoBanner icon={UserCircle} text="กรอกอีเมลที่ลงทะเบียนไว้ และตั้งรหัสผ่านใหม่" />
      <Field icon={<Mail size={18} />} label="อีเมล" type="email" value={email} onChange={setEmail} placeholder="อีเมลที่ลงทะเบียนไว้" />
      <Field
        icon={<Lock size={18} />} label="รหัสผ่านใหม่"
        type={showNew ? 'text' : 'password'} value={newPassword} onChange={setNewPassword}
        placeholder="อย่างน้อย 8 ตัวอักษร"
        right={<button type="button" onClick={() => setShowNew(!showNew)} style={{ color: C.ink3 }}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
      />
      <Field icon={<Lock size={18} />} label="ยืนยันรหัสผ่าน" type={showNew ? 'text' : 'password'} value={confirmPw} onChange={setConfirmPw} placeholder="กรอกอีกครั้ง" />
      <Btn onClick={handleFirstLogin} loading={loading}>ตั้งรหัสผ่านและเข้าสู่ระบบ</Btn>
      <button onClick={() => setScreen('login')} className="w-full text-center" style={{ padding: '16px 0 4px', fontSize: 13, color: C.ink3 }}>
        ← กลับ
      </button>
    </Shell>
  );

  /* ── Reset password screen ───────────────────── */
  if (screen === 'reset-password') return (
    <Shell>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4, letterSpacing: '-0.02em' }}>
        ตั้งรหัสผ่านใหม่
      </h2>
      <p style={{ fontSize: 14, color: C.ink2, marginBottom: 20 }}>เพื่อความปลอดภัยของบัญชีคุณ</p>
      <InfoBanner icon={Info} text="กรุณาตั้งรหัสผ่านใหม่เพื่อเข้าใช้งานต่อ" />
      <Field
        icon={<Lock size={18} />} label="รหัสผ่านใหม่"
        type={showNew ? 'text' : 'password'} value={newPassword} onChange={setNewPassword}
        placeholder="อย่างน้อย 8 ตัวอักษร"
        right={<button type="button" onClick={() => setShowNew(!showNew)} style={{ color: C.ink3 }}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
      />
      <Field icon={<Lock size={18} />} label="ยืนยันรหัสผ่านใหม่" type={showNew ? 'text' : 'password'} value={confirmPw} onChange={setConfirmPw} placeholder="กรอกอีกครั้ง" />
      <Btn onClick={handleReset} loading={loading}>บันทึกรหัสผ่านใหม่</Btn>
    </Shell>
  );

  /* ── Login / Register ────────────────────────── */
  return (
    <Shell>
      {/* Tab switcher */}
      <div
        className="flex"
        style={{
          backgroundColor: C.bg, borderRadius: 12, padding: 4, marginBottom: 24,
        }}
      >
        {(['login', 'register'] as const).map(s => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className="flex-1 transition-all"
            style={{
              padding: '10px 0',
              borderRadius: 9,
              fontSize: 14, fontWeight: 700,
              backgroundColor: screen === s ? C.surface : 'transparent',
              color: screen === s ? C.ink : C.ink3,
              boxShadow: screen === s ? '0px 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {s === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        ))}
      </div>

      {/* Fields */}
      {screen === 'register' && (
        <Field icon={<User size={18} />} label="ชื่อผู้ใช้" type="text" value={username} onChange={setUsername} placeholder="ชื่อที่ต้องการแสดง" />
      )}
      <Field icon={<Mail size={18} />} label="อีเมล" type="email" value={email} onChange={setEmail} placeholder="example@email.com" />
      <Field
        icon={<Lock size={18} />} label="รหัสผ่าน"
        type={showPw ? 'text' : 'password'}
        value={password} onChange={setPassword}
        placeholder={screen === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : '••••••••'}
        right={<button type="button" onClick={() => setShowPw(!showPw)} style={{ color: C.ink3 }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
      />

      {screen === 'login' && (
        <div className="flex justify-between" style={{ marginTop: -6, marginBottom: 20 }}>
          <button
            onClick={() => { setNewPassword(''); setConfirmPw(''); setScreen('first-login'); }}
            style={{ fontSize: 12, color: C.ink3 }}
          >
            เข้าสู่ระบบครั้งแรก?
          </button>
          <button style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>ลืมรหัสผ่าน?</button>
        </div>
      )}

      <Btn onClick={screen === 'login' ? handleLogin : handleRegister} loading={loading}>
        {screen === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกฟรี'}
      </Btn>

      <button
        onClick={() => router.replace('/home')}
        className="w-full text-center"
        style={{ padding: '16px 0 4px', fontSize: 13, color: C.ink3 }}
      >
        ข้ามไปก่อน
      </button>
    </Shell>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff, UserCircle, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

type Screen = 'login' | 'register' | 'reset-password' | 'first-login';

export default function AuthPage() {
  const router = useRouter();
  const { login, loginWithData, register, changePassword, user } = useUser();

  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ── Login ──────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) { toast.error('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setLoading(true);
    try {
      const { mustResetPassword, hasResumeSetup } = await login(email.trim(), password);
      if (mustResetPassword) {
        setScreen('reset-password');
      } else if (!hasResumeSetup) {
        router.replace('/resume-setup');
      } else {
        router.replace('/home');
      }
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (detail?.includes('ยังไม่ได้ตั้งรหัสผ่าน')) {
        if (confirm('บัญชีของคุณถูกโอนมาจากระบบ Mydemy เดิม กรุณาตั้งรหัสผ่านใหม่\n\nกด OK เพื่อตั้งรหัสผ่าน')) {
          setScreen('first-login');
          setPassword('');
        }
      } else {
        toast.error(detail || error.message || 'เกิดข้อผิดพลาด');
      }
    } finally { setLoading(false); }
  };

  // ── Register ───────────────────────────────────────────────
  const handleRegister = async () => {
    if (!username || !email || !password) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    if (password.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    setLoading(true);
    try {
      await register(username, email.trim(), password);
      router.replace('/resume-setup');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  // ── First-login (WP migrants) ──────────────────────────────
  const handleFirstLogin = async () => {
    if (!email) { toast.error('กรุณากรอกอีเมล'); return; }
    if (!newPassword || !confirmPassword) { toast.error('กรุณากรอกรหัสผ่านใหม่'); return; }
    if (newPassword.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (newPassword !== confirmPassword) { toast.error('รหัสผ่านไม่ตรงกัน'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/setup-password`, {
        email: email.trim(), new_password: newPassword,
      });
      loginWithData(res.data);
      router.replace(res.data?.has_resume_setup ? '/home' : '/resume-setup');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  // ── Reset-password ─────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) { toast.error('กรุณากรอกรหัสผ่านใหม่'); return; }
    if (newPassword.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (newPassword !== confirmPassword) { toast.error('รหัสผ่านไม่ตรงกัน'); return; }
    if (!user?._id) { setScreen('login'); return; }
    setLoading(true);
    try {
      await changePassword(user._id, newPassword);
      router.replace(user?.has_resume_setup ? '/home' : '/resume-setup');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  // ── Hero strip ─────────────────────────────────────────────
  const Hero = ({ subtitle }: { subtitle: string }) => (
    <div
      className="flex flex-col items-center pb-8 px-6"
      style={{
        background: 'linear-gradient(160deg, #f472b6 0%, #ef5ea8 55%, #db2777 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)',
      }}
    >
      <Image
        src="/images/logo-wordmark.png"
        alt="Mydemy"
        width={140}
        height={46}
        className="object-contain h-[44px] w-auto brightness-0 invert mb-2"
        priority
      />
      <p className="text-white/80 text-[14px]">{subtitle}</p>
    </div>
  );

  // ── First-login screen ─────────────────────────────────────
  if (screen === 'first-login') {
    return (
      <AuthShell>
        <Hero subtitle="ตั้งรหัสผ่านสำหรับบัญชีของคุณ" />
        <FormBody>
          <InfoBanner icon={<UserCircle size={20} className="text-primary shrink-0" />}>
            บัญชีของคุณถูกโอนมาจากระบบ Mydemy เดิม<br />กรุณากรอกอีเมลและตั้งรหัสผ่านใหม่
          </InfoBanner>
          <Field label="อีเมล" icon={<Mail size={18} />} type="email" value={email} onChange={setEmail} placeholder="อีเมลที่ลงทะเบียนไว้" />
          <PwField label="รหัสผ่านใหม่" value={newPassword} onChange={setNewPassword} show={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)} placeholder="อย่างน้อย 8 ตัวอักษร" />
          <PwField label="ยืนยันรหัสผ่าน" value={confirmPassword} onChange={setConfirmPassword} show={showNewPassword} placeholder="กรอกรหัสผ่านอีกครั้ง" />
          <SubmitBtn loading={loading} onPress={handleFirstLogin} label="ตั้งรหัสผ่านและเข้าสู่ระบบ" />
          <button onClick={() => setScreen('login')} className="w-full text-center py-3 text-[14px] text-text-secondary hover:text-text-primary transition-colors">
            ← กลับหน้าเข้าสู่ระบบ
          </button>
        </FormBody>
      </AuthShell>
    );
  }

  // ── Reset-password screen ──────────────────────────────────
  if (screen === 'reset-password') {
    return (
      <AuthShell>
        <Hero subtitle="ตั้งรหัสผ่านใหม่" />
        <FormBody>
          <InfoBanner icon={<Info size={20} className="text-primary shrink-0" />}>
            กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชีคุณ
          </InfoBanner>
          <PwField label="รหัสผ่านใหม่" value={newPassword} onChange={setNewPassword} show={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)} placeholder="อย่างน้อย 8 ตัวอักษร" />
          <PwField label="ยืนยันรหัสผ่านใหม่" value={confirmPassword} onChange={setConfirmPassword} show={showNewPassword} placeholder="กรอกรหัสผ่านอีกครั้ง" />
          <SubmitBtn loading={loading} onPress={handleResetPassword} label="บันทึกรหัสผ่านใหม่" />
        </FormBody>
      </AuthShell>
    );
  }

  // ── Login / Register ───────────────────────────────────────
  return (
    <AuthShell>
      <Hero subtitle={screen === 'login' ? 'ยินดีต้อนรับกลับมา 👋' : 'สร้างบัญชีใหม่ฟรี'} />
      <FormBody>
        {/* Tab switcher */}
        <div className="flex bg-ios-bg rounded-2xl p-1 mb-5">
          {(['login', 'register'] as const).map(s => (
            <button
              key={s}
              onClick={() => setScreen(s)}
              className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all ${
                screen === s ? 'bg-white text-text-primary shadow-sm' : 'text-text-tertiary'
              }`}
            >
              {s === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          ))}
        </div>

        {screen === 'register' && (
          <Field label="ชื่อผู้ใช้" icon={<User size={18} />} type="text" value={username} onChange={setUsername} placeholder="ชื่อที่ต้องการแสดง" />
        )}
        <Field label="อีเมล" icon={<Mail size={18} />} type="email" value={email} onChange={setEmail} placeholder="example@email.com" />
        <PwField
          label="รหัสผ่าน"
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          placeholder={screen === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : '••••••••'}
        />

        {screen === 'login' && (
          <div className="flex items-center justify-between mb-5 -mt-1">
            <button
              onClick={() => { setNewPassword(''); setConfirmPassword(''); setScreen('first-login'); }}
              className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
            >
              เข้าสู่ระบบครั้งแรก?
            </button>
            <button className="text-[13px] text-primary font-semibold">ลืมรหัสผ่าน?</button>
          </div>
        )}

        <SubmitBtn
          loading={loading}
          onPress={screen === 'login' ? handleLogin : handleRegister}
          label={screen === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        />

        <button
          onClick={() => router.replace('/home')}
          className="w-full text-center py-3 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors mt-1"
        >
          ข้ามไปก่อน
        </button>
      </FormBody>
    </AuthShell>
  );
}

// ── Layout shells ──────────────────────────────────────────
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ios-bg">
      {children}
    </div>
  );
}

function FormBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto px-5 py-6">
      {children}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────
function InfoBanner({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-primary/[0.07] border border-primary/15 rounded-2xl p-4 mb-5">
      {icon}
      <p className="text-[13px] text-pink-900 leading-relaxed">{children}</p>
    </div>
  );
}

function Field({ label, icon, type, value, onChange, placeholder }: {
  label: string; icon: React.ReactNode; type: string;
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-semibold text-text-primary mb-1.5">{label}</label>
      <div className="flex items-center bg-white border border-separator rounded-2xl px-4 py-3.5 gap-3 focus-within:border-primary transition-colors shadow-sm">
        <span className="text-text-tertiary shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[15px] text-text-primary bg-transparent outline-none placeholder:text-text-tertiary"
          autoCapitalize="none"
        />
      </div>
    </div>
  );
}

function PwField({ label, value, onChange, show, onToggle, placeholder }: {
  label: string; value: string; onChange?: (v: string) => void;
  show: boolean; onToggle?: () => void; placeholder: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-semibold text-text-primary mb-1.5">{label}</label>
      <div className="flex items-center bg-white border border-separator rounded-2xl px-4 py-3.5 gap-3 focus-within:border-primary transition-colors shadow-sm">
        <Lock size={18} className="text-text-tertiary shrink-0" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[15px] text-text-primary bg-transparent outline-none placeholder:text-text-tertiary"
          autoCapitalize="none"
        />
        {onToggle && (
          <button type="button" onClick={onToggle} className="text-text-tertiary hover:text-text-secondary transition-colors">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SubmitBtn({ loading, onPress, label }: { loading: boolean; onPress: () => void; label: string }) {
  return (
    <button
      onClick={onPress}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl mt-2 mb-3 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 shadow-[0_6px_20px_rgba(239,94,168,0.35)]"
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {label}
    </button>
  );
}

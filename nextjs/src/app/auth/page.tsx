'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff, UserCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
    } finally {
      setLoading(false);
    }
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
    } finally {
      setLoading(false);
    }
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
        email: email.trim(),
        new_password: newPassword,
      });
      loginWithData(res.data);
      router.replace(res.data?.has_resume_setup ? '/home' : '/resume-setup');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset-password (must_reset_password=true) ──────────────
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
    } finally {
      setLoading(false);
    }
  };

  // ── Shared logo header ─────────────────────────────────────
  const LogoHeader = ({ subtitle }: { subtitle: string }) => (
    <div className="bg-white border-b border-separator pt-11 pb-9 flex flex-col items-center">
      <Image
        src="/images/logo-wordmark.png"
        alt="Mydemy"
        width={160}
        height={52}
        className="object-contain h-[52px] w-auto"
      />
      <p className="text-[16px] text-text-secondary mt-2.5">{subtitle}</p>
    </div>
  );

  // ── First-login screen ─────────────────────────────────────
  if (screen === 'first-login') {
    return (
      <div className="min-h-screen bg-ios-bg">
        <LogoHeader subtitle="ตั้งรหัสผ่านสำหรับบัญชีของคุณ" />
        <div className="max-w-md mx-auto px-6 py-6">
          <InfoBox icon={<UserCircle size={22} className="text-primary shrink-0 mt-0.5" />}>
            บัญชีของคุณถูกโอนมาจากระบบ Mydemy เดิม<br />กรุณากรอกอีเมลและตั้งรหัสผ่านใหม่
          </InfoBox>
          <InputField label="อีเมล" icon={<Mail size={20} />} type="email" value={email} onChange={setEmail} placeholder="อีเมลที่ลงทะเบียนไว้" />
          <PasswordField label="รหัสผ่านใหม่" value={newPassword} onChange={setNewPassword} show={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)} placeholder="อย่างน้อย 8 ตัวอักษร" />
          <PasswordField label="ยืนยันรหัสผ่าน" value={confirmPassword} onChange={setConfirmPassword} show={showNewPassword} placeholder="กรอกรหัสผ่านอีกครั้ง" />
          <SubmitButton loading={loading} onPress={handleFirstLogin} label="ตั้งรหัสผ่านและเข้าสู่ระบบ" loadingLabel="กำลังบันทึก..." />
          <button onClick={() => setScreen('login')} className="flex items-center justify-center gap-1.5 w-full mt-5 text-sm text-text-secondary hover:text-text-primary">
            ← กลับหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  // ── Reset-password screen ──────────────────────────────────
  if (screen === 'reset-password') {
    return (
      <div className="min-h-screen bg-ios-bg">
        <LogoHeader subtitle="ตั้งรหัสผ่านใหม่" />
        <div className="max-w-md mx-auto px-6 py-6">
          <InfoBox icon={<Info size={20} className="text-primary shrink-0 mt-0.5" />}>
            กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชีคุณ
          </InfoBox>
          <PasswordField label="รหัสผ่านใหม่" value={newPassword} onChange={setNewPassword} show={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)} placeholder="อย่างน้อย 8 ตัวอักษร" />
          <PasswordField label="ยืนยันรหัสผ่านใหม่" value={confirmPassword} onChange={setConfirmPassword} show={showNewPassword} placeholder="กรอกรหัสผ่านอีกครั้ง" />
          <SubmitButton loading={loading} onPress={handleResetPassword} label="บันทึกรหัสผ่านใหม่" loadingLabel="กำลังบันทึก..." />
        </div>
      </div>
    );
  }

  // ── Login / Register ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-ios-bg">
      <LogoHeader subtitle={screen === 'login' ? 'ยินดีต้อนรับกลับมา!' : 'สร้างบัญชีใหม่'} />
      <div className="max-w-md mx-auto px-6 py-6">
        {screen === 'register' && (
          <InputField label="ชื่อผู้ใช้" icon={<User size={20} />} type="text" value={username} onChange={setUsername} placeholder="ชื่อที่ต้องการแสดง" />
        )}
        <InputField label="อีเมล" icon={<Mail size={20} />} type="email" value={email} onChange={setEmail} placeholder="example@email.com" />
        <PasswordField
          label="รหัสผ่าน"
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          placeholder={screen === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : '••••••••'}
        />

        {screen === 'login' && (
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => { setNewPassword(''); setConfirmPassword(''); setScreen('first-login'); }} className="text-sm text-text-secondary font-medium hover:text-text-primary">
              เข้าสู่ระบบครั้งแรก?
            </button>
            <button className="text-sm text-primary font-semibold">ลืมรหัสผ่าน?</button>
          </div>
        )}

        <SubmitButton
          loading={loading}
          onPress={screen === 'login' ? handleLogin : handleRegister}
          label={screen === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          loadingLabel="กำลังดำเนินการ..."
        />

        <div className="flex justify-center items-center gap-1 mt-6">
          <span className="text-[15px] text-text-secondary">
            {screen === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}
          </span>
          <button
            onClick={() => setScreen(screen === 'login' ? 'register' : 'login')}
            className="text-[15px] text-primary font-bold"
          >
            {screen === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </div>

        <button onClick={() => router.replace('/home')} className="w-full text-center mt-4 py-3 text-sm text-[#AEAEB2] hover:text-text-secondary">
          ข้ามไปก่อน
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────
function InfoBox({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-primary/[0.06] border border-primary/15 rounded-2xl p-4 mb-6">
      {icon}
      <p className="text-sm text-pink-900 leading-relaxed">{children}</p>
    </div>
  );
}

function InputField({ label, icon, type, value, onChange, placeholder }: {
  label: string; icon: React.ReactNode; type: string;
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-text-primary mb-2">{label}</label>
      <div className="flex items-center bg-white border-[1.5px] border-separator rounded-2xl px-4 py-3.5 gap-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)] focus-within:border-primary transition-colors">
        <span className="text-text-secondary">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[16px] text-text-primary bg-transparent outline-none placeholder:text-[#9CA3AF]"
          autoCapitalize="none"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, placeholder }: {
  label: string; value: string; onChange?: (v: string) => void;
  show: boolean; onToggle?: () => void; placeholder: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-text-primary mb-2">{label}</label>
      <div className="flex items-center bg-white border-[1.5px] border-separator rounded-2xl px-4 py-3.5 gap-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)] focus-within:border-primary transition-colors">
        <Lock size={20} className="text-text-secondary shrink-0" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[16px] text-text-primary bg-transparent outline-none placeholder:text-[#9CA3AF]"
        />
        {onToggle && (
          <button type="button" onClick={onToggle} className="text-text-secondary hover:text-text-primary">
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SubmitButton({ loading, onPress, label, loadingLabel }: {
  loading: boolean; onPress: () => void; label: string; loadingLabel: string;
}) {
  return (
    <button
      onClick={onPress}
      disabled={loading}
      className="w-full bg-primary text-white font-bold text-[17px] py-[17px] rounded-2xl shadow-[0_6px_14px_rgba(239,94,168,0.3)] disabled:opacity-65 hover:opacity-90 transition-opacity mt-2"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

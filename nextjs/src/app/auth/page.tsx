'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff, UserCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { PrimaryBtn } from '@/lib/ui';
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
  const [showPw, setShowPw] = useState(false);
  const [showNew, setShowNew] = useState(false);

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
        if (confirm('บัญชีของคุณถูกโอนมาจากระบบ Mydemy เดิม กรุณาตั้งรหัสผ่านใหม่\n\nกด OK เพื่อตั้งรหัสผ่าน')) {
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
    if (!email || !newPassword || !confirmPassword) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    if (newPassword.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (newPassword !== confirmPassword) { toast.error('รหัสผ่านไม่ตรงกัน'); return; }
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
    if (!newPassword || !confirmPassword) { toast.error('กรุณากรอกรหัสผ่านใหม่'); return; }
    if (newPassword.length < 8) { toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (newPassword !== confirmPassword) { toast.error('รหัสผ่านไม่ตรงกัน'); return; }
    if (!user?._id) { setScreen('login'); return; }
    setLoading(true);
    try {
      await changePassword(user._id, newPassword);
      router.replace(user?.has_resume_setup ? '/home' : '/resume-setup');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e.message || 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  /* ── Shared hero strip ───────────────────────────────────── */
  const Hero = ({ sub }: { sub: string }) => (
    <div
      className="flex flex-col items-center pb-8 px-6"
      style={{
        background: 'linear-gradient(160deg, #f06bba 0%, #e8409b 50%, #c7357f 100%)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 36px)',
      }}
    >
      <Image
        src="/images/logo-wordmark.png"
        alt="Mydemy"
        width={130}
        height={42}
        className="object-contain brightness-0 invert h-[40px] w-auto mb-2"
        priority
      />
      <p className="text-white/75 text-[14px]">{sub}</p>
    </div>
  );

  const wrap = (content: React.ReactNode) => (
    <div className="min-h-screen bg-bg">
      {content}
    </div>
  );

  /* ── First-login ─────────────────────────────────────────── */
  if (screen === 'first-login') return wrap(<>
    <Hero sub="ตั้งรหัสผ่านสำหรับบัญชีของคุณ" />
    <Form>
      <InfoBox icon={<UserCircle size={20} className="text-brand shrink-0 mt-0.5" />}>
        บัญชีของคุณถูกโอนมาจากระบบ Mydemy เดิม<br />กรุณากรอกอีเมลและตั้งรหัสผ่านใหม่
      </InfoBox>
      <Field icon={<Mail size={18} />} label="อีเมล" type="email" value={email} onChange={setEmail} placeholder="อีเมลที่ลงทะเบียนไว้" />
      <PwField label="รหัสผ่านใหม่" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="อย่างน้อย 8 ตัวอักษร" />
      <PwField label="ยืนยันรหัสผ่าน" value={confirmPassword} onChange={setConfirmPassword} show={showNew} placeholder="กรอกรหัสผ่านอีกครั้ง" />
      <PrimaryBtn loading={loading} onClick={handleFirstLogin}>ตั้งรหัสผ่านและเข้าสู่ระบบ</PrimaryBtn>
      <BackLink onClick={() => setScreen('login')} />
    </Form>
  </>);

  /* ── Reset password ──────────────────────────────────────── */
  if (screen === 'reset-password') return wrap(<>
    <Hero sub="ตั้งรหัสผ่านใหม่" />
    <Form>
      <InfoBox icon={<Info size={20} className="text-brand shrink-0 mt-0.5" />}>
        กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชีคุณ
      </InfoBox>
      <PwField label="รหัสผ่านใหม่" value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(!showNew)} placeholder="อย่างน้อย 8 ตัวอักษร" />
      <PwField label="ยืนยันรหัสผ่านใหม่" value={confirmPassword} onChange={setConfirmPassword} show={showNew} placeholder="กรอกรหัสผ่านอีกครั้ง" />
      <PrimaryBtn loading={loading} onClick={handleReset}>บันทึกรหัสผ่านใหม่</PrimaryBtn>
    </Form>
  </>);

  /* ── Login / Register ────────────────────────────────────── */
  return wrap(<>
    <Hero sub={screen === 'login' ? 'ยินดีต้อนรับกลับมา 👋' : 'สร้างบัญชีใหม่ฟรี'} />
    <Form>
      {/* Tab switcher */}
      <div className="flex bg-raised rounded-2xl p-1 mb-5">
        {(['login', 'register'] as const).map(s => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all ${
              screen === s ? 'bg-surface text-ink card-shadow' : 'text-ink-3'
            }`}
          >
            {s === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        ))}
      </div>

      {screen === 'register' && (
        <Field icon={<User size={18} />} label="ชื่อผู้ใช้" type="text" value={username} onChange={setUsername} placeholder="ชื่อที่ต้องการแสดง" />
      )}
      <Field icon={<Mail size={18} />} label="อีเมล" type="email" value={email} onChange={setEmail} placeholder="example@email.com" />
      <PwField
        label="รหัสผ่าน"
        value={password}
        onChange={setPassword}
        show={showPw}
        onToggle={() => setShowPw(!showPw)}
        placeholder={screen === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : '••••••••'}
      />

      {screen === 'login' && (
        <div className="flex justify-between -mt-1 mb-5">
          <button
            onClick={() => { setNewPassword(''); setConfirmPassword(''); setScreen('first-login'); }}
            className="text-[13px] text-ink-3 hover:text-ink-2 transition-colors"
          >
            เข้าสู่ระบบครั้งแรก?
          </button>
          <button className="text-[13px] text-brand font-semibold">ลืมรหัสผ่าน?</button>
        </div>
      )}

      <PrimaryBtn loading={loading} onClick={screen === 'login' ? handleLogin : handleRegister}>
        {screen === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
      </PrimaryBtn>

      <button
        onClick={() => router.replace('/home')}
        className="w-full text-center py-3 text-[13px] text-ink-3 hover:text-ink-2 transition-colors mt-1"
      >
        ข้ามไปก่อน
      </button>
    </Form>
  </>);
}

/* ── Sub-components ──────────────────────────────────────── */
function Form({ children }: { children: React.ReactNode }) {
  return <div className="max-w-md mx-auto px-5 py-6">{children}</div>;
}

function InfoBox({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-brand-surface border border-brand/15 rounded-2xl p-4 mb-5">
      {icon}
      <p className="text-[13px] text-brand-dark leading-relaxed">{children}</p>
    </div>
  );
}

function Field({ icon, label, type, value, onChange, placeholder }: {
  icon: React.ReactNode; label: string; type: string;
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-semibold text-ink mb-1.5">{label}</label>
      <div className="flex items-center bg-surface border border-rim rounded-2xl px-4 py-3.5 gap-3 focus-within:border-brand transition-colors card-shadow">
        <span className="text-ink-3 shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[15px] text-ink bg-transparent outline-none placeholder:text-ink-3"
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
      <label className="block text-[13px] font-semibold text-ink mb-1.5">{label}</label>
      <div className="flex items-center bg-surface border border-rim rounded-2xl px-4 py-3.5 gap-3 focus-within:border-brand transition-colors card-shadow">
        <Lock size={18} className="text-ink-3 shrink-0" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[15px] text-ink bg-transparent outline-none placeholder:text-ink-3"
          autoCapitalize="none"
        />
        {onToggle && (
          <button type="button" onClick={onToggle} className="text-ink-3 hover:text-ink-2 transition-colors">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-center py-3 text-[13px] text-ink-3 hover:text-ink-2 transition-colors">
      ← กลับหน้าเข้าสู่ระบบ
    </button>
  );
}

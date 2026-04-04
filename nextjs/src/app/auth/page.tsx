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

/* ── input field ─────────────────────────────────── */
function Field({
  icon, label, type, value, onChange, placeholder, right,
}: {
  icon: React.ReactNode; label: string; type: string;
  value: string; onChange: (v: string) => void;
  placeholder: string; right?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-[12px] font-bold text-ink-2 mb-1.5 tracking-wide">{label}</p>
      <div
        className="flex items-center gap-3 bg-bg rounded-2xl px-4 py-3.5 border border-rim"
        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <span className="text-ink-3 shrink-0">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[15px] text-ink bg-transparent outline-none placeholder:text-ink-3"
          autoCapitalize="none"
          autoCorrect="off"
        />
        {right}
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────── */
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

  /* ── Primary button ─────────────────────────────── */
  const Btn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-4 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all mt-2"
      style={{ background: 'linear-gradient(135deg, #f472b6 0%, #e8409b 60%, #c7357f 100%)', boxShadow: '0 8px 24px rgba(232,64,155,0.35)' }}
    >
      {loading
        ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : children}
    </button>
  );

  /* ── Layout shell ──────────────────────────────── */
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Hero */}
      <div
        className="flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(170deg, #f472b6 0%, #e8409b 50%, #c7357f 100%)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)',
          paddingBottom: '56px',
        }}
      >
        <Image
          src="/images/mascot.png"
          alt="Mydemy"
          width={80} height={80}
          className="rounded-[22px] mb-4 shadow-[0_12px_32px_rgba(0,0,0,0.20)]"
          priority
        />
        <Image
          src="/images/logo-wordmark.png"
          alt="Mydemy"
          width={120} height={38}
          className="object-contain brightness-0 invert mb-1.5 h-[34px] w-auto"
          priority
        />
        <p className="text-white/65 text-[13px] tracking-wide">เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน</p>
      </div>

      {/* Floating card pulled over hero */}
      <div
        className="flex-1 rounded-t-[28px] bg-surface px-5 pt-7 pb-10"
        style={{ marginTop: '-24px', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)' }}
      >
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );

  /* ── First-login screen ─────────────────────────── */
  if (screen === 'first-login') return (
    <Shell>
      <h2 className="text-[20px] font-extrabold text-ink mb-1">ตั้งรหัสผ่านใหม่</h2>
      <p className="text-[13px] text-ink-2 mb-5">สำหรับผู้ใช้ที่ย้ายจากระบบ Mydemy เดิม</p>
      <div className="flex items-start gap-2.5 bg-brand/5 border border-brand/15 rounded-2xl p-4 mb-5">
        <UserCircle size={18} className="text-brand shrink-0 mt-0.5" />
        <p className="text-[13px] text-brand leading-relaxed">กรอกอีเมลที่ลงทะเบียนไว้ และตั้งรหัสผ่านใหม่</p>
      </div>
      <Field icon={<Mail size={18} />} label="อีเมล" type="email" value={email} onChange={setEmail} placeholder="อีเมลที่ลงทะเบียนไว้" />
      <Field
        icon={<Lock size={18} />} label="รหัสผ่านใหม่" type={showNew ? 'text' : 'password'}
        value={newPassword} onChange={setNewPassword} placeholder="อย่างน้อย 8 ตัวอักษร"
        right={<button type="button" onClick={() => setShowNew(!showNew)} className="text-ink-3">{showNew ? <EyeOff size={17}/> : <Eye size={17}/>}</button>}
      />
      <Field icon={<Lock size={18} />} label="ยืนยันรหัสผ่าน" type={showNew ? 'text' : 'password'} value={confirmPw} onChange={setConfirmPw} placeholder="กรอกอีกครั้ง" />
      <Btn onClick={handleFirstLogin}>ตั้งรหัสผ่านและเข้าสู่ระบบ</Btn>
      <button onClick={() => setScreen('login')} className="w-full text-center py-4 text-[13px] text-ink-3">← กลับ</button>
    </Shell>
  );

  /* ── Reset-password screen ──────────────────────── */
  if (screen === 'reset-password') return (
    <Shell>
      <h2 className="text-[20px] font-extrabold text-ink mb-1">ตั้งรหัสผ่านใหม่</h2>
      <p className="text-[13px] text-ink-2 mb-5">เพื่อความปลอดภัยของบัญชีคุณ</p>
      <div className="flex items-start gap-2.5 bg-brand/5 border border-brand/15 rounded-2xl p-4 mb-5">
        <Info size={18} className="text-brand shrink-0 mt-0.5" />
        <p className="text-[13px] text-brand leading-relaxed">กรุณาตั้งรหัสผ่านใหม่เพื่อเข้าใช้งานต่อ</p>
      </div>
      <Field
        icon={<Lock size={18} />} label="รหัสผ่านใหม่" type={showNew ? 'text' : 'password'}
        value={newPassword} onChange={setNewPassword} placeholder="อย่างน้อย 8 ตัวอักษร"
        right={<button type="button" onClick={() => setShowNew(!showNew)} className="text-ink-3">{showNew ? <EyeOff size={17}/> : <Eye size={17}/>}</button>}
      />
      <Field icon={<Lock size={18} />} label="ยืนยันรหัสผ่านใหม่" type={showNew ? 'text' : 'password'} value={confirmPw} onChange={setConfirmPw} placeholder="กรอกอีกครั้ง" />
      <Btn onClick={handleReset}>บันทึกรหัสผ่านใหม่</Btn>
    </Shell>
  );

  /* ── Login / Register ───────────────────────────── */
  return (
    <Shell>
      {/* Tab switcher */}
      <div className="flex bg-bg rounded-2xl p-1 mb-6 border border-rim">
        {(['login', 'register'] as const).map(s => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={`flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all ${
              screen === s
                ? 'bg-surface text-ink'
                : 'text-ink-3'
            }`}
            style={screen === s ? { boxShadow: '0 1px 6px rgba(0,0,0,0.10)' } : {}}
          >
            {s === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        ))}
      </div>

      <div>
        {screen === 'register' && (
          <Field icon={<User size={18} />} label="ชื่อผู้ใช้" type="text" value={username} onChange={setUsername} placeholder="ชื่อที่ต้องการแสดง" />
        )}
        <Field icon={<Mail size={18} />} label="อีเมล" type="email" value={email} onChange={setEmail} placeholder="example@email.com" />
        <Field
          icon={<Lock size={18} />}
          label="รหัสผ่าน"
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          placeholder={screen === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : '••••••••'}
          right={
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-ink-3">
              {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
            </button>
          }
        />

        {screen === 'login' && (
          <div className="flex justify-between -mt-2 mb-5">
            <button
              onClick={() => { setNewPassword(''); setConfirmPw(''); setScreen('first-login'); }}
              className="text-[12px] text-ink-3"
            >
              เข้าสู่ระบบครั้งแรก?
            </button>
            <button className="text-[12px] text-brand font-semibold">ลืมรหัสผ่าน?</button>
          </div>
        )}

        <Btn onClick={screen === 'login' ? handleLogin : handleRegister}>
          {screen === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกฟรี'}
        </Btn>

        <button
          onClick={() => router.replace('/home')}
          className="w-full text-center py-4 text-[13px] text-ink-3 mt-1"
        >
          ข้ามไปก่อน
        </button>
      </div>
    </Shell>
  );
}

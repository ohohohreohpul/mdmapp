'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Key, Globe, Bell, Mail, Moon, Play, ChevronRight, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';

const PREFS_KEY = 'app_preferences';

export default function SettingsPage() {
  const router = useRouter();
  const { user, changePassword, updateProfile } = useUser();

  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.notifications !== undefined) setNotifications(p.notifications);
        if (p.emailUpdates !== undefined) setEmailUpdates(p.emailUpdates);
        if (p.darkMode !== undefined) setDarkMode(p.darkMode);
        if (p.autoPlay !== undefined) setAutoPlay(p.autoPlay);
      }
    }
    if (user) setDisplayName(user.username || '');
  }, [user]);

  const savePrefs = (patch: object) => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(PREFS_KEY);
    const current = raw ? JSON.parse(raw) : {};
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }));
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) { toast.error('กรุณากรอกชื่อ'); return; }
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateProfile(user._id, { username: displayName.trim(), display_name: displayName.trim() });
      setEditProfileOpen(false);
      toast.success('✅ อัปเดตชื่อสำเร็จ');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'ลองใหม่อีกครั้ง');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPass || !confirmPass) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    if (newPass !== confirmPass) { toast.error('รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    if (newPass.length < 6) { toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (!user) return;
    setSavingPass(true);
    try {
      await changePassword(user._id, newPass, currentPass || undefined);
      setChangePassOpen(false);
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      toast.success('✅ เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'ลองใหม่อีกครั้ง');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ios-bg transition-colors">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="text-[17px] font-bold text-text-primary">การตั้งค่า</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5 pb-10">
        {/* Account */}
        <Section title="บัญชี">
          <SettingRow
            icon={<User size={20} className="text-text-secondary" />}
            label="แก้ไขโปรไฟล์"
            sub={user?.username}
            onClick={() => { if (!user) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return; } setDisplayName(user.username || ''); setEditProfileOpen(true); }}
          />
          <SettingRow
            icon={<Key size={20} className="text-text-secondary" />}
            label="เปลี่ยนรหัสผ่าน"
            onClick={() => { if (!user) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return; } setCurrentPass(''); setNewPass(''); setConfirmPass(''); setChangePassOpen(true); }}
          />
          <SettingRow icon={<Globe size={20} className="text-text-secondary" />} label="ภาษา" value="ไทย" last />
        </Section>

        {/* Notifications */}
        <Section title="การแจ้งเตือน">
          <SettingToggle icon={<Bell size={20} className="text-text-secondary" />} label="Push Notifications" value={notifications} onChange={v => { setNotifications(v); savePrefs({ notifications: v }); }} />
          <SettingToggle icon={<Mail size={20} className="text-text-secondary" />} label="Email Updates" value={emailUpdates} onChange={v => { setEmailUpdates(v); savePrefs({ emailUpdates: v }); }} last />
        </Section>

        {/* App preferences */}
        <Section title="การตั้งค่าแอป">
          <SettingToggle icon={<Moon size={20} className="text-text-secondary" />} label="Dark Mode" value={darkMode} onChange={v => { setDarkMode(v); savePrefs({ darkMode: v }); }} />
          <SettingToggle icon={<Play size={20} className="text-text-secondary" />} label="Auto-play วิดีโอ" value={autoPlay} onChange={v => { setAutoPlay(v); savePrefs({ autoPlay: v }); }} last />
        </Section>

        {/* About */}
        <Section title="เกี่ยวกับ">
          <SettingRow icon={<span className="text-base">📄</span>} label="นโยบายความเป็นส่วนตัว" onClick={() => {}} />
          <SettingRow icon={<span className="text-base">📋</span>} label="เงื่อนไขการใช้งาน" onClick={() => {}} />
          <SettingRow icon={<span className="text-base">ℹ️</span>} label="เวอร์ชัน" value="1.0.0" last />
        </Section>
      </div>

      {/* Edit profile modal */}
      {editProfileOpen && (
        <Modal title="แก้ไขโปรไฟล์" onClose={() => setEditProfileOpen(false)}>
          <label className="block text-sm font-semibold text-text-primary mb-2">ชื่อผู้ใช้</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full border border-separator rounded-2xl px-4 py-3 text-[15px] text-text-primary outline-none focus:border-primary transition-colors mb-4"
          />
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl disabled:opacity-65 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {savingProfile && <Loader2 size={18} className="animate-spin" />}
            บันทึก
          </button>
        </Modal>
      )}

      {/* Change password modal */}
      {changePassOpen && (
        <Modal title="เปลี่ยนรหัสผ่าน" onClose={() => setChangePassOpen(false)}>
          <PassField label="รหัสผ่านปัจจุบัน" value={currentPass} onChange={setCurrentPass} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
          <PassField label="รหัสผ่านใหม่" value={newPass} onChange={setNewPass} show={showNew} onToggle={() => setShowNew(!showNew)} />
          <PassField label="ยืนยันรหัสผ่านใหม่" value={confirmPass} onChange={setConfirmPass} show={showNew} />
          <button
            onClick={handleChangePassword}
            disabled={savingPass}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl mt-2 disabled:opacity-65 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {savingPass && <Loader2 size={18} className="animate-spin" />}
            บันทึก
          </button>
        </Modal>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-text-secondary px-1 mb-2">{title}</p>
      <div className="bg-white rounded-2xl overflow-hidden border border-separator">{children}</div>
    </div>
  );
}

function SettingRow({ icon, label, sub, value, onClick, last }: {
  icon: React.ReactNode; label: string; sub?: string; value?: string; onClick?: () => void; last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors ${!last ? 'border-b border-separator/60' : ''}`}
    >
      <span className="text-text-secondary shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text-primary">{label}</p>
        {sub && <p className="text-[12px] text-text-secondary">{sub}</p>}
      </div>
      {value ? <span className="text-[13px] text-text-secondary">{value}</span> : onClick ? <ChevronRight size={18} className="text-text-tertiary" /> : null}
    </button>
  );
}

function SettingToggle({ icon, label, value, onChange, last }: {
  icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${!last ? 'border-b border-separator/60' : ''}`}>
      <span className="text-text-secondary shrink-0">{icon}</span>
      <p className="flex-1 text-[14px] font-medium text-text-primary">{label}</p>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-5 pb-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PassField({ label, value, onChange, show, onToggle }: {
  label: string; value: string; onChange?: (v: string) => void; show: boolean; onToggle?: () => void;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-semibold text-text-primary mb-1.5">{label}</label>
      <div className="flex items-center border border-separator rounded-2xl px-4 py-3 gap-2 focus-within:border-primary transition-colors">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className="flex-1 text-[15px] text-text-primary outline-none bg-transparent"
        />
        {onToggle && (
          <button type="button" onClick={onToggle} className="text-text-secondary hover:text-text-primary">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

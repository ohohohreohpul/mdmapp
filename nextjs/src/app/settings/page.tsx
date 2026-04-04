'use client';

import { useState, useEffect } from 'react';
import { User, Key, Globe, Bell, Mail, Moon, Play, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Toggle } from '@/lib/ui';

const PREFS_KEY = 'app_preferences';

export default function SettingsPage() {
  const { user, changePassword, updateProfile } = useUser();

  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates]   = useState(true);
  const [darkMode, setDarkMode]           = useState(false);
  const [autoPlay, setAutoPlay]           = useState(true);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [displayName, setDisplayName]         = useState('');
  const [savingProfile, setSavingProfile]     = useState(false);

  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPass, setCurrentPass]       = useState('');
  const [newPass, setNewPass]               = useState('');
  const [confirmPass, setConfirmPass]       = useState('');
  const [showCurrent, setShowCurrent]       = useState(false);
  const [showNew, setShowNew]               = useState(false);
  const [savingPass, setSavingPass]         = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.notifications !== undefined) setNotifications(p.notifications);
        if (p.emailUpdates  !== undefined) setEmailUpdates(p.emailUpdates);
        if (p.darkMode      !== undefined) setDarkMode(p.darkMode);
        if (p.autoPlay      !== undefined) setAutoPlay(p.autoPlay);
      }
    }
    if (user) setDisplayName(user.username || '');
  }, [user]);

  const savePrefs = (patch: object) => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(PREFS_KEY);
    const cur = raw ? JSON.parse(raw) : {};
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...cur, ...patch }));
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) { toast.error('กรุณากรอกชื่อ'); return; }
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateProfile(user._id, { username: displayName.trim(), display_name: displayName.trim() });
      setEditProfileOpen(false);
      toast.success('อัปเดตชื่อสำเร็จ');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'ลองใหม่อีกครั้ง');
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!newPass || !confirmPass) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    if (newPass !== confirmPass)  { toast.error('รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    if (newPass.length < 6)       { toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (!user) return;
    setSavingPass(true);
    try {
      await changePassword(user._id, newPass, currentPass || undefined);
      setChangePassOpen(false);
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'ลองใหม่อีกครั้ง');
    } finally { setSavingPass(false); }
  };

  return (
    <div className="min-h-screen bg-bg">
      <NavHeader title="การตั้งค่า" />

      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5 pb-10">
        <Section title="บัญชี">
          <SettingRow icon={<User size={20} className="text-ink-2" />} label="แก้ไขโปรไฟล์" sub={user?.username}
            onClick={() => { if (!user) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return; } setDisplayName(user.username || ''); setEditProfileOpen(true); }} />
          <SettingRow icon={<Key size={20} className="text-ink-2" />} label="เปลี่ยนรหัสผ่าน"
            onClick={() => { if (!user) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return; } setCurrentPass(''); setNewPass(''); setConfirmPass(''); setChangePassOpen(true); }} />
          <SettingRow icon={<Globe size={20} className="text-ink-2" />} label="ภาษา" value="ไทย" last />
        </Section>

        <Section title="การแจ้งเตือน">
          <SettingToggle icon={<Bell size={20} className="text-ink-2" />} label="Push Notifications" value={notifications} onChange={v => { setNotifications(v); savePrefs({ notifications: v }); }} />
          <SettingToggle icon={<Mail size={20} className="text-ink-2" />} label="Email Updates" value={emailUpdates} onChange={v => { setEmailUpdates(v); savePrefs({ emailUpdates: v }); }} last />
        </Section>

        <Section title="การตั้งค่าแอป">
          <SettingToggle icon={<Moon size={20} className="text-ink-2" />} label="Dark Mode" value={darkMode} onChange={v => { setDarkMode(v); savePrefs({ darkMode: v }); }} />
          <SettingToggle icon={<Play size={20} className="text-ink-2" />} label="Auto-play วิดีโอ" value={autoPlay} onChange={v => { setAutoPlay(v); savePrefs({ autoPlay: v }); }} last />
        </Section>

        <Section title="เกี่ยวกับ">
          <SettingRow icon={<span className="text-base">📄</span>} label="นโยบายความเป็นส่วนตัว" onClick={() => {}} />
          <SettingRow icon={<span className="text-base">📋</span>} label="เงื่อนไขการใช้งาน" onClick={() => {}} />
          <SettingRow icon={<span className="text-base">ℹ️</span>} label="เวอร์ชัน" value="1.0.0" last />
        </Section>
      </div>

      {editProfileOpen && (
        <Modal title="แก้ไขโปรไฟล์" onClose={() => setEditProfileOpen(false)}>
          <label className="block text-[13px] font-semibold text-ink mb-2">ชื่อผู้ใช้</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full border border-rim rounded-2xl px-4 py-3 text-[15px] text-ink outline-none focus:border-brand transition-colors mb-4 bg-surface"
          />
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingProfile && <Loader2 size={18} className="animate-spin" />}
            บันทึก
          </button>
        </Modal>
      )}

      {changePassOpen && (
        <Modal title="เปลี่ยนรหัสผ่าน" onClose={() => setChangePassOpen(false)}>
          <PassField label="รหัสผ่านปัจจุบัน" value={currentPass} onChange={setCurrentPass} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
          <PassField label="รหัสผ่านใหม่" value={newPass} onChange={setNewPass} show={showNew} onToggle={() => setShowNew(!showNew)} />
          <PassField label="ยืนยันรหัสผ่านใหม่" value={confirmPass} onChange={setConfirmPass} show={showNew} />
          <button
            onClick={handleChangePassword}
            disabled={savingPass}
            className="w-full bg-brand text-white font-bold py-3.5 rounded-2xl mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
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
      <p className="text-[12px] font-bold text-ink-3 uppercase tracking-wider px-1 mb-2">{title}</p>
      <div className="bg-surface rounded-2xl overflow-hidden border border-rim card-shadow">{children}</div>
    </div>
  );
}

function SettingRow({ icon, label, sub, value, onClick, last }: {
  icon: React.ReactNode; label: string; sub?: string; value?: string; onClick?: () => void; last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg ${!last ? 'border-b border-rim' : ''}`}
    >
      <span className="text-ink-2 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-ink">{label}</p>
        {sub && <p className="text-[12px] text-ink-2">{sub}</p>}
      </div>
      {value ? <span className="text-[13px] text-ink-2">{value}</span> : onClick ? <span className="text-ink-3">›</span> : null}
    </button>
  );
}

function SettingToggle({ icon, label, value, onChange, last }: {
  icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${!last ? 'border-b border-rim' : ''}`}>
      <span className="text-ink-2 shrink-0">{icon}</span>
      <p className="flex-1 text-[14px] font-medium text-ink">{label}</p>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-t-3xl w-full max-w-lg p-5 pb-8" onClick={e => e.stopPropagation()}
           style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg transition-colors">
            <X size={18} className="text-ink-2" />
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
      <label className="block text-[13px] font-semibold text-ink mb-1.5">{label}</label>
      <div className="flex items-center border border-rim rounded-2xl px-4 py-3 gap-2 focus-within:border-brand transition-colors bg-surface">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className="flex-1 text-[15px] text-ink outline-none bg-transparent"
        />
        {onToggle && (
          <button type="button" onClick={onToggle} className="text-ink-3 hover:text-ink-2">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { User, Key, Globe, Bell, Mail, Moon, Play, Eye, EyeOff, Loader2, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Toggle } from '@/lib/ui';

const C = {
  brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC',
  bg: '#F2F2F7', surface: '#FFFFFF', sep: 'rgba(0,0,0,0.06)',
};
const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden',
};

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
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <NavHeader title="การตั้งค่า" />

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '20px 20px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Account */}
        <Section title="บัญชี">
          <Row icon={<User size={20} color={C.ink2} />} label="แก้ไขโปรไฟล์" sub={user?.username}
            onClick={() => { if (!user) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return; } setDisplayName(user.username || ''); setEditProfileOpen(true); }} />
          <Row icon={<Key size={20} color={C.ink2} />} label="เปลี่ยนรหัสผ่าน"
            onClick={() => { if (!user) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return; } setCurrentPass(''); setNewPass(''); setConfirmPass(''); setChangePassOpen(true); }} />
          <Row icon={<Globe size={20} color={C.ink2} />} label="ภาษา" value="ไทย" last />
        </Section>

        {/* Notifications */}
        <Section title="การแจ้งเตือน">
          <RowToggle icon={<Bell size={20} color={C.ink2} />} label="Push Notifications" value={notifications} onChange={v => { setNotifications(v); savePrefs({ notifications: v }); }} />
          <RowToggle icon={<Mail size={20} color={C.ink2} />} label="Email Updates" value={emailUpdates} onChange={v => { setEmailUpdates(v); savePrefs({ emailUpdates: v }); }} last />
        </Section>

        {/* App */}
        <Section title="การตั้งค่าแอป">
          <RowToggle icon={<Moon size={20} color={C.ink2} />} label="Dark Mode" value={darkMode} onChange={v => { setDarkMode(v); savePrefs({ darkMode: v }); }} />
          <RowToggle icon={<Play size={20} color={C.ink2} />} label="Auto-play วิดีโอ" value={autoPlay} onChange={v => { setAutoPlay(v); savePrefs({ autoPlay: v }); }} last />
        </Section>

        {/* About */}
        <Section title="เกี่ยวกับ">
          <Row icon={<span>📄</span>} label="นโยบายความเป็นส่วนตัว" onClick={() => {}} />
          <Row icon={<span>📋</span>} label="เงื่อนไขการใช้งาน" onClick={() => {}} />
          <Row icon={<span>ℹ️</span>} label="เวอร์ชัน" value="1.0.0" last />
        </Section>

      </div>

      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <Modal title="แก้ไขโปรไฟล์" onClose={() => setEditProfileOpen(false)}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 6 }}>ชื่อผู้ใช้</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={{
              width: '100%', border: `1px solid ${C.sep}`, borderRadius: 14,
              padding: '12px 16px', fontSize: 15, color: C.ink, outline: 'none',
              marginBottom: 16, backgroundColor: C.bg, boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            style={{
              width: '100%', backgroundColor: C.brand, color: '#fff',
              fontWeight: 700, padding: '14px 0', borderRadius: 14,
              border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer',
              opacity: savingProfile ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {savingProfile && <Loader2 size={18} className="animate-spin" />}
            บันทึก
          </button>
        </Modal>
      )}

      {/* Change Password Modal */}
      {changePassOpen && (
        <Modal title="เปลี่ยนรหัสผ่าน" onClose={() => setChangePassOpen(false)}>
          <PassField label="รหัสผ่านปัจจุบัน" value={currentPass} onChange={setCurrentPass} show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
          <PassField label="รหัสผ่านใหม่" value={newPass} onChange={setNewPass} show={showNew} onToggle={() => setShowNew(!showNew)} />
          <PassField label="ยืนยันรหัสผ่านใหม่" value={confirmPass} onChange={setConfirmPass} show={showNew} />
          <button
            onClick={handleChangePassword}
            disabled={savingPass}
            style={{
              width: '100%', backgroundColor: C.brand, color: '#fff',
              fontWeight: 700, padding: '14px 0', borderRadius: 14,
              border: 'none', cursor: savingPass ? 'not-allowed' : 'pointer',
              opacity: savingPass ? 0.6 : 1, marginTop: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
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
      <p style={{ fontSize: 12, fontWeight: 700, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: 4, marginBottom: 8 }}>{title}</p>
      <div style={card}>{children}</div>
    </div>
  );
}

function Row({ icon, label, sub, value, onClick, last }: {
  icon: React.ReactNode; label: string; sub?: string; value?: string; onClick?: () => void; last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', border: 'none', backgroundColor: 'transparent',
        cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
        borderBottom: last ? 'none' : `1px solid ${C.sep}`,
      }}
    >
      <span style={{ color: C.ink2, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{label}</p>
        {sub && <p style={{ fontSize: 12, color: C.ink2, marginTop: 1 }}>{sub}</p>}
      </div>
      {value
        ? <span style={{ fontSize: 13, color: C.ink2 }}>{value}</span>
        : onClick ? <ChevronRight size={16} color={C.ink3} /> : null}
    </button>
  );
}

function RowToggle({ icon, label, value, onChange, last }: {
  icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      borderBottom: last ? 'none' : `1px solid ${C.sep}`,
    }}>
      <span style={{ color: C.ink2, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <p style={{ flex: 1, fontSize: 14, fontWeight: 500, color: C.ink }}>{label}</p>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.50)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff', borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: 512, padding: 20,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{title}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, border: 'none', backgroundColor: C.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} color={C.ink2} />
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
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{label}</label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: `1px solid ${C.sep}`, borderRadius: 14,
        padding: '12px 16px', backgroundColor: C.bg,
      }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          style={{ flex: 1, fontSize: 15, color: C.ink, outline: 'none', backgroundColor: 'transparent', border: 'none' }}
        />
        {onToggle && (
          <button type="button" onClick={onToggle} style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: C.ink3, display: 'flex' }}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

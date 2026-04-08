'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, X, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF', sep: 'rgba(0,0,0,0.08)', green: '#10B981', red: '#EF4444' };

export default function AdminPage() {
  const router  = useRouter();
  const { user } = useUser();
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [saving, setSaving]           = useState(false);

  const [aiProvider, setAiProvider]     = useState('openai');
  const [openaiKey, setOpenaiKey]       = useState('');
  const [geminiKey, setGeminiKey]       = useState('');
  const [claudeKey, setClaudeKey]       = useState('');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  const [bunnyApiKey, setBunnyApiKey]   = useState('');
  const [bunnyLibraryId, setBunnyLibraryId] = useState('');

  useEffect(() => {
    if (!isAdmin) { router.replace('/home'); return; }
    loadStats();
    loadSettings();
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/courses`);
      setCourseCount(Array.isArray(res.data) ? res.data.length : 0);
    } catch { setCourseCount(0); }
  };

  const loadSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/settings`);
      setAiProvider(res.data.ai_provider || 'openai');
      setOpenaiKey(res.data.openai_key || '');
      setGeminiKey(res.data.gemini_key || '');
      setClaudeKey(res.data.claude_key || '');
      setElevenlabsKey(res.data.elevenlabs_key || '');
      setBunnyApiKey(res.data.bunny_api_key || '');
      setBunnyLibraryId(res.data.bunny_library_id || '');
    } catch {}
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await axios.put(`${API_URL}/api/admin/settings`, {
        ai_provider: aiProvider,
        openai_key: openaiKey || undefined,
        gemini_key: geminiKey || undefined,
        claude_key: claudeKey || undefined,
        elevenlabs_key: elevenlabsKey || undefined,
        bunny_api_key: bunnyApiKey || undefined,
        bunny_library_id: bunnyLibraryId || undefined,
      });
      toast.success('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      setShowModal(false);
    } catch {
      toast.error('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally { setSaving(false); }
  };

  const menuItems = [
    { id: 'courses',  emoji: '📚', title: 'จัดการคอร์ส',           desc: 'เพิ่ม แก้ไข และจัดการคอร์สทั้งหมด',      href: '/admin/courses' },
    { id: 'materials',emoji: '📄', title: 'เนื้อหาบทเรียน',          desc: 'อัปโหลดและจัดการเนื้อหา',               href: '/admin/materials' },
    { id: 'users',    emoji: '👥', title: 'ผู้ใช้งาน',               desc: 'ดูรายชื่อและสถานะผู้เรียน',             href: '/admin/users' },
    { id: 'bunny',    emoji: '🐰', title: 'Import from Bunny.net',   desc: 'สร้างบทเรียนจากวิดีโอใน Bunny',         href: '/admin/bunny-import' },
    { id: 'matcher',  emoji: '🎯', title: 'Bunny Matcher',           desc: 'จับคู่วิดีโอกับบทเรียนอัตโนมัติ',       href: '/admin/bunny-matcher' },
    { id: 'quiz',     emoji: '✨', title: 'สร้างแบบทดสอบด้วย AI',   desc: 'Generate quiz จากเนื้อหาบทเรียน',       href: '/admin/quiz-generator' },
    { id: 'settings', emoji: '⚙️', title: 'ตั้งค่าระบบ',             desc: 'AI keys, ElevenLabs และการตั้งค่าอื่นๆ', action: () => setShowModal(true) },
  ];

  if (!isAdmin) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>

      {/* Header */}
      <header style={{
        backgroundColor: '#fff', borderBottom: `1px solid ${C.sep}`,
        padding: '12px 20px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={22} color={C.brand} />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>แผงควบคุม</h1>
        </div>
        <button onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, border: 'none', backgroundColor: C.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={22} color={C.ink2} />
        </button>
      </header>

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '20px 20px 40px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div style={{ backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#6366F1' }}>{courseCount === null ? '...' : courseCount}</p>
            <p style={{ fontSize: 12, color: C.ink2, marginTop: 2, textAlign: 'center' }}>คอร์สทั้งหมด</p>
          </div>
          <div style={{ backgroundColor: '#FEF3C7', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 26 }}>✨</span>
            <p style={{ fontSize: 12, color: C.ink2, marginTop: 2, textAlign: 'center' }}>AI พร้อมใช้งาน</p>
          </div>
          <div style={{ backgroundColor: '#D1FAE5', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={28} color={C.green} />
            <p style={{ fontSize: 12, color: C.ink2, marginTop: 2, textAlign: 'center' }}>ระบบปกติ</p>
          </div>
        </div>

        {/* Menu */}
        <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 10 }}>เมนูจัดการ</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => item.action ? item.action() : router.push(item.href as any)}
              style={{
                backgroundColor: '#fff', borderRadius: 16,
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0px 1px 4px rgba(0,0,0,0.04)',
                padding: 16, display: 'flex', alignItems: 'center', gap: 12,
                textAlign: 'left', cursor: 'pointer', width: '100%',
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {item.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{item.title}</p>
                <p style={{ fontSize: 13, color: C.ink2 }}>{item.desc}</p>
              </div>
              <ChevronRight size={18} color={C.ink3} style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* API Status */}
        <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 10 }}>สถานะ API</p>
        <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0px 1px 4px rgba(0,0,0,0.04)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { ok: !!(openaiKey || geminiKey || claudeKey), label: `AI Provider (${aiProvider.toUpperCase()})` },
            { ok: !!elevenlabsKey, label: 'ElevenLabs TTS' },
            { ok: !!bunnyApiKey,   label: 'Bunny.net CDN' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {s.ok ? <CheckCircle2 size={18} color={C.green} /> : <XCircle size={18} color={C.red} />}
              <p style={{ fontSize: 14, color: C.ink2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.50)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 512, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.sep}`, flexShrink: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>ตั้งค่า API Keys</h2>
              <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: 16, border: 'none', backgroundColor: C.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color={C.ink2} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8 }}>AI Provider</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['openai', 'gemini', 'claude'].map(p => (
                    <button key={p} onClick={() => setAiProvider(p)} style={{
                      flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      border: `2px solid ${aiProvider === p ? C.brand : 'rgba(0,0,0,0.10)'}`,
                      backgroundColor: aiProvider === p ? 'rgba(239,94,168,0.08)' : 'transparent',
                      color: aiProvider === p ? C.brand : C.ink2,
                    }}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: 'OpenAI API Key',          value: openaiKey,      set: setOpenaiKey,      ph: 'sk-...' },
                { label: 'Google Gemini API Key',    value: geminiKey,      set: setGeminiKey,      ph: 'AIza...' },
                { label: 'Anthropic Claude API Key', value: claudeKey,      set: setClaudeKey,      ph: 'sk-ant-...' },
                { label: 'ElevenLabs API Key',       value: elevenlabsKey,  set: setElevenlabsKey,  ph: 'elevenlabs key' },
                { label: 'Bunny.net API Key',        value: bunnyApiKey,    set: setBunnyApiKey,    ph: 'bunny api key' },
                { label: 'Bunny.net Library ID',     value: bunnyLibraryId, set: setBunnyLibraryId, ph: 'library id', text: true },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.text ? 'text' : 'password'}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.ph}
                    autoCapitalize="none"
                    style={{ width: '100%', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: C.ink, outline: 'none', backgroundColor: C.bg, boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <button
                onClick={saveSettings}
                disabled={saving}
                style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px 0', borderRadius: 16, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, marginTop: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

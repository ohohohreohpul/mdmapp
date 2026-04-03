'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, X, BookOpen, FileText, Users, Rabbit, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

function InputField({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#374151] mb-1.5 mt-4">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#D1D5DB] rounded-xl px-3 py-3 text-[15px] text-text-primary focus:outline-none focus:border-primary"
        autoCapitalize="none"
      />
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Settings
  const [aiProvider, setAiProvider] = useState('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  const [bunnyApiKey, setBunnyApiKey] = useState('');
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
    } finally {
      setSaving(false);
    }
  };

  const menuCards = [
    { id: 'courses', emoji: '📚', title: 'จัดการคอร์ส', desc: 'เพิ่ม แก้ไข และจัดการคอร์สทั้งหมด', href: '/admin/courses' },
    { id: 'materials', emoji: '📄', title: 'เนื้อหาบทเรียน', desc: 'อัปโหลดและจัดการเนื้อหา', href: '/admin/materials' },
    { id: 'users', emoji: '👥', title: 'ผู้ใช้งาน', desc: 'ดูรายชื่อและสถานะผู้เรียน', href: '/admin/users' },
    { id: 'bunny', emoji: '🐰', title: 'Import from Bunny.net', desc: 'สร้างบทเรียนจากวิดีโอใน Bunny', href: '/admin/bunny-import' },
    { id: 'settings', emoji: '⚙️', title: 'ตั้งค่าระบบ', desc: 'AI keys, ElevenLabs และการตั้งค่าอื่นๆ', action: () => setShowModal(true) },
  ];

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Settings size={22} className="text-primary" />
          <h1 className="text-[18px] font-bold text-text-primary">แผงควบคุม</h1>
        </div>
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <X size={22} className="text-text-secondary" />
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#EEF2FF] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[72px]">
            <p className="text-[28px] font-bold text-[#6366F1]">{courseCount === null ? '...' : courseCount}</p>
            <p className="text-[12px] text-text-secondary mt-1 text-center">คอร์สทั้งหมด</p>
          </div>
          <div className="bg-[#FEF3C7] rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-2xl">✨</span>
            <p className="text-[12px] text-text-secondary mt-1 text-center">AI พร้อมใช้งาน</p>
          </div>
          <div className="bg-[#D1FAE5] rounded-2xl p-4 flex flex-col items-center justify-center">
            <CheckCircle2 size={28} className="text-[#10B981]" />
            <p className="text-[12px] text-text-secondary mt-1 text-center">ระบบปกติ</p>
          </div>
        </div>

        {/* Menu cards */}
        <p className="text-[14px] font-bold text-text-primary mb-3">เมนูจัดการ</p>
        <div className="flex flex-col gap-2 mb-6">
          {menuCards.map(card => (
            <button
              key={card.id}
              onClick={() => card.action ? card.action() : router.push(card.href as any)}
              className="bg-white rounded-2xl border border-separator p-4 flex items-center gap-3 text-left hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">{card.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-text-primary">{card.title}</p>
                <p className="text-[13px] text-text-secondary">{card.desc}</p>
              </div>
              <ChevronRight size={18} className="text-text-tertiary shrink-0" />
            </button>
          ))}
        </div>

        {/* API Status */}
        <p className="text-[14px] font-bold text-text-primary mb-3">สถานะ API</p>
        <div className="bg-white rounded-2xl border border-separator p-4 flex flex-col gap-3">
          {[
            { ok: !!(openaiKey || geminiKey || claudeKey), label: `AI Provider (${aiProvider.toUpperCase()})` },
            { ok: !!elevenlabsKey, label: 'ElevenLabs TTS' },
            { ok: !!bunnyApiKey, label: 'Bunny.net CDN' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {s.ok ? <CheckCircle2 size={18} className="text-[#10B981]" /> : <XCircle size={18} className="text-[#EF4444]" />}
              <p className="text-[14px] text-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-separator shrink-0">
              <h2 className="text-[18px] font-bold text-text-primary">ตั้งค่า API Keys</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <X size={22} className="text-text-secondary" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <label className="block text-[13px] font-semibold text-[#374151] mb-2">AI Provider</label>
              <div className="flex gap-2 mb-2">
                {['openai', 'gemini', 'claude'].map(p => (
                  <button
                    key={p}
                    onClick={() => setAiProvider(p)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-[13px] font-bold transition-colors ${aiProvider === p ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-text-secondary'}`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
              <InputField label="OpenAI API Key" value={openaiKey} onChange={setOpenaiKey} placeholder="sk-..." type="password" />
              <InputField label="Google Gemini API Key" value={geminiKey} onChange={setGeminiKey} placeholder="AIza..." type="password" />
              <InputField label="Anthropic Claude API Key" value={claudeKey} onChange={setClaudeKey} placeholder="sk-ant-..." type="password" />
              <InputField label="ElevenLabs API Key" value={elevenlabsKey} onChange={setElevenlabsKey} placeholder="elevenlabs key" type="password" />
              <InputField label="Bunny.net API Key" value={bunnyApiKey} onChange={setBunnyApiKey} placeholder="bunny api key" type="password" />
              <InputField label="Bunny.net Library ID" value={bunnyLibraryId} onChange={setBunnyLibraryId} placeholder="library id" />
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl mt-6 mb-2 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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

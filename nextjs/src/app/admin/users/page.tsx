'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const AVATAR_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? users.filter(u => (u.display_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) : users);
  }, [search, users]);

  const loadUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`);
      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data); setFiltered(data);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="flex-1 text-[18px] font-bold text-text-primary">ผู้ใช้งาน</h1>
        <span className="bg-[#FEF3C7] text-[#F59E0B] text-[13px] font-bold px-3 py-1 rounded-full">{users.length}</span>
      </header>

      <div className="px-4 py-3 bg-white border-b border-separator sticky top-[60px] z-10">
        <div className="flex items-center gap-2 border border-separator rounded-xl px-3 py-2.5 bg-ios-bg">
          <Search size={17} className="text-text-tertiary shrink-0" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรืออีเมล..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[15px] text-text-primary outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={16} className="text-text-tertiary" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-3 pb-10">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <p className="text-text-secondary">ไม่พบผู้ใช้งาน</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(u => {
              const name = u.display_name || u.email || '?';
              const initials = name.slice(0, 2).toUpperCase();
              const isAdmin = u.role === 'admin';
              return (
                <button
                  key={u.id || u._id}
                  onClick={() => setSelected(u)}
                  className="bg-white rounded-2xl border border-separator p-4 flex items-center gap-3 text-left hover:border-primary/30 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[16px] shrink-0" style={{ backgroundColor: avatarColor(name) }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[15px] font-semibold text-text-primary truncate">{name}</p>
                      {isAdmin && <span className="bg-[#EEF2FF] text-[#6366F1] text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0">Admin</span>}
                    </div>
                    <p className="text-[13px] text-text-secondary truncate">{u.email || '—'}</p>
                  </div>
                  <p className="text-[11px] text-text-tertiary shrink-0">{formatDate(u.created_at)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-separator">
              <h2 className="text-[18px] font-bold text-text-primary">ข้อมูลผู้ใช้</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="px-5 py-5 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3" style={{ backgroundColor: avatarColor(selected.display_name || selected.email || '?') }}>
                {(selected.display_name || selected.email || '?').slice(0, 2).toUpperCase()}
              </div>
              <p className="text-[22px] font-bold text-text-primary mb-1">{selected.display_name || '—'}</p>
              {selected.role === 'admin' && <span className="bg-[#EEF2FF] text-[#6366F1] text-[11px] font-bold px-3 py-1 rounded-full mb-3">Admin</span>}
              <div className="w-full mt-2 flex flex-col divide-y divide-separator">
                {[
                  { icon: '✉️', label: selected.email || '—' },
                  { icon: '📅', label: `สมัครเมื่อ ${formatDate(selected.created_at)}` },
                  { icon: '👤', label: `Role: ${selected.role || 'user'}` },
                  selected.career_path && { icon: '💼', label: selected.career_path },
                ].filter(Boolean).map((row: any, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <span className="text-[18px]">{row.icon}</span>
                    <p className="text-[14px] text-text-secondary">{row.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-8" />
          </div>
        </div>
      )}
    </div>
  );
}

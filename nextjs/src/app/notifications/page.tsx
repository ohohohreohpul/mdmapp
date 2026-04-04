'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Megaphone, Trophy, BookOpen, Settings, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  announcement: { icon: <Megaphone size={20} />, color: '#EF5EA8', bg: '#FDF2F8' },
  achievement:  { icon: <Trophy size={20} />,    color: '#F59E0B', bg: '#FFFBEB' },
  course:       { icon: <BookOpen size={20} />,  color: '#6366F1', bg: '#EEF2FF' },
  system:       { icon: <Settings size={20} />,  color: '#6B7280', bg: '#F3F4F6' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  const LAST_SEEN_KEY = `notif_last_seen_${user?._id || 'guest'}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLastSeen(localStorage.getItem(LAST_SEEN_KEY));
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    }
    loadNotifs();
  }, [user?._id]);

  const loadNotifs = async () => {
    try {
      const params = user?._id ? { user_id: user._id } : {};
      const res = await axios.get(`${API_URL}/api/notifications`, { params });
      setNotifs(res.data || []);
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  const isUnread = (n: any) => !lastSeen || new Date(n.created_at) > new Date(lastSeen);

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ios-bg transition-colors">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="text-[17px] font-bold text-text-primary">การแจ้งเตือน</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto pb-10">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 gap-3 px-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Megaphone size={32} className="text-primary" />
            </div>
            <p className="font-bold text-text-primary">ยังไม่มีการแจ้งเตือน</p>
            <p className="text-sm text-text-secondary">การแจ้งเตือนใหม่จะปรากฏที่นี่</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifs.map((notif, i) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.announcement;
              const unread = isUnread(notif);
              return (
                <button
                  key={notif._id || i}
                  onClick={() => notif.action_url && router.push(notif.action_url)}
                  className={`flex items-start gap-3 px-4 py-4 border-b border-separator/60 text-left transition-colors ${unread ? 'bg-primary/[0.04]' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[14px] font-bold text-text-primary truncate">{notif.title}</p>
                      {unread && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                    </div>
                    <p className="text-[13px] text-text-secondary leading-snug line-clamp-3">{notif.body}</p>
                    <p className="text-[11px] text-text-tertiary mt-1">{timeAgo(notif.created_at)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

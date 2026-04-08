'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Trophy, BookOpen, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Spinner, EmptyState } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const C = { ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', brand: '#ef5ea8', bg: '#F2F2F7', surface: '#FFFFFF' };

const TYPE_CFG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  announcement: { icon: <Megaphone size={20} />, color: '#e8409b', bg: '#FDF2F8' },
  achievement:  { icon: <Trophy size={20} />,    color: '#F59E0B', bg: '#FFFBEB' },
  course:       { icon: <BookOpen size={20} />,  color: '#6366F1', bg: '#EEF2FF' },
  system:       { icon: <Settings size={20} />,  color: '#6B7280', bg: '#F3F4F6' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'เมื่อกี้';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days} วันที่แล้ว`;
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [notifs, setNotifs]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
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
    } catch { setNotifs([]); }
    finally   { setLoading(false); }
  };

  const isUnread = (n: any) => !lastSeen || new Date(n.created_at) > new Date(lastSeen);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <NavHeader title="การแจ้งเตือน" />

      <div style={{ maxWidth: 512, margin: '0 auto', paddingBottom: 80 }}>
        {loading ? (
          <Spinner />
        ) : notifs.length === 0 ? (
          <EmptyState icon={Megaphone} title="ยังไม่มีการแจ้งเตือน" body="การแจ้งเตือนใหม่จะปรากฏที่นี่" />
        ) : (
          <div>
            {notifs.map((notif, i) => {
              const cfg    = TYPE_CFG[notif.type] || TYPE_CFG.announcement;
              const unread = isUnread(notif);
              return (
                <button
                  key={notif._id || i}
                  onClick={() => notif.action_url && router.push(notif.action_url)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '16px 20px', border: 'none', textAlign: 'left',
                    borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer',
                    backgroundColor: unread ? 'rgba(239,94,168,0.04)' : C.surface,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                    backgroundColor: cfg.bg, color: cfg.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {notif.title}
                      </p>
                      {unread && <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.brand, flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {notif.body}
                    </p>
                    <p style={{ fontSize: 11, color: C.ink3, marginTop: 4 }}>{timeAgo(notif.created_at)}</p>
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

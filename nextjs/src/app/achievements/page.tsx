'use client';

import { useState, useEffect } from 'react';
import { Flame, Trophy, Star, Lock } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, Spinner, ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF' };
const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

const BADGE_ICON_MAP: Record<string, { emoji: string; color: string }> = {
  first_lesson: { emoji: '🚩', color: '#6366F1' },
  streak_3:     { emoji: '🔥', color: '#F59E0B' },
  streak_7:     { emoji: '💪', color: '#EF4444' },
  streak_30:    { emoji: '👑', color: '#7C3AED' },
  perfect_quiz: { emoji: '⭐', color: '#F59E0B' },
  first_course: { emoji: '🏫', color: '#10B981' },
  xp_1000:      { emoji: '⚡', color: '#F59E0B' },
  level_5:      { emoji: '🏆', color: '#10B981' },
  level_10:     { emoji: '💎', color: '#06B6D4' },
};

interface LevelInfo { level: number; xp_for_next: number | null; xp_in_level: number; xp_needed: number; progress_percent: number; }
interface Dashboard  { xp_total: number; level_info: LevelInfo; current_streak: number; longest_streak: number; badges: Array<{ id: string; name: string; description: string }>; }

export default function AchievementsPage() {
  const { user } = useUser();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { load(); }, [user?._id]);

  const load = async () => {
    setLoading(true);
    try {
      const [badgesRes, dashRes] = await Promise.all([
        axios.get(`${API_URL}/api/gamification/badges`),
        user?._id ? axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`) : Promise.resolve({ data: null }),
      ]);
      setAllBadges(badgesRes.data || []);
      setDashboard(dashRes.data);
    } catch {} finally { setLoading(false); }
  };

  const earnedIds = new Set((dashboard?.badges || []).map((b: any) => b.id));
  const badges = allBadges.map(b => ({
    ...b,
    earned: earnedIds.has(b.id),
    iconInfo: BADGE_ICON_MAP[b.id] || { emoji: '🎖️', color: '#e8409b' },
  }));
  const li = dashboard?.level_info;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <NavHeader title="ความสำเร็จ" />

      <div style={{ maxWidth: 512, margin: '0 auto', padding: '20px 20px 80px' }}>
        {loading ? <Spinner /> : (
          <>
            {/* Level card */}
            <div style={{ backgroundColor: C.brand, borderRadius: 16, padding: '20px 20px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13 }}>Level</p>
                <p style={{ color: '#fff', fontSize: 42, fontWeight: 800, lineHeight: 1 }}>{li?.level ?? 1}</p>
              </div>
              <div style={{ flex: 1 }}>
                {li?.xp_for_next ? (
                  <>
                    <p style={{ color: '#fff', fontSize: 13, marginBottom: 8 }}>
                      {li.xp_in_level} / {li.xp_needed} XP ไปถึง Lv.{(li.level ?? 1) + 1}
                    </p>
                    <div style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.30)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: '#fff', borderRadius: 4, width: `${li.progress_percent}%` }} />
                    </div>
                  </>
                ) : (
                  <p style={{ color: '#fff', fontSize: 14 }}>สูงสุดแล้ว! 🎉 {dashboard?.xp_total ?? 0} XP รวม</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ ...card, display: 'flex', overflow: 'hidden', marginBottom: 20 }}>
              {[
                { icon: <Flame  size={24} color="#F59E0B" />, value: dashboard?.current_streak ?? 0, label: 'Streak' },
                { icon: <Trophy size={24} color="#10B981" />, value: earnedIds.size,                  label: 'Badges' },
                { icon: <Star   size={24} color="#6366F1" />, value: dashboard?.xp_total ?? 0,        label: 'XP' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', borderRight: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  {s.icon}
                  <p style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginTop: 4, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: C.ink3, marginTop: 3 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Badges */}
            <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
              Badges ({earnedIds.size}/{badges.length})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {badges.map(badge => (
                <div key={badge.id} style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', opacity: badge.earned ? 1 : 0.5 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, backgroundColor: badge.earned ? `${badge.iconInfo.color}20` : '#f3f3f8' }}>
                    {badge.iconInfo.emoji}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', color: badge.earned ? C.ink : C.ink3 }}>
                    {badge.name}
                  </p>
                  <p style={{ fontSize: 11, color: C.ink2, textAlign: 'center', lineHeight: 1.4 }}>{badge.description}</p>
                  {!badge.earned && (
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <Lock size={14} color={C.ink3} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(dashboard?.longest_streak ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                <Flame size={16} color="#F59E0B" />
                <p style={{ fontSize: 13, color: C.ink2 }}>Streak ยาวที่สุด: {dashboard?.longest_streak} วัน</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

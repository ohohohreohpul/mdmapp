'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flame, Trophy, Star, Lock, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

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

interface LevelInfo {
  level: number;
  xp_for_next: number | null;
  xp_in_level: number;
  xp_needed: number;
  progress_percent: number;
}

interface Dashboard {
  xp_total: number;
  level_info: LevelInfo;
  current_streak: number;
  longest_streak: number;
  badges: Array<{ id: string; name: string; description: string }>;
}

export default function AchievementsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [user?._id]);

  const load = async () => {
    setLoading(true);
    try {
      const [badgesRes, dashRes] = await Promise.all([
        axios.get(`${API_URL}/api/gamification/badges`),
        user?._id
          ? axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`)
          : Promise.resolve({ data: null }),
      ]);
      setAllBadges(badgesRes.data || []);
      setDashboard(dashRes.data);
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  };

  const earnedIds = new Set((dashboard?.badges || []).map((b: any) => b.id));

  const badges = allBadges.map(b => ({
    ...b,
    earned: earnedIds.has(b.id),
    iconInfo: BADGE_ICON_MAP[b.id] || { emoji: '🎖️', color: '#EF5EA8' },
  }));

  const li = dashboard?.level_info;

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="text-[17px] font-bold text-text-primary">ความสำเร็จ</h1>
        <div className="w-11" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Level card */}
            <div className="bg-primary rounded-2xl p-5 flex items-center gap-5 mb-4">
              <div className="text-center shrink-0">
                <p className="text-white/70 text-[13px]">Level</p>
                <p className="text-white text-[42px] font-extrabold leading-none">{li?.level ?? 1}</p>
              </div>
              <div className="flex-1">
                {li?.xp_for_next ? (
                  <>
                    <p className="text-white text-[13px] mb-2">
                      {li.xp_in_level} / {li.xp_needed} XP ไปถึง Lv.{(li.level ?? 1) + 1}
                    </p>
                    <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${li.progress_percent}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-white text-[14px]">สูงสุดแล้ว! 🎉  {dashboard?.xp_total ?? 0} XP รวม</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: <Flame size={28} className="text-[#F59E0B]" />, value: dashboard?.current_streak ?? 0, label: 'Streak' },
                { icon: <Trophy size={28} className="text-[#10B981]" />, value: earnedIds.size, label: 'Badges' },
                { icon: <Star size={28} className="text-[#6366F1]" />, value: dashboard?.xp_total ?? 0, label: 'XP' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-separator p-4 flex flex-col items-center gap-1">
                  {s.icon}
                  <p className="text-[22px] font-extrabold text-text-primary">{s.value}</p>
                  <p className="text-[12px] text-text-secondary">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Badges */}
            <p className="text-[14px] font-semibold text-text-primary mb-3">
              Badges ({earnedIds.size}/{badges.length})
            </p>
            <div className="grid grid-cols-2 gap-3">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`bg-white rounded-2xl border border-separator p-4 flex flex-col items-center gap-2 relative ${!badge.earned ? 'opacity-50' : ''}`}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: badge.earned ? `${badge.iconInfo.color}20` : '#F3F4F6' }}
                  >
                    {badge.iconInfo.emoji}
                  </div>
                  <p className={`text-[13px] font-bold text-center ${badge.earned ? 'text-text-primary' : 'text-text-tertiary'}`}>
                    {badge.name}
                  </p>
                  <p className="text-[11px] text-text-secondary text-center leading-snug">{badge.description}</p>
                  {!badge.earned && (
                    <div className="absolute top-2 right-2">
                      <Lock size={14} className="text-text-tertiary" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Longest streak */}
            {(dashboard?.longest_streak ?? 0) > 0 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Flame size={16} className="text-[#F59E0B]" />
                <p className="text-[13px] text-text-secondary">Streak ยาวที่สุด: {dashboard?.longest_streak} วัน</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

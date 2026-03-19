import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { COLORS } from '../constants/theme';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// All possible badges from the backend — with their icon mapping
const BADGE_ICON_MAP: Record<string, { icon: string; color: string }> = {
  first_lesson: { icon: 'flag',            color: '#6366F1' },
  streak_3:     { icon: 'flame',           color: '#F59E0B' },
  streak_7:     { icon: 'barbell',         color: '#EF4444' },
  streak_30:    { icon: 'crown',           color: '#7C3AED' },
  perfect_quiz: { icon: 'star',            color: '#F59E0B' },
  first_course: { icon: 'school',          color: '#10B981' },
  xp_1000:      { icon: 'flash',           color: '#F59E0B' },
  level_5:      { icon: 'trophy',          color: '#10B981' },
  level_10:     { icon: 'diamond',         color: '#06B6D4' },
};

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned?: boolean;
  earned_at?: string;
}

interface Dashboard {
  xp_total: number;
  level_info: { level: number; xp_for_next: number | null; xp_in_level: number; xp_needed: number; progress_percent: number };
  current_streak: number;
  longest_streak: number;
  badges: Badge[];
}

export default function Achievements() {
  const router = useRouter();
  const { user } = useUser();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [allBadges, setAllBadges]   = useState<Badge[]>([]);
  const [loading, setLoading]       = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [badgesRes, dashRes] = await Promise.all([
          axios.get(`${API_URL}/api/gamification/badges`),
          user?._id
            ? axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`)
            : Promise.resolve({ data: null }),
        ]);
        if (!active) return;
        setAllBadges(badgesRes.data || []);
        setDashboard(dashRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user?._id]));

  const earnedIds = new Set((dashboard?.badges || []).map((b: any) => b.id));

  // Merge: all badges with earned flag
  const badges = allBadges.map(b => ({
    ...b,
    earned: earnedIds.has(b.id),
    iconInfo: BADGE_ICON_MAP[b.id] || { icon: 'ribbon', color: COLORS.primary },
  }));

  const li = dashboard?.level_info;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ความสำเร็จ</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Level Card */}
          <View style={styles.levelCard}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelLabel}>Level</Text>
              <Text style={styles.levelNumber}>{li?.level ?? 1}</Text>
            </View>
            <View style={styles.xpInfo}>
              {li?.xp_for_next ? (
                <>
                  <Text style={styles.xpText}>
                    {li.xp_in_level} / {li.xp_needed} XP ไปถึง Lv.{(li.level ?? 1) + 1}
                  </Text>
                  <View style={styles.xpBar}>
                    <View style={[styles.xpFill, { width: `${li.progress_percent}%` as any }]} />
                  </View>
                </>
              ) : (
                <Text style={styles.xpText}>สูงสุดแล้ว! 🎉  {dashboard?.xp_total ?? 0} XP รวม</Text>
              )}
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={28} color="#F59E0B" />
              <Text style={styles.statNumber}>{dashboard?.current_streak ?? 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={28} color="#10B981" />
              <Text style={styles.statNumber}>{earnedIds.size}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={28} color="#6366F1" />
              <Text style={styles.statNumber}>{dashboard?.xp_total ?? 0}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
          </View>

          {/* Badges */}
          <Text style={styles.sectionTitle}>
            Badges ({earnedIds.size}/{badges.length})
          </Text>
          <View style={styles.badgesGrid}>
            {badges.map(badge => (
              <View
                key={badge.id}
                style={[styles.badgeCard, !badge.earned && styles.badgeLocked]}
              >
                <View style={[
                  styles.badgeIcon,
                  { backgroundColor: badge.earned ? badge.iconInfo.color : '#E5E5E5' },
                ]}>
                  <Ionicons name={badge.iconInfo.icon as any} size={28} color="#FFF" />
                </View>
                <Text style={[styles.badgeTitle, !badge.earned && styles.badgeTitleLocked]}>
                  {badge.name}
                </Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
                {!badge.earned && (
                  <View style={styles.lockIcon}>
                    <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Longest streak note */}
          {(dashboard?.longest_streak ?? 0) > 0 && (
            <View style={styles.recordRow}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.recordText}>
                Streak ยาวที่สุด: {dashboard?.longest_streak} วัน
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  levelCard: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelInfo: {
    alignItems: 'center',
    marginRight: 20,
  },
  levelLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  levelNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  xpInfo: {
    flex: 1,
  },
  xpText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 8,
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    position: 'relative',
  },
  badgeLocked: {
    opacity: 0.55,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  badgeTitleLocked: {
    color: '#9CA3AF',
  },
  badgeDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  lockIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    justifyContent: 'center',
  },
  recordText: {
    fontSize: 13,
    color: '#6B7280',
  },
});

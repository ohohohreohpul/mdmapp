import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

export default function Achievements() {
  const router = useRouter();

  const achievements = [
    { id: '1', icon: 'flame', title: '7 วัน Streak', description: 'เรียนต่อเนื่อง 7 วัน', unlocked: true, color: '#F59E0B' },
    { id: '2', icon: 'school', title: 'นักเรียนใหม่', description: 'เริ่มเรียนคอร์สแรก', unlocked: true, color: '#6366F1' },
    { id: '3', icon: 'checkmark-done', title: 'เรียนจบแล้ว', description: 'เรียนจบคอร์สแรก', unlocked: true, color: '#10B981' },
    { id: '4', icon: 'ribbon', title: 'นักสะสม', description: 'ได้รับใบประกาศ 5 ใบ', unlocked: false, color: COLORS.primary },
    { id: '5', icon: 'star', title: 'ดาวเด่น', description: 'สอบได้คะแนนเต็ม', unlocked: false, color: '#F59E0B' },
    { id: '6', icon: 'trophy', title: 'แชมป์', description: 'เรียนจบทุกคอร์ส', unlocked: false, color: '#10B981' },
  ];

  const stats = {
    totalXP: 1250,
    level: 5,
    nextLevelXP: 2000,
    streak: 3,
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ความสำเร็จ</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Level</Text>
            <Text style={styles.levelNumber}>{stats.level}</Text>
          </View>
          <View style={styles.xpInfo}>
            <Text style={styles.xpText}>{stats.totalXP} / {stats.nextLevelXP} XP</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${(stats.totalXP / stats.nextLevelXP) * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={28} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={28} color="#10B981" />
            <Text style={styles.statNumber}>{achievements.filter(a => a.unlocked).length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={28} color="#6366F1" />
            <Text style={styles.statNumber}>{stats.totalXP}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>

        {/* Badges */}
        <Text style={styles.sectionTitle}>Badges</Text>
        <View style={styles.badgesGrid}>
          {achievements.map((badge) => (
            <View 
              key={badge.id} 
              style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}
            >
              <View style={[styles.badgeIcon, { backgroundColor: badge.unlocked ? badge.color : '#E5E5E5' }]}>
                <Ionicons name={badge.icon as any} size={28} color="#FFF" />
              </View>
              <Text style={[styles.badgeTitle, !badge.unlocked && styles.badgeTitleLocked]}>
                {badge.title}
              </Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
              {!badge.unlocked && (
                <View style={styles.lockIcon}>
                  <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    opacity: 0.6,
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
});
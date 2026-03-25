import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '../../contexts/UserContext';
import { COLORS } from '../../constants/theme';

const ADMIN_EMAILS = ['jiranan@mydemy.co'];
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface GamDashboard {
  xp_total: number;
  level_info: { level: number };
  current_streak: number;
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useUser();
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());
  const [gam, setGam] = useState<GamDashboard | null>(null);

  useFocusEffect(useCallback(() => {
    if (user?._id) {
      axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`)
        .then(r => setGam(r.data))
        .catch(() => {});
    }
  }, [user?._id]));

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  // Guest view
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={{ height: insets.top, backgroundColor: COLORS.primary }} />
        <View style={styles.guestHeader}>
          <Text style={styles.headerTitle}>โปรไฟล์</Text>
        </View>
        <View style={styles.guestContent}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.guestTitle}>เข้าสู่ระบบ</Text>
          <Text style={styles.guestText}>
            เข้าสู่ระบบเพื่อบันทึกความคืบหน้า{'\n'}ดูคะแนน และรับใบประกาศนียบัตร
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Logged in view
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Pink Header */}
      <View style={styles.profileHeader}>
        <View style={{ height: insets.top }} />
          {/* Avatar */}
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          
          {/* Name & Email */}
          <Text style={styles.userName}>{user.display_name || user.username || 'User'}</Text>
          <Text style={styles.userEmail}>{user.email || 'email@example.com'}</Text>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {gam?.xp_total ?? 0}
              </Text>
              <Text style={styles.statLabel}>⚡ XP</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                Lv.{gam?.level_info?.level ?? 1}
              </Text>
              <Text style={styles.statLabel}>👑 ระดับ</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {gam?.current_streak ?? 0}
              </Text>
              <Text style={styles.statLabel}>🔥 Streak</Text>
            </View>
          </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Learning Section */}
        <Text style={styles.sectionTitle}>การเรียนรู้</Text>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/certificates')}
        >
          <View style={[styles.menuIcon, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="ribbon" size={22} color="#FFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>ใบประกาศนียบัตร</Text>
            <Text style={styles.menuSubtitle}>ดาวน์โหลดใบประกาศ</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/achievements')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#10B981' }]}>
            <Ionicons name="trophy" size={22} color="#FFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>ความสำเร็จ</Text>
            <Text style={styles.menuSubtitle}>ดู badges และ achievements</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/saved')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="bookmark" size={22} color="#FFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>บันทึกไว้</Text>
            <Text style={styles.menuSubtitle}>คอร์สที่บันทึกไว้</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        {/* Career Section */}
        <Text style={styles.sectionTitle}>อาชีพ</Text>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => router.push('/resume' as any)}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="document-text" size={22} color="#FFF" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Resume & Career</Text>
            <Text style={styles.menuSubtitle}>จัดการ Resume และ Cover Letter</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>การตั้งค่า</Text>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/settings')}
        >
          <View style={styles.menuIconGray}>
            <Ionicons name="settings-outline" size={22} color="#666" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>การตั้งค่า</Text>
            <Text style={styles.menuSubtitle}>การแจ้งเตือน, ภาษา</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuCard}
          onPress={() => router.push('/help')}
        >
          <View style={styles.menuIconGray}>
            <Ionicons name="help-circle-outline" size={22} color="#666" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>ช่วยเหลือ</Text>
            <Text style={styles.menuSubtitle}>FAQ และติดต่อเรา</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/admin')}
          >
            <View style={styles.menuIconGray}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#666" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Admin Panel</Text>
              <Text style={styles.menuSubtitle}>จัดการคอร์สและระบบ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        )}

        {/* Ko-fi support */}
        <TouchableOpacity
          style={styles.kofiCard}
          onPress={() => Linking.openURL('https://ko-fi.com/J3J11WBY0S')}
          activeOpacity={0.82}
        >
          <Text style={styles.kofiEmoji}>☕</Text>
          <View style={styles.kofiBody}>
            <Text style={styles.kofiTitle}>ช่วยซัพพอร์ต mydemy</Text>
            <Text style={styles.kofiSub}>ซื้อกาแฟให้ทีมพัฒนาสักแก้ว 🩷</Text>
          </View>
          <View style={styles.kofiBadge}>
            <Text style={styles.kofiBadgeText}>Ko-fi</Text>
          </View>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  safeArea: {
    backgroundColor: COLORS.primary,
  },
  guestHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  guestContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  guestAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  guestText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingBottom: 24,
  },
  avatarRow: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconGray: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  kofiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F9',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  kofiEmoji: {
    fontSize: 32,
  },
  kofiBody: {
    flex: 1,
  },
  kofiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9D174D',
  },
  kofiSub: {
    fontSize: 12,
    color: '#BE185D',
    marginTop: 2,
  },
  kofiBadge: {
    backgroundColor: '#ef5ea8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  kofiBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

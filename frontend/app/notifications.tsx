import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { COLORS } from '../constants/theme';
import { useUser } from '../contexts/UserContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  announcement: { icon: 'megaphone',        color: '#EF5EA8', bg: '#FDF2F8' },
  achievement:  { icon: 'trophy',           color: '#F59E0B', bg: '#FFFBEB' },
  course:       { icon: 'book',             color: '#6366F1', bg: '#EEF2FF' },
  system:       { icon: 'settings',         color: '#6B7280', bg: '#F3F4F6' },
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

export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  const LAST_SEEN_KEY = `notif_last_seen_${user?._id || 'guest'}`;

  const loadNotifications = useCallback(async () => {
    try {
      const params = user?._id ? { user_id: user._id } : {};
      const res = await axios.get(`${API_URL}/api/notifications`, { params });
      setNotifications(res.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => {
    // Load last-seen timestamp to show unread indicators
    AsyncStorage.getItem(LAST_SEEN_KEY).then(val => setLastSeen(val));
    loadNotifications();
  }, []);

  useEffect(() => {
    // Mark all as seen when page is opened
    const now = new Date().toISOString();
    AsyncStorage.setItem(LAST_SEEN_KEY, now);
  }, []);

  const isUnread = (notif: any) => {
    if (!lastSeen) return true;
    return new Date(notif.created_at) > new Date(lastSeen);
  };

  const handlePress = (notif: any) => {
    if (notif.action_url) router.push(notif.action_url);
  };

  const renderItem = ({ item }: { item: any }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.announcement;
    const unread = isUnread(item);

    return (
      <TouchableOpacity
        style={[styles.item, unread && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={item.action_url ? 0.7 : 1}
      >
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            {unread && <View style={styles.dot} />}
          </View>
          <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
        {item.action_url && (
          <Ionicons name="chevron-forward" size={16} color="#CCC" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>การแจ้งเตือน</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id || item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} tintColor={COLORS.primary} />
          }
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={56} color="#DDD" />
              <Text style={styles.emptyTitle}>ยังไม่มีการแจ้งเตือน</Text>
              <Text style={styles.emptySubtitle}>เราจะแจ้งเตือนเมื่อมีข่าวสารหรืออัปเดตใหม่</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#1A1A2E' },

  listContent: { paddingVertical: 8 },

  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemUnread: { backgroundColor: '#FDFAFF' },

  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },

  content: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  body: { fontSize: 13, color: '#555', lineHeight: 18 },
  time: { fontSize: 11, color: '#AAA', marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', gap: 8, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#888', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#AAA', textAlign: 'center', lineHeight: 20 },
});

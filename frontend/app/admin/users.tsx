import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const AVATAR_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? users.filter(
            (u) =>
              (u.display_name || '').toLowerCase().includes(q) ||
              (u.email || '').toLowerCase().includes(q)
          )
        : users
    );
  }, [search, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/users`);
      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data);
      setFiltered(data);
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }: { item: any }) => {
    const name = item.display_name || item.email || '?';
    const initials = name.slice(0, 2).toUpperCase();
    const isAdmin = item.role === 'admin';

    return (
      <TouchableOpacity style={styles.userRow} onPress={() => setSelected(item)} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(name) }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {name}
            </Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email || '—'}
          </Text>
        </View>
        <Text style={styles.joinDate}>{formatDate(item.created_at)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ผู้ใช้งาน</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{users.length}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={COLORS.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาชื่อหรืออีเมล..."
          placeholderTextColor={COLORS.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>ไม่พบผู้ใช้งาน</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ข้อมูลผู้ใช้</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {selected && (
              <View style={styles.modalBody}>
                {/* Big avatar */}
                <View
                  style={[
                    styles.avatarLarge,
                    { backgroundColor: avatarColor(selected.display_name || selected.email || '?') },
                  ]}
                >
                  <Text style={styles.avatarLargeText}>
                    {(selected.display_name || selected.email || '?').slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.detailName}>{selected.display_name || '—'}</Text>
                {selected.role === 'admin' && (
                  <View style={[styles.adminBadge, { alignSelf: 'center', marginBottom: SPACING.sm }]}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.textTertiary} />
                  <Text style={styles.detailValue}>{selected.email || '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.textTertiary} />
                  <Text style={styles.detailValue}>
                    สมัครเมื่อ {formatDate(selected.created_at)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textTertiary} />
                  <Text style={styles.detailValue}>Role: {selected.role || 'user'}</Text>
                </View>
                {selected.career_path && (
                  <View style={styles.detailRow}>
                    <Ionicons name="briefcase-outline" size={18} color={COLORS.textTertiary} />
                    <Text style={styles.detailValue}>{selected.career_path}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerSafe: {
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: SPACING.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.small,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  userRow: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  adminBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  joinDate: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginLeft: SPACING.sm,
    flexShrink: 0,
  },
  separator: {
    height: SPACING.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalBody: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarLargeText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'stretch',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
  },
});

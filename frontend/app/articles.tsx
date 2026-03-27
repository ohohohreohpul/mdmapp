import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

const ARTICLES = [
  { id: '1', title: 'UX Writing คืออะไร? ทำไมทุกแบรนด์ถึงต้องการคนเขียน UX', category: 'UX Writing', read_time: 5, cover_emoji: '✍️', cover_color: '#E91E8C' },
  { id: '2', title: '7 หลักการ UX Design ที่ทำให้แอปติดใจผู้ใช้ตั้งแต่วินาทีแรก', category: 'UX Design', read_time: 6, cover_emoji: '🎨', cover_color: '#7C3AED' },
  { id: '3', title: 'เริ่มใช้ Figma ตั้งแต่ศูนย์: เส้นทางสู่นักออกแบบมืออาชีพ', category: 'Tools', read_time: 7, cover_emoji: '🖌️', cover_color: '#0EA5E9' },
  { id: '4', title: 'Prototype คืออะไร? ทดสอบงานก่อนโค้ดจริงประหยัดเวลาได้แค่ไหน', category: 'UX Design', read_time: 5, cover_emoji: '🧪', cover_color: '#059669' },
  { id: '5', title: 'Portfolio UX ที่ดีต้องมีอะไรบ้าง? เคล็ดลับจากนักออกแบบที่ได้งาน', category: 'Career', read_time: 8, cover_emoji: '💼', cover_color: '#D97706' },
  { id: '6', title: 'Microcopy: คำเล็กๆ ที่เปลี่ยน Conversion Rate ของเว็บได้จริง', category: 'UX Writing', read_time: 4, cover_emoji: '💬', cover_color: '#E91E8C' },
  { id: '7', title: 'User Research ง่ายๆ ที่ทำได้เองโดยไม่ต้องมีทีมใหญ่', category: 'Research', read_time: 6, cover_emoji: '🔍', cover_color: '#DC2626' },
  { id: '8', title: 'Design System คืออะไร? ทำไม Figma ถึงเป็นเครื่องมือที่ทีมเลือกใช้', category: 'Tools', read_time: 5, cover_emoji: '🧩', cover_color: '#7C3AED' },
];

const CATEGORIES = ['ทั้งหมด', 'UX Design', 'UX Writing', 'Career', 'Tools', 'Research'];

const CATEGORY_COLORS: Record<string, string> = {
  'UX Design':  '#7C3AED',
  'UX Writing': '#E91E8C',
  'Career':     '#D97706',
  'Tools':      '#0EA5E9',
  'Research':   '#DC2626',
};

export default function ArticlesPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selectedCat, setSelectedCat] = useState('ทั้งหมด');

  const filtered = selectedCat === 'ทั้งหมด'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === selectedCat);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รวมเคล็ดลับ & บทความ</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
          style={styles.catRow}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={[styles.catText, selectedCat === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Article count */}
        <Text style={styles.countText}>{filtered.length} บทความ</Text>

        {/* Articles list */}
        <View style={styles.list}>
          {filtered.map(article => (
            <TouchableOpacity
              key={article.id}
              style={styles.card}
              onPress={() => router.push(`/blog?id=${article.id}`)}
              activeOpacity={0.85}
            >
              {/* Cover */}
              <View style={[styles.cover, { backgroundColor: article.cover_color + '20' }]}>
                <Text style={styles.coverEmoji}>{article.cover_emoji}</Text>
              </View>

              {/* Info */}
              <View style={styles.info}>
                <View style={[styles.catTag, { backgroundColor: (CATEGORY_COLORS[article.category] || COLORS.primary) + '15' }]}>
                  <Text style={[styles.catTagText, { color: CATEGORY_COLORS[article.category] || COLORS.primary }]}>
                    {article.category}
                  </Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
                <View style={styles.meta}>
                  <Ionicons name="time-outline" size={12} color="#AAA" />
                  <Text style={styles.metaText}>{article.read_time} นาที</Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  catRow: { backgroundColor: '#FFFFFF' },
  catScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F0F0F0',
  },
  catChipActive: { backgroundColor: COLORS.primary },
  catText: { fontSize: 13, fontWeight: '600', color: '#666' },
  catTextActive: { color: '#FFFFFF' },

  countText: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
    fontSize: 13, color: '#AAA',
  },

  list: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  cover: {
    width: 60, height: 60, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  coverEmoji: { fontSize: 28 },
  info: { flex: 1, gap: 4 },
  catTag: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  catTagText: { fontSize: 10, fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', lineHeight: 19 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#AAA' },
});

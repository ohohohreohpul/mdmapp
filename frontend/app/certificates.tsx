import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

export default function Certificates() {
  const router = useRouter();

  // Demo certificates data
  const certificates = [
    {
      id: '1',
      title: 'Digital Marketing 101',
      issueDate: '10 มีนาคม 2026',
      credentialId: 'MDY-DM-2026-001',
    },
  ];

  const pendingCourses = [
    {
      id: '1',
      title: 'UX Design สำหรับผู้เริ่มต้น',
      progress: 65,
      remaining: 4,
    },
    {
      id: '2',
      title: 'Data Analysis เบื้องต้น',
      progress: 30,
      remaining: 10,
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ใบประกาศนียบัตร</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Earned Certificates */}
        <Text style={styles.sectionTitle}>ใบประกาศที่ได้รับ ({certificates.length})</Text>
        
        {certificates.map((cert) => (
          <View key={cert.id} style={styles.certCard}>
            <View style={styles.certPreview}>
              <View style={styles.certIcon}>
                <Ionicons name="ribbon" size={40} color={COLORS.primary} />
              </View>
              <View style={styles.certBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
            </View>
            <Text style={styles.certTitle}>{cert.title}</Text>
            <Text style={styles.certDate}>ออกเมื่อ: {cert.issueDate}</Text>
            <Text style={styles.certId}>ID: {cert.credentialId}</Text>
            <View style={styles.certActions}>
              <TouchableOpacity style={styles.downloadButton}>
                <Ionicons name="download-outline" size={18} color="#FFF" />
                <Text style={styles.downloadText}>ดาวน์โหลด</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
                <Text style={styles.shareText}>แชร์</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Pending */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>กำลังดำเนินการ</Text>
        
        {pendingCourses.map((course) => (
          <View key={course.id} style={styles.pendingCard}>
            <View style={styles.pendingIcon}>
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
            </View>
            <View style={styles.pendingContent}>
              <Text style={styles.pendingTitle}>{course.title}</Text>
              <Text style={styles.pendingSubtitle}>
                เหลืออีก {course.remaining} บทเรียน • {course.progress}% เสร็จแล้ว
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
              </View>
            </View>
          </View>
        ))}

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  certCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  certPreview: {
    width: 100,
    height: 100,
    backgroundColor: '#FDF2F8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  certIcon: {
    alignItems: 'center',
  },
  certBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 2,
  },
  certTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  certDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  certId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  certActions: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pendingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  pendingIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContent: {
    flex: 1,
    marginLeft: 12,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  pendingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
});
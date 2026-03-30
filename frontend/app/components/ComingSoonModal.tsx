import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

interface ComingSoonModalProps {
  visible: boolean;
  onClose: () => void;
  courseName: string;
  releaseDate?: string;
}

export function ComingSoonModal({
  visible,
  onClose,
  courseName,
  releaseDate = 'April 2026',
}: ComingSoonModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Semi-transparent overlay background */}
        <View style={styles.backdrop} />

        {/* Modal content */}
        <View style={styles.modalContent}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={COLORS.primary}
            />
          </View>

          {/* Title - Coming Soon */}
          <Text style={styles.title}>Coming Soon</Text>

          {/* Subtitle - Course name */}
          <Text style={styles.subtitle}>{courseName}</Text>

          {/* Release date */}
          <View style={styles.dateContainer}>
            <Ionicons
              name="time-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.dateText}>{releaseDate}</Text>
          </View>

          {/* Description message */}
          <Text style={styles.description}>
            We're preparing something special. This course will be available soon. Stay tuned!
          </Text>

          {/* Action button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onClose}
          >
            <Text style={styles.actionButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    maxWidth: 320,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
  },
  iconContainer: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
});

export default ComingSoonModal;

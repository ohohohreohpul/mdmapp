import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: '1',
    question: 'คุณต้องการเรียนรู้อะไร?',
    options: [
      { id: 'ux', title: 'UX Design', emoji: '🎨' },
      { id: 'data', title: 'Data Analysis', emoji: '📊' },
      { id: 'marketing', title: 'Digital Marketing', emoji: '📱' },
      { id: 'pm', title: 'Project Management', emoji: '📋' },
    ],
  },
  {
    id: '2',
    question: 'ระดับประสบการณ์ของคุณ?',
    options: [
      { id: 'beginner', title: 'เริ่มต้น', emoji: '🌱' },
      { id: 'intermediate', title: 'ปานกลาง', emoji: '🚀' },
      { id: 'advanced', title: 'ขั้นสูง', emoji: '⭐' },
    ],
  },
  {
    id: '3',
    question: 'เวลาที่คุณมีในการเรียน?',
    options: [
      { id: 'light', title: '1-2 ชั่วโมง/สัปดาห์', emoji: '🕐' },
      { id: 'medium', title: '3-5 ชั่วโมง/สัปดาห์', emoji: '🕒' },
      { id: 'intensive', title: '5+ ชั่วโมง/สัปดาห์', emoji: '⏰' },
    ],
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = ONBOARDING_DATA[currentIndex];

  const handleSelectOption = (optionId: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: optionId });

    // Auto-advance after selection
    setTimeout(() => {
      if (currentIndex < ONBOARDING_DATA.length - 1) {
        handleNext();
      }
    }, 400);
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      
      Animated.timing(progressAnim, {
        toValue: newIndex,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleSkip = () => {
    // Mark as onboarded
    AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/auth');
  };

  const handleFinish = () => {
    console.log('Onboarding answers:', answers);
    // Mark as onboarded and save preferences
    AsyncStorage.setItem('hasOnboarded', 'true');
    AsyncStorage.setItem('onboardingAnswers', JSON.stringify(answers));
    router.replace('/auth');
  };

  const progress = ((currentIndex + 1) / ONBOARDING_DATA.length) * 100;
  const isLastQuestion = currentIndex === ONBOARDING_DATA.length - 1;
  const hasAnsweredCurrent = answers[currentQuestion.id] !== undefined;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.stepText}>
            {currentIndex + 1} / {ONBOARDING_DATA.length}
          </Text>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>ข้าม</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="bulb" size={48} color="#FFF" />
          </View>
        </View>

        {/* Question */}
        <Text style={styles.question}>{currentQuestion.question}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option.id;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectOption(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.title}
                </Text>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {isLastQuestion && hasAnsweredCurrent && (
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>เริ่มต้นเรียนรู้</Text>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  optionButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 16,
  },
  finishButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  finishButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

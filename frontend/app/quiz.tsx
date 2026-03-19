import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Quiz() {
  const router = useRouter();
  const { user, updateProgress } = useUser();
  const params = useLocalSearchParams();
  const lessonId = params.lessonId as string;
  const courseId = params.courseId as string;
  const quizType = params.type as string || 'lesson_quiz';

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [lessonId, courseId]);

  useEffect(() => {
    if (timeLeft && timeLeft > 0 && !showResults) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      submitQuiz();
    }
  }, [timeLeft]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      let response;
      
      if (quizType === 'final_exam' && courseId) {
        response = await axios.get(`${API_URL}/api/quizzes/course/${courseId}/final`);
      } else if (lessonId) {
        response = await axios.get(`${API_URL}/api/quizzes/lesson/${lessonId}`);
      }

      if (response && response.data) {
        setQuiz(response.data);
        if (response.data.time_limit_minutes) {
          setTimeLeft(response.data.time_limit_minutes * 60);
        }
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
      Alert.alert('ข้อผิดพลาด', 'ยังไม่มีแบบทดสอบสำหรับบทเรียนนี้', [
        { text: 'กลับ', onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionIndex: number, answer: string) => {
    setAnswers({
      ...answers,
      [questionIndex]: answer,
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitQuiz = async () => {
    const unanswered = quiz.questions.length - Object.keys(answers).length;
    if (unanswered > 0 && timeLeft !== 0) {
      Alert.alert(
        'ยืนยันการส่งคำตอบ',
        `คุณยังมีคำถาม ${unanswered} ข้อที่ยังไม่ได้ตอบ ต้องการส่งคำตอบหรือไม่?`,
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'ส่งคำตอบ', onPress: performSubmit },
        ]
      );
    } else {
      performSubmit();
    }
  };

  const performSubmit = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/quizzes/submit`, {
        quiz_id: quiz._id,
        user_id: user?._id || 'demo_user',
        answers: answers,
      });

      setResults(response.data);
      setShowResults(true);
      // Calculate XP awarded: 5 per correct + 25 bonus for 100%
      const xp = (response.data.correct_answers || 0) * 5 + (response.data.score === 100 ? 25 : 0);
      setXpAwarded(xp);

      // If quiz passed and this is a lesson quiz → auto-mark lesson complete in context
      // (updateProgress also refreshes user.progress so course-detail shows it unlocked)
      if (response.data.passed && lessonId && courseId && user && quizType !== 'final_exam') {
        try {
          await updateProgress(courseId, lessonId);
        } catch (_) {}
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถส่งคำตอบได้');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>กำลังโหลดแบบทดสอบ...</Text>
        </View>
      </View>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="clipboard" size={64} color="#D1D5DB" />
          <Text style={styles.errorText}>ยังไม่มีแบบทดสอบ</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>กลับ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Results Screen
  if (showResults && results) {
    const passed = results.passed;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>ผลการทดสอบ</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.resultsContainer}>
          <View style={[styles.scoreCard, passed ? styles.passedCard : styles.failedCard]}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'close-circle'}
              size={80}
              color={passed ? '#10B981' : '#EF4444'}
            />
            <Text style={styles.scoreTitle}>
              {passed ? 'ยินดีด้วย! คุณสอบผ่าน' : 'เสียใจด้วย คุณสอบไม่ผ่าน'}
            </Text>
            <Text style={styles.scoreValue}>{results.score}%</Text>
            <Text style={styles.scoreDetails}>
              ตอบถูก {results.correct_answers} จาก {results.total_questions} ข้อ
            </Text>
            <Text style={styles.passingScore}>คะแนนผ่าน: {quiz.passing_score}%</Text>
            {xpAwarded > 0 && (
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>⚡ +{xpAwarded} XP</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            {!passed && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setShowResults(false);
                  setAnswers({});
                  setCurrentQuestion(0);
                  if (quiz.time_limit_minutes) {
                    setTimeLeft(quiz.time_limit_minutes * 60);
                  }
                }}
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>ทำใหม่</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
              <Text style={styles.doneButtonText}>
                {passed ? 'เรียนต่อ' : 'กลับ'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Quiz Screen
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quiz.title}</Text>
        {timeLeft !== null && (
          <View style={[styles.timerBadge, timeLeft < 60 && styles.timerWarning]}>
            <Ionicons name="time" size={16} color="#FFFFFF" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        )}
        {timeLeft === null && <View style={{ width: 40 }} />}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        คำถามที่ {currentQuestion + 1} จาก {quiz.questions.length}
      </Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{question.question}</Text>

          {/* Media (if any) */}
          {question.media_url && (
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: question.media_url }}
                style={styles.mediaImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Options */}
          <View style={styles.optionsContainer}>
            {question.question_type === 'multiple_choice' && question.options?.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  answers[currentQuestion] === option && styles.optionSelected,
                ]}
                onPress={() => selectAnswer(currentQuestion, option)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.optionRadio,
                  answers[currentQuestion] === option && styles.optionRadioSelected,
                ]}>
                  {answers[currentQuestion] === option && (
                    <View style={styles.optionRadioInner} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  answers[currentQuestion] === option && styles.optionTextSelected,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}

            {question.question_type === 'true_false' && (
              ['จริง', 'เท็จ'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    answers[currentQuestion] === option && styles.optionSelected,
                  ]}
                  onPress={() => selectAnswer(currentQuestion, option)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.optionRadio,
                    answers[currentQuestion] === option && styles.optionRadioSelected,
                  ]}>
                    {answers[currentQuestion] === option && (
                      <View style={styles.optionRadioInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    answers[currentQuestion] === option && styles.optionTextSelected,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestion === 0 && styles.navButtonDisabled,
          ]}
          onPress={previousQuestion}
          disabled={currentQuestion === 0}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentQuestion === 0 ? '#D1D5DB' : '#6366F1'}
          />
          <Text style={[
            styles.navButtonText,
            currentQuestion === 0 && styles.navButtonTextDisabled,
          ]}>
            ย้อนกลับ
          </Text>
        </TouchableOpacity>

        {currentQuestion === quiz.questions.length - 1 ? (
          <TouchableOpacity style={styles.submitButton} onPress={submitQuiz}>
            <Text style={styles.submitButtonText}>ส่งคำตอบ</Text>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
            <Text style={styles.nextButtonText}>ถัดไป</Text>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  timerWarning: {
    backgroundColor: '#EF4444',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  questionCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 26,
    marginBottom: 20,
  },
  mediaContainer: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: '#6366F1',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#1F2937',
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6366F1',
    gap: 4,
  },
  navButtonDisabled: {
    borderColor: '#E5E7EB',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  navButtonTextDisabled: {
    color: '#D1D5DB',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#10B981',
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsContainer: {
    padding: 16,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  passedCard: {
    borderWidth: 3,
    borderColor: '#10B981',
  },
  failedCard: {
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 8,
  },
  scoreDetails: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  passingScore: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  xpBadge: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
  },
  xpBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
  },
  actionButtons: {
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    paddingVertical: 16,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
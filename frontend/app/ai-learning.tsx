import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeOut,
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue
} from 'react-native-reanimated';
import { useUser } from '../contexts/UserContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');
const PASS_THRESHOLD = 80;

interface Question {
  type: string;
  question: string;
  options?: string[];
  correct_index?: number;
  correct_answer?: boolean | string;
  explanation?: string;
  hint?: string;
  topic?: string;
  scenario?: string;
  image_prompt?: string;
  image_description?: string;
}

interface SessionData {
  session_id: string;
  lesson_title: string;
  intro: string;
  questions: Question[];
  tips: string[];
  current_knowledge: number;
  pass_threshold: number;
  attempt_number: number;
}

interface SessionResult {
  score: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
  results: Array<{
    question_index: number;
    is_correct: boolean;
    correct_answer: any;
    explanation: string;
  }>;
  feedback: {
    message: string;
    next_action: string;
    study_tips: string[];
  };
  can_proceed: boolean;
  best_score: number;
}

export default function AILearningSession() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lessonId = params.lessonId as string;
  const courseId = params.courseId as string;
  const lessonTitle = params.title as string || 'บทเรียน';
  
  const { user } = useUser();
  
  // States
  const [phase, setPhase] = useState<'intro' | 'video' | 'learning' | 'result'>('intro');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: any}>({});
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [result, setResult] = useState<SessionResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Animation values
  const progressWidth = useSharedValue(0);
  
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }));

  // Start session
  const startSession = async () => {
    setLoading(true);
    try {
      const userId = user?._id || 'demo_user';
      const response = await axios.post(
        `${API_URL}/api/learning/session/start/${lessonId}?user_id=${userId}`
      );
      
      if (response.data.success) {
        setSession(response.data);
        setPhase('video');
      } else {
        Alert.alert('ผิดพลาด', response.data.error || 'ไม่สามารถเริ่มเซสชันได้');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };
  
  // Skip video and start learning
  const startLearning = () => {
    setPhase('learning');
    progressWidth.value = withSpring(((currentQuestion + 1) / (session?.questions.length || 1)) * 100);
  };
  
  // Handle answer selection
  const selectAnswer = (answer: any) => {
    const question = session?.questions[currentQuestion];
    if (!question) return;
    
    if (question.type === 'fill_blank') {
      setAnswers({ ...answers, [currentQuestion]: fillBlankAnswer });
    } else {
      setAnswers({ ...answers, [currentQuestion]: answer });
    }
  };
  
  // Go to next question
  const nextQuestion = () => {
    if (!session) return;
    
    // Save fill_blank answer if current
    if (session.questions[currentQuestion].type === 'fill_blank') {
      setAnswers({ ...answers, [currentQuestion]: fillBlankAnswer });
      setFillBlankAnswer('');
    }
    
    if (currentQuestion < session.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowExplanation(false);
      progressWidth.value = withSpring(((currentQuestion + 2) / session.questions.length) * 100);
    } else {
      submitSession();
    }
  };
  
  // Submit session
  const submitSession = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const userId = user?._id || 'demo_user';
      
      // Prepare answers
      const formattedAnswers = Object.entries(answers).map(([idx, answer]) => ({
        question_index: parseInt(idx),
        answer: answer
      }));
      
      // Add last fill_blank if needed
      if (session.questions[currentQuestion].type === 'fill_blank' && fillBlankAnswer) {
        formattedAnswers.push({
          question_index: currentQuestion,
          answer: fillBlankAnswer
        });
      }
      
      const response = await axios.post(
        `${API_URL}/api/learning/session/submit?user_id=${userId}`,
        {
          session_id: session.session_id,
          answers: formattedAnswers
        }
      );
      
      if (response.data.success) {
        setResult(response.data);
        setPhase('result');
      } else {
        Alert.alert('ผิดพลาด', response.data.error || 'ไม่สามารถส่งคำตอบได้');
      }
    } catch (error) {
      console.error('Error submitting session:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถส่งคำตอบได้');
    } finally {
      setLoading(false);
    }
  };
  
  // Retry session
  const retrySession = () => {
    setSession(null);
    setCurrentQuestion(0);
    setAnswers({});
    setFillBlankAnswer('');
    setResult(null);
    setShowExplanation(false);
    progressWidth.value = 0;
    setPhase('intro');
    startSession();
  };
  
  // Get question type label
  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return '🎯 เลือกคำตอบ';
      case 'true_false': return '✅ จริงหรือเท็จ';
      case 'fill_blank': return '✏️ เติมคำ';
      case 'scenario': return '📋 วิเคราะห์สถานการณ์';
      case 'image_question': return '🖼️ คำถามจากภาพ';
      default: return '❓ คำถาม';
    }
  };
  
  // Render Intro Phase
  const renderIntro = () => (
    <Animated.View entering={FadeIn} style={styles.phaseContainer}>
      <LinearGradient
        colors={[COLORS.primary, '#f472b6']}
        style={styles.introGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.introContent}>
          <Text style={styles.introEmoji}>🧠</Text>
          <Text style={styles.introTitle}>AI Learning Session</Text>
          <Text style={styles.introSubtitle}>{lessonTitle}</Text>
          
          <View style={styles.introStats}>
            <View style={styles.introStatItem}>
              <Text style={styles.introStatValue}>80%</Text>
              <Text style={styles.introStatLabel}>เกณฑ์ผ่าน</Text>
            </View>
            <View style={styles.introStatDivider} />
            <View style={styles.introStatItem}>
              <Text style={styles.introStatValue}>5+</Text>
              <Text style={styles.introStatLabel}>คำถาม</Text>
            </View>
            <View style={styles.introStatDivider} />
            <View style={styles.introStatItem}>
              <Text style={styles.introStatValue}>∞</Text>
              <Text style={styles.introStatLabel}>ลองใหม่ได้</Text>
            </View>
          </View>
          
          <Text style={styles.introDescription}>
            AI จะสร้างคำถามให้คุณตอบ{'\n'}
            ตอบถูก 80% ขึ้นไปถึงจะ unlock บทถัดไป 🔓
          </Text>
          
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startSession}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.startButtonText}>เริ่มเรียน!</Text>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
  
  // Render Video Phase (Placeholder)
  const renderVideo = () => (
    <Animated.View entering={FadeIn} style={styles.phaseContainer}>
      <View style={styles.videoContainer}>
        {/* Video Placeholder */}
        <View style={styles.videoPlaceholder}>
          <LinearGradient
            colors={['#1f2937', '#374151']}
            style={styles.videoPlaceholderInner}
          >
            <Ionicons name="play-circle" size={80} color="#9ca3af" />
            <Text style={styles.videoPlaceholderText}>วิดีโอจาก Bunny.net</Text>
            <Text style={styles.videoPlaceholderSubtext}>จะเพิ่มในภายหลัง</Text>
          </LinearGradient>
        </View>
        
        {/* Session Intro */}
        {session && (
          <View style={styles.sessionIntroCard}>
            <Text style={styles.sessionIntroEmoji}>💡</Text>
            <Text style={styles.sessionIntroText}>{session.intro}</Text>
            
            {session.tips.length > 0 && (
              <View style={styles.tipsContainer}>
                {session.tips.slice(0, 2).map((tip, idx) => (
                  <View key={idx} style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={startLearning}
        >
          <Text style={styles.continueButtonText}>เริ่มทำแบบทดสอบ</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
  
  // Render Learning Phase (Questions)
  const renderLearning = () => {
    if (!session) return null;
    
    const question = session.questions[currentQuestion];
    if (!question) return null;
    
    return (
      <View style={styles.learningContainer}>
        {/* Progress Header */}
        <SafeAreaView edges={['top']} style={styles.learningHeader}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, animatedProgressStyle]} />
          </View>
          
          <Text style={styles.questionCounter}>
            {currentQuestion + 1}/{session.questions.length}
          </Text>
        </SafeAreaView>
        
        <ScrollView 
          style={styles.questionScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.questionScrollContent}
        >
          <Animated.View 
            key={currentQuestion}
            entering={SlideInRight.duration(300)}
            style={styles.questionCard}
          >
            {/* Question Type Badge */}
            <View style={styles.questionTypeBadge}>
              <Text style={styles.questionTypeText}>
                {getQuestionTypeLabel(question.type)}
              </Text>
            </View>
            
            {/* Scenario (if any) */}
            {question.scenario && (
              <View style={styles.scenarioBox}>
                <Text style={styles.scenarioLabel}>📋 สถานการณ์:</Text>
                <Text style={styles.scenarioText}>{question.scenario}</Text>
              </View>
            )}
            
            {/* Image Description (if any) */}
            {question.image_description && (
              <View style={styles.imageBox}>
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderEmoji}>🖼️</Text>
                  <Text style={styles.imageDescriptionText}>
                    {question.image_description}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Question */}
            <Text style={styles.questionText}>{question.question}</Text>
            
            {/* Options based on type */}
            {question.type === 'multiple_choice' || question.type === 'scenario' || question.type === 'image_question' ? (
              <View style={styles.optionsContainer}>
                {question.options?.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.optionButton,
                      answers[currentQuestion] === idx && styles.optionSelected
                    ]}
                    onPress={() => selectAnswer(idx)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.optionIndicator,
                      answers[currentQuestion] === idx && styles.optionIndicatorSelected
                    ]}>
                      <Text style={[
                        styles.optionIndicatorText,
                        answers[currentQuestion] === idx && styles.optionIndicatorTextSelected
                      ]}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.optionText,
                      answers[currentQuestion] === idx && styles.optionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : question.type === 'true_false' ? (
              <View style={styles.trueFalseContainer}>
                <TouchableOpacity
                  style={[
                    styles.trueFalseButton,
                    answers[currentQuestion] === true && styles.trueFalseSelected,
                    { backgroundColor: answers[currentQuestion] === true ? '#10B981' : '#fff' }
                  ]}
                  onPress={() => selectAnswer(true)}
                >
                  <Ionicons 
                    name="checkmark-circle" 
                    size={32} 
                    color={answers[currentQuestion] === true ? '#fff' : '#10B981'} 
                  />
                  <Text style={[
                    styles.trueFalseText,
                    answers[currentQuestion] === true && { color: '#fff' }
                  ]}>จริง</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.trueFalseButton,
                    answers[currentQuestion] === false && styles.trueFalseSelected,
                    { backgroundColor: answers[currentQuestion] === false ? '#EF4444' : '#fff' }
                  ]}
                  onPress={() => selectAnswer(false)}
                >
                  <Ionicons 
                    name="close-circle" 
                    size={32} 
                    color={answers[currentQuestion] === false ? '#fff' : '#EF4444'} 
                  />
                  <Text style={[
                    styles.trueFalseText,
                    answers[currentQuestion] === false && { color: '#fff' }
                  ]}>เท็จ</Text>
                </TouchableOpacity>
              </View>
            ) : question.type === 'fill_blank' ? (
              <View style={styles.fillBlankContainer}>
                <TextInput
                  style={styles.fillBlankInput}
                  placeholder="พิมพ์คำตอบของคุณ..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={fillBlankAnswer}
                  onChangeText={setFillBlankAnswer}
                  autoCapitalize="none"
                />
                {question.hint && (
                  <Text style={styles.hintText}>💡 คำใบ้: {question.hint}</Text>
                )}
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>
        
        {/* Next Button */}
        <View style={styles.learningFooter}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (answers[currentQuestion] === undefined && 
               question.type !== 'fill_blank') && styles.nextButtonDisabled,
              (question.type === 'fill_blank' && !fillBlankAnswer) && styles.nextButtonDisabled
            ]}
            onPress={nextQuestion}
            disabled={
              (answers[currentQuestion] === undefined && question.type !== 'fill_blank') ||
              (question.type === 'fill_blank' && !fillBlankAnswer) ||
              loading
            }
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentQuestion === session.questions.length - 1 ? 'ส่งคำตอบ' : 'ถัดไป'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render Result Phase
  const renderResult = () => {
    if (!result) return null;
    
    const passed = result.passed;
    
    return (
      <Animated.View entering={FadeIn} style={styles.phaseContainer}>
        <ScrollView 
          style={styles.resultScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultScrollContent}
        >
          <SafeAreaView edges={['top']}>
            {/* Result Header */}
            <View style={[
              styles.resultHeader,
              { backgroundColor: passed ? '#10B981' : '#F59E0B' }
            ]}>
              <Text style={styles.resultEmoji}>
                {passed ? '🎉' : '💪'}
              </Text>
              <Text style={styles.resultTitle}>
                {passed ? 'ยินดีด้วย!' : 'เกือบได้แล้ว!'}
              </Text>
              <Text style={styles.resultSubtitle}>
                {result.feedback.message}
              </Text>
            </View>
            
            {/* Score Card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreMain}>
                <Text style={[
                  styles.scoreValue,
                  { color: passed ? '#10B981' : '#F59E0B' }
                ]}>
                  {result.score}%
                </Text>
                <Text style={styles.scoreLabel}>คะแนนของคุณ</Text>
              </View>
              
              <View style={styles.scoreDivider} />
              
              <View style={styles.scoreDetails}>
                <View style={styles.scoreDetailItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.scoreDetailText}>
                    ถูก {result.correct_count} ข้อ
                  </Text>
                </View>
                <View style={styles.scoreDetailItem}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={styles.scoreDetailText}>
                    ผิด {result.total_questions - result.correct_count} ข้อ
                  </Text>
                </View>
                <View style={styles.scoreDetailItem}>
                  <Ionicons name="trophy" size={20} color="#F59E0B" />
                  <Text style={styles.scoreDetailText}>
                    Best: {result.best_score}%
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.thresholdCard}>
              <View style={styles.thresholdHeader}>
                <Text style={styles.thresholdLabel}>เกณฑ์ผ่าน: {PASS_THRESHOLD}%</Text>
                <Text style={[
                  styles.thresholdStatus,
                  { color: passed ? '#10B981' : '#F59E0B' }
                ]}>
                  {passed ? '✅ ผ่าน!' : '⏳ ยังไม่ผ่าน'}
                </Text>
              </View>
              <View style={styles.thresholdBarBg}>
                <View 
                  style={[
                    styles.thresholdBar,
                    { 
                      width: `${result.score}%`,
                      backgroundColor: passed ? '#10B981' : '#F59E0B'
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.thresholdMarker,
                    { left: `${PASS_THRESHOLD}%` }
                  ]}
                />
              </View>
            </View>
            
            {/* Study Tips */}
            {result.feedback.study_tips && result.feedback.study_tips.length > 0 && (
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>📚 เคล็ดลับการเรียน</Text>
                {result.feedback.study_tips.map((tip, idx) => (
                  <View key={idx} style={styles.tipRow}>
                    <Text style={styles.tipBulletLarge}>•</Text>
                    <Text style={styles.tipTextLarge}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.resultActions}>
              {passed ? (
                <>
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={() => router.back()}
                  >
                    <Ionicons name="arrow-forward" size={24} color="#fff" />
                    <Text style={styles.primaryActionText}>ไปบทเรียนถัดไป</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.secondaryActionButton}
                    onPress={retrySession}
                  >
                    <Ionicons name="refresh" size={20} color={COLORS.primary} />
                    <Text style={styles.secondaryActionText}>ลองอีกครั้ง</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.primaryActionButton, { backgroundColor: '#F59E0B' }]}
                    onPress={retrySession}
                  >
                    <Ionicons name="refresh" size={24} color="#fff" />
                    <Text style={styles.primaryActionText}>ลองอีกครั้ง</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.secondaryActionButton}
                    onPress={() => router.back()}
                  >
                    <Ionicons name="book" size={20} color={COLORS.primary} />
                    <Text style={styles.secondaryActionText}>กลับไปอ่านเนื้อหา</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </SafeAreaView>
        </ScrollView>
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      {phase === 'intro' && renderIntro()}
      {phase === 'video' && renderVideo()}
      {phase === 'learning' && renderLearning()}
      {phase === 'result' && renderResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  phaseContainer: {
    flex: 1,
  },
  
  // Intro Phase
  introGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  introEmoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  introTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING.sm,
  },
  introSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  introStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  introStatItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  introStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  introStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  introStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  introDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Video Phase
  videoContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  videoPlaceholder: {
    aspectRatio: 16 / 9,
    width: '100%',
  },
  videoPlaceholderInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: SPACING.sm,
  },
  videoPlaceholderSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  sessionIntroCard: {
    margin: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    ...SHADOWS.medium,
  },
  sessionIntroEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  sessionIntroText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  tipsContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  tipBullet: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Learning Phase
  learningContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  learningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
    gap: SPACING.md,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  progressBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  questionScroll: {
    flex: 1,
  },
  questionScrollContent: {
    padding: SPACING.lg,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  questionTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  questionTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scenarioBox: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  scenarioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: SPACING.xs,
  },
  scenarioText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 22,
  },
  imageBox: {
    marginBottom: SPACING.md,
  },
  imagePlaceholder: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    borderStyle: 'dashed',
  },
  imagePlaceholderEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  imageDescriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 28,
    marginBottom: SPACING.xl,
  },
  optionsContainer: {
    gap: SPACING.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  optionSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.primary,
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.textTertiary,
  },
  optionIndicatorSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionIndicatorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  optionIndicatorTextSelected: {
    color: '#fff',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  trueFalseButton: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  trueFalseSelected: {
    borderColor: 'transparent',
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  fillBlankContainer: {
    gap: SPACING.md,
  },
  fillBlankInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  hintText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  learningFooter: {
    padding: SPACING.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  // Result Phase
  resultScroll: {
    flex: 1,
  },
  resultScrollContent: {
    paddingBottom: SPACING.xxl,
  },
  resultHeader: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: SPACING.sm,
  },
  resultSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  scoreCard: {
    margin: SPACING.lg,
    marginTop: -SPACING.xl,
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.large,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreMain: {
    flex: 1,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scoreDivider: {
    width: 1,
    height: 80,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
  },
  scoreDetails: {
    flex: 1,
    gap: SPACING.md,
  },
  scoreDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scoreDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  thresholdCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  thresholdLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  thresholdStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  thresholdBarBg: {
    height: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    position: 'relative',
  },
  thresholdBar: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  thresholdMarker: {
    position: 'absolute',
    top: -4,
    width: 4,
    height: 20,
    backgroundColor: COLORS.textPrimary,
    borderRadius: 2,
    transform: [{ translateX: -2 }],
  },
  tipsCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  tipBulletLarge: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tipTextLarge: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  resultActions: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, XCircle, RefreshCw, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

function QuizPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const lessonId = params.get('lessonId') ?? '';
  const courseId = params.get('courseId') ?? '';
  const quizType = params.get('type') || 'lesson_quiz';
  const { user, updateProgress } = useUser();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadQuiz(); }, [lessonId, courseId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || showResults) return;
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, showResults]);

  useEffect(() => {
    if (timeLeft === 0) performSubmit();
  }, [timeLeft]);

  const loadQuiz = async () => {
    try {
      let res;
      if (quizType === 'final_exam' && courseId) {
        res = await axios.get(`${API_URL}/api/quizzes/course/${courseId}/final`);
      } else if (lessonId) {
        res = await axios.get(`${API_URL}/api/quizzes/lesson/${lessonId}`);
      }
      if (res?.data) {
        setQuiz(res.data);
        if (res.data.time_limit_minutes) setTimeLeft(res.data.time_limit_minutes * 60);
      }
    } catch {
      toast.error('ยังไม่มีแบบทดสอบสำหรับบทเรียนนี้');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const performSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/quizzes/submit`, {
        quiz_id: quiz._id,
        user_id: user?._id || 'demo_user',
        answers,
      });
      setResults(res.data);
      setShowResults(true);
      const xp = (res.data.correct_answers || 0) * 5 + (res.data.score === 100 ? 25 : 0);
      setXpAwarded(xp);
      if (res.data.passed && lessonId && courseId && user && quizType !== 'final_exam') {
        try { await updateProgress(courseId, lessonId); } catch (_) {}
      }
    } catch {
      toast.error('ไม่สามารถส่งคำตอบได้');
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuiz = () => {
    const unanswered = quiz.questions.length - Object.keys(answers).length;
    if (unanswered > 0 && timeLeft !== 0) {
      if (!confirm(`คุณยังมีคำถาม ${unanswered} ข้อที่ยังไม่ได้ตอบ ต้องการส่งคำตอบหรือไม่?`)) return;
    }
    performSubmit();
  };

  const retry = () => {
    setShowResults(false);
    setAnswers({});
    setCurrentQ(0);
    if (quiz.time_limit_minutes) setTimeLeft(quiz.time_limit_minutes * 60);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return (
    <div className="min-h-screen bg-ios-bg flex items-center justify-center gap-3 text-text-secondary">
      <Loader2 size={28} className="animate-spin text-primary" />
      <span>กำลังโหลดแบบทดสอบ...</span>
    </div>
  );

  if (!quiz || quiz.questions.length === 0) return (
    <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center gap-4 text-text-secondary">
      <ClipboardList size={64} className="text-text-tertiary" />
      <p>ยังไม่มีแบบทดสอบ</p>
      <button onClick={() => router.back()} className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold">กลับ</button>
    </div>
  );

  // Results screen
  if (showResults && results) {
    const passed = results.passed;
    return (
      <div className="min-h-screen bg-ios-bg">
        <header className="bg-white border-b border-separator px-4 pt-safe flex items-center justify-center py-4">
          <h1 className="text-[17px] font-bold text-text-primary">ผลการทดสอบ</h1>
        </header>
        <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center text-center gap-5">
          <div className={`rounded-3xl p-8 w-full flex flex-col items-center gap-3 ${passed ? 'bg-[#10B981]/10' : 'bg-red-50'}`}>
            {passed
              ? <CheckCircle size={80} className="text-[#10B981]" />
              : <XCircle size={80} className="text-[#EF4444]" />}
            <h2 className={`text-[20px] font-extrabold ${passed ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {passed ? 'ยินดีด้วย! คุณสอบผ่าน' : 'เสียใจด้วย คุณสอบไม่ผ่าน'}
            </h2>
            <p className="text-[48px] font-extrabold text-text-primary">{results.score}%</p>
            <p className="text-text-secondary">ตอบถูก {results.correct_answers} จาก {results.total_questions} ข้อ</p>
            <p className="text-text-tertiary text-sm">คะแนนผ่าน: {quiz.passing_score}%</p>
            {xpAwarded > 0 && (
              <span className="bg-primary/10 text-primary font-bold text-[14px] px-4 py-1.5 rounded-full">
                ⚡ +{xpAwarded} XP
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full">
            {!passed && (
              <button onClick={retry} className="flex-1 flex items-center justify-center gap-2 bg-white border border-separator rounded-2xl py-3.5 font-semibold text-text-primary hover:border-primary/30 transition-colors">
                <RefreshCw size={18} /> ทำใหม่
              </button>
            )}
            <button onClick={() => router.back()} className={`flex-1 bg-primary text-white rounded-2xl py-3.5 font-bold hover:opacity-90 transition-opacity ${passed ? 'w-full' : ''}`}>
              {passed ? 'เรียนต่อ' : 'กลับ'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz screen
  const question = quiz.questions[currentQ];
  const progressPct = ((currentQ + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-separator px-4 pt-safe flex items-center gap-3 py-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="flex-1 text-[15px] font-bold text-text-primary truncate">{quiz.title}</h1>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-bold text-sm ${timeLeft < 60 ? 'bg-red-500 text-white' : 'bg-primary/10 text-primary'}`}>
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        )}
      </header>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="text-center text-[12px] text-text-secondary py-2">
        คำถามที่ {currentQ + 1} จาก {quiz.questions.length}
      </p>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 pb-6 flex flex-col gap-4">
        {/* Question */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[16px] font-bold text-text-primary leading-snug">{question.question}</p>
          {question.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.media_url} alt="" className="mt-3 w-full rounded-xl object-contain max-h-48" />
          )}
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {question.options?.map((opt: string, i: number) => {
            const selected = answers[currentQ] === opt;
            return (
              <button
                key={i}
                onClick={() => setAnswers({ ...answers, [currentQ]: opt })}
                className={`w-full text-left p-4 rounded-2xl border-2 font-medium text-[15px] transition-all ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-separator bg-white text-text-primary hover:border-primary/30'
                }`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-auto pt-2">
          {currentQ > 0 && (
            <button onClick={() => setCurrentQ(currentQ - 1)} className="flex-1 bg-white border border-separator rounded-2xl py-3.5 font-semibold text-text-primary hover:border-primary/30 transition-colors">
              ← ก่อนหน้า
            </button>
          )}
          {currentQ < quiz.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              className="flex-1 bg-primary text-white rounded-2xl py-3.5 font-bold hover:opacity-90 transition-opacity"
            >
              ถัดไป →
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={submitting}
              className="flex-1 bg-[#10B981] text-white rounded-2xl py-3.5 font-bold disabled:opacity-65 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              ส่งคำตอบ
            </button>
          )}
        </div>

        {/* Answer dots */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {quiz.questions.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-7 h-7 rounded-full text-[11px] font-bold transition-colors ${
                i === currentQ ? 'bg-primary text-white' :
                answers[i] ? 'bg-primary/20 text-primary' :
                'bg-gray-100 text-text-tertiary'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return <Suspense><QuizPageInner /></Suspense>;
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, CheckCircle, XCircle, RefreshCw, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { NavHeader, ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const C = { brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC', bg: '#F2F2F7', surface: '#FFFFFF', green: '#10B981', red: '#EF4444' };
const card: React.CSSProperties = {
  backgroundColor: '#FFFFFF', borderRadius: 16,
  boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.06)',
};

function QuizPageInner() {
  const router   = useRouter();
  const params   = useSearchParams();
  const lessonId = params.get('lessonId') ?? '';
  const courseId = params.get('courseId') ?? '';
  const quizType = params.get('type') || 'lesson_quiz';
  const { user, updateProgress } = useUser();

  const [quiz, setQuiz]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [currentQ, setCurrentQ]     = useState(0);
  const [answers, setAnswers]       = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults]       = useState<any>(null);
  const [xpAwarded, setXpAwarded]   = useState(0);
  const [timeLeft, setTimeLeft]     = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadQuiz(); }, [lessonId, courseId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || showResults) return;
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, showResults]);

  useEffect(() => { if (timeLeft === 0) performSubmit(); }, [timeLeft]);

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
    } finally { setLoading(false); }
  };

  const performSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/quizzes/submit`, {
        quiz_id: quiz._id, user_id: user?._id || 'demo_user', answers,
      });
      setResults(res.data);
      setShowResults(true);
      const xp = (res.data.correct_answers || 0) * 5 + (res.data.score === 100 ? 25 : 0);
      setXpAwarded(xp);
      if (res.data.passed && lessonId && courseId && user && quizType !== 'final_exam') {
        try { await updateProgress(courseId, lessonId); } catch (_) {}
      }
    } catch { toast.error('ไม่สามารถส่งคำตอบได้'); }
    finally   { setSubmitting(false); }
  };

  const submitQuiz = () => {
    const unanswered = quiz.questions.length - Object.keys(answers).length;
    if (unanswered > 0 && timeLeft !== 0) {
      if (!confirm(`คุณยังมีคำถาม ${unanswered} ข้อที่ยังไม่ได้ตอบ ต้องการส่งคำตอบหรือไม่?`)) return;
    }
    performSubmit();
  };

  const retry = () => {
    setShowResults(false); setAnswers({}); setCurrentQ(0);
    if (quiz.time_limit_minutes) setTimeLeft(quiz.time_limit_minutes * 60);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: C.ink2 }}>
      <Loader2 size={28} color={C.brand} className="animate-spin" />
      <span style={{ fontSize: 15 }}>กำลังโหลดแบบทดสอบ...</span>
    </div>
  );

  if (!quiz || quiz.questions.length === 0) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <ClipboardList size={64} color={C.ink3} />
      <p style={{ color: C.ink2 }}>ยังไม่มีแบบทดสอบ</p>
      <button onClick={() => router.back()} style={{ backgroundColor: C.brand, color: '#fff', padding: '12px 24px', borderRadius: 16, fontWeight: 600, border: 'none', cursor: 'pointer' }}>กลับ</button>
    </div>
  );

  /* ── Results ── */
  if (showResults && results) {
    const passed = results.passed;
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
        <NavHeader title="ผลการทดสอบ" />
        <div style={{ maxWidth: 512, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
          <div style={{
            borderRadius: 24, padding: 32, width: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            backgroundColor: passed ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
            boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)',
          }}>
            {passed
              ? <CheckCircle size={80} color={C.green} />
              : <XCircle    size={80} color={C.red} />}
            <h2 style={{ fontSize: 20, fontWeight: 800, color: passed ? C.green : C.red }}>
              {passed ? 'ยินดีด้วย! คุณสอบผ่าน' : 'เสียใจด้วย คุณสอบไม่ผ่าน'}
            </h2>
            <p style={{ fontSize: 48, fontWeight: 800, color: C.ink }}>{results.score}%</p>
            <p style={{ color: C.ink2 }}>ตอบถูก {results.correct_answers} จาก {results.total_questions} ข้อ</p>
            <p style={{ fontSize: 14, color: C.ink3 }}>คะแนนผ่าน: {quiz.passing_score}%</p>
            {xpAwarded > 0 && (
              <span style={{ backgroundColor: 'rgba(239,94,168,0.10)', color: C.brand, fontWeight: 700, fontSize: 14, padding: '6px 16px', borderRadius: 999 }}>
                ⚡ +{xpAwarded} XP
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            {!passed && (
              <button onClick={retry} style={{ ...card, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', border: card.border, cursor: 'pointer', fontWeight: 600, color: C.ink }}>
                <RefreshCw size={18} /> ทำใหม่
              </button>
            )}
            <button onClick={() => router.back()} style={{ flex: 1, backgroundColor: C.brand, color: '#fff', padding: '14px 0', borderRadius: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              {passed ? 'เรียนต่อ' : 'กลับ'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Quiz screen ── */
  const question    = quiz.questions[currentQ];
  const progressPct = ((currentQ + 1) / quiz.questions.length) * 100;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
      <NavHeader
        title={quiz.title}
        right={timeLeft !== null ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 999, fontWeight: 700, fontSize: 14,
            backgroundColor: timeLeft < 60 ? C.red : 'rgba(239,94,168,0.10)',
            color: timeLeft < 60 ? '#fff' : C.brand,
          }}>
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        ) : undefined}
      />

      {/* Progress bar */}
      <div style={{ backgroundColor: '#fff', padding: '8px 20px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <ProgressBar pct={progressPct} />
        <p style={{ textAlign: 'center', fontSize: 12, color: C.ink3, marginTop: 4 }}>
          คำถามที่ {currentQ + 1} จาก {quiz.questions.length}
        </p>
      </div>

      <div style={{ flex: 1, maxWidth: 512, margin: '0 auto', width: '100%', padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Question card */}
        <div style={{ ...card, padding: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.45 }}>{question.question}</p>
          {question.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.media_url} alt="" style={{ marginTop: 12, width: '100%', borderRadius: 12, objectFit: 'contain', maxHeight: 192 }} />
          )}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {question.options?.map((opt: string, i: number) => {
            const selected = answers[currentQ] === opt;
            return (
              <button
                key={i}
                onClick={() => setAnswers({ ...answers, [currentQ]: opt })}
                style={{
                  width: '100%', textAlign: 'left', padding: 16, borderRadius: 14,
                  border: selected ? `2px solid ${C.brand}` : '2px solid rgba(0,0,0,0.08)',
                  backgroundColor: selected ? 'rgba(239,94,168,0.08)' : '#fff',
                  fontWeight: 500, fontSize: 15, cursor: 'pointer',
                  color: selected ? C.brand : C.ink,
                }}
              >
                <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 8 }}>
          {currentQ > 0 && (
            <button onClick={() => setCurrentQ(currentQ - 1)} style={{ ...card, flex: 1, padding: '14px 0', border: card.border, cursor: 'pointer', fontWeight: 600, color: C.ink }}>
              ← ก่อนหน้า
            </button>
          )}
          {currentQ < quiz.questions.length - 1 ? (
            <button onClick={() => setCurrentQ(currentQ + 1)} style={{ flex: 1, backgroundColor: C.brand, color: '#fff', padding: '14px 0', borderRadius: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              ถัดไป →
            </button>
          ) : (
            <button onClick={submitQuiz} disabled={submitting} style={{
              flex: 1, backgroundColor: C.green, color: '#fff',
              padding: '14px 0', borderRadius: 16, fontWeight: 700, border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {submitting && <Loader2 size={18} className="animate-spin" />}
              ส่งคำตอบ
            </button>
          )}
        </div>

        {/* Dot navigator */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
          {quiz.questions.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              style={{
                width: 28, height: 28, borderRadius: 14, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                backgroundColor: i === currentQ ? C.brand : answers[i] ? 'rgba(239,94,168,0.15)' : 'rgba(0,0,0,0.07)',
                color: i === currentQ ? '#fff' : answers[i] ? C.brand : C.ink3,
              }}
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

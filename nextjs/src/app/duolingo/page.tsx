'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, ChevronRight, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const SESSION_SIZE = 60;

function DuolingoPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const moduleId = params.get('moduleId') ?? '';
  const courseId = params.get('courseId') ?? '';
  const title = params.get('title') ?? 'แบบฝึกหัด';
  const { user } = useUser();

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [fillValue, setFillValue] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [lives, setLives] = useState(3);
  const [xpEarned, setXpEarned] = useState(0);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [microIdx, setMicroIdx] = useState(0);

  useEffect(() => { if (moduleId) loadQuestions(); }, [moduleId]);

  const loadQuestions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/practice/module/${moduleId}/questions`, {
        params: { user_id: user?._id || 'demo_user', limit: SESSION_SIZE },
      });
      setQuestions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const q = questions[current];
  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;

  const checkAnswer = (answer: any) => {
    if (answered) return;
    setSelected(answer);
    setAnswered(true);

    let isCorrect = false;
    if (q.type === 'multiple-choice' || q.type === 'comparison' || q.type === 'chart-reading' || q.type === 'chart-comparison') {
      isCorrect = answer === q.correct_answer;
    } else if (q.type === 'fill-blank') {
      isCorrect = answer.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
    } else if (q.type === 'micro-lesson' || q.type === 'concept-reveal') {
      isCorrect = true; // reading cards always pass
    } else {
      isCorrect = answer === q.correct_answer;
    }

    setCorrect(isCorrect);
    if (isCorrect) {
      setXpEarned(prev => prev + 10);
    } else {
      setLives(prev => Math.max(0, prev - 1));
    }
  };

  const next = async () => {
    if (!answered && q?.type !== 'micro-lesson' && q?.type !== 'concept-reveal') return;

    if (current + 1 >= questions.length || lives === 0) {
      // Submit session
      try {
        const res = await axios.post(`${API_URL}/api/practice/module/${moduleId}/complete`, {
          user_id: user?._id || 'demo_user',
          xp_earned: xpEarned,
          questions_answered: current + 1,
          correct_answers: Math.round(xpEarned / 10),
        });
        setResults(res.data);
      } catch {
        setResults({ xp_earned: xpEarned });
      }
      setDone(true);
      return;
    }

    setCurrent(prev => prev + 1);
    setSelected(null);
    setFillValue('');
    setAnswered(false);
    setCorrect(false);
    setMicroIdx(0);
  };

  if (loading) return (
    <div className="min-h-screen bg-ios-bg flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center gap-4 text-center px-6">
      <Zap size={48} className="text-text-tertiary" />
      <p className="font-bold text-text-primary">ไม่พบคำถาม</p>
      <button onClick={() => router.back()} className="bg-primary text-white px-6 py-3 rounded-2xl font-semibold">กลับ</button>
    </div>
  );

  // Done screen
  if (done) {
    const total = current + 1;
    const correctCount = Math.round(xpEarned / 10);
    const pct = Math.round((correctCount / total) * 100);
    return (
      <div className="min-h-screen bg-ios-bg flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className={`rounded-3xl p-8 w-full max-w-sm flex flex-col items-center gap-3 ${pct >= 70 ? 'bg-[#10B981]/10' : 'bg-orange-50'}`}>
          {pct >= 70
            ? <CheckCircle size={80} className="text-[#10B981]" />
            : <span className="text-6xl">💪</span>}
          <h2 className={`text-[22px] font-extrabold ${pct >= 70 ? 'text-[#10B981]' : 'text-orange-500'}`}>
            {pct >= 70 ? 'ยอดเยี่ยม!' : 'ทำได้ดี!'}
          </h2>
          <p className="text-[40px] font-extrabold text-text-primary">{pct}%</p>
          <p className="text-text-secondary">ตอบถูก {correctCount} จาก {total} ข้อ</p>
          {lives === 0 && <p className="text-[#EF4444] text-sm">หมดชีวิตแล้ว</p>}
          <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full">⚡ +{xpEarned} XP</span>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={() => router.back()} className="flex-1 bg-white border border-separator rounded-2xl py-3.5 font-semibold text-text-primary hover:border-primary/30 transition-colors">
            กลับ
          </button>
          <button onClick={() => { setCurrent(0); setSelected(null); setFillValue(''); setAnswered(false); setCorrect(false); setLives(3); setXpEarned(0); setDone(false); setMicroIdx(0); }}
            className="flex-1 bg-primary text-white rounded-2xl py-3.5 font-bold hover:opacity-90 transition-opacity">
            ฝึกอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-separator sticky top-0 z-10 header-safe">
        <div className="px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-ios-bg transition-colors">
          <X size={20} className="text-text-primary" />
        </button>
        {/* Progress bar */}
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {/* Lives */}
        <div className="flex gap-0.5">
          {[1,2,3].map(i => (
            <span key={i} className={`text-lg ${i <= lives ? '' : 'opacity-20'}`}>❤️</span>
          ))}
        </div>
        <span className="text-primary font-bold text-sm">+{xpEarned} XP</span>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5 flex flex-col gap-4">
        {/* Question renderer */}
        <QuestionRenderer
          q={q}
          selected={selected}
          fillValue={fillValue}
          onFillChange={setFillValue}
          answered={answered}
          correct={correct}
          microIdx={microIdx}
          onMicroNext={() => setMicroIdx(i => i + 1)}
          onSelect={checkAnswer}
          onFillSubmit={() => checkAnswer(fillValue)}
        />

        {/* Feedback */}
        {answered && q?.type !== 'micro-lesson' && q?.type !== 'concept-reveal' && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${correct ? 'bg-[#10B981]/10' : 'bg-red-50'}`}>
            {correct
              ? <CheckCircle size={24} className="text-[#10B981] shrink-0" />
              : <XCircle size={24} className="text-[#EF4444] shrink-0" />}
            <div>
              <p className={`font-bold ${correct ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {correct ? '🎉 ถูกต้อง!' : '❌ ไม่ถูกต้อง'}
              </p>
              {!correct && q?.explanation && (
                <p className="text-sm text-text-secondary mt-0.5">{q.explanation}</p>
              )}
            </div>
          </div>
        )}

        {/* Next button */}
        {(answered || q?.type === 'micro-lesson' || q?.type === 'concept-reveal') && (
          <button
            onClick={next}
            disabled={q?.type === 'micro-lesson' && microIdx < (q?.micro_lesson?.cards?.length ?? 0) - 1}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl disabled:opacity-40 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {current + 1 >= questions.length ? 'ดูผลลัพธ์' : 'ถัดไป'} <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Question renderer ─────────────────────────────────────────────────────────
function QuestionRenderer({ q, selected, fillValue, onFillChange, answered, correct, microIdx, onMicroNext, onSelect, onFillSubmit }: any) {
  if (!q) return null;

  // Micro-lesson — card-by-card reader
  if (q.type === 'micro-lesson') {
    const cards = q.micro_lesson?.cards || [];
    const card = cards[microIdx];
    if (!card) return null;
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <span className="text-3xl">{card.icon || '📖'}</span>
        <p className="text-[12px] font-bold text-primary uppercase tracking-widest">{card.cardType}</p>
        <h2 className="text-[18px] font-extrabold text-text-primary">{card.title}</h2>
        <p className="text-[15px] text-text-secondary leading-relaxed">{card.body}</p>
        {microIdx < cards.length - 1 && (
          <button onClick={onMicroNext} className="self-end text-primary font-semibold text-sm">ถัดไป →</button>
        )}
        <p className="text-[11px] text-text-tertiary text-right">{microIdx + 1}/{cards.length}</p>
      </div>
    );
  }

  // Concept reveal
  if (q.type === 'concept-reveal') {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <p className="text-[13px] font-bold text-primary">💡 Concept</p>
        <p className="text-[15px] text-text-primary leading-relaxed whitespace-pre-line">{q.concept_reveal?.content || q.question}</p>
        {q.concept_reveal?.summary && (
          <div className="bg-primary/10 rounded-xl p-3">
            <p className="text-[13px] font-semibold text-primary">{q.concept_reveal.summary}</p>
          </div>
        )}
      </div>
    );
  }

  // Fill in the blank
  if (q.type === 'fill-blank') {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-[16px] font-bold text-text-primary mb-3">{q.question}</p>
          <input
            type="text"
            value={fillValue}
            onChange={e => onFillChange(e.target.value)}
            disabled={answered}
            placeholder="พิมพ์คำตอบ..."
            className={`w-full border-2 rounded-xl px-4 py-3 text-[15px] outline-none transition-colors ${
              answered
                ? correct ? 'border-[#10B981] bg-[#10B981]/5 text-[#10B981]' : 'border-[#EF4444] bg-red-50 text-[#EF4444]'
                : 'border-separator focus:border-primary'
            }`}
            onKeyDown={e => { if (e.key === 'Enter' && !answered) onFillSubmit(); }}
          />
        </div>
        {!answered && (
          <button onClick={onFillSubmit} disabled={!fillValue.trim()} className="w-full bg-primary text-white font-bold py-4 rounded-2xl disabled:opacity-40 hover:opacity-90 transition-opacity">
            ตรวจคำตอบ
          </button>
        )}
      </div>
    );
  }

  // Scenario
  if (q.type === 'scenario') {
    const node = q.scenario_nodes?.[0];
    if (!node) return null;
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <span className="text-3xl mb-2 block">{node.icon}</span>
          <p className="text-[14px] font-bold text-text-primary mb-1">{node.situation}</p>
          <p className="text-[13px] text-text-secondary leading-relaxed">{node.context}</p>
        </div>
        {node.choices?.map((c: any) => {
          const chosen = selected === c.id;
          const reveal = answered && (chosen || c.isCorrect);
          return (
            <button
              key={c.id}
              onClick={() => !answered && onSelect(c.id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                reveal
                  ? c.isCorrect ? 'border-[#10B981] bg-[#10B981]/10' : chosen ? 'border-[#EF4444] bg-red-50' : 'border-separator bg-white opacity-50'
                  : chosen ? 'border-primary bg-primary/10' : 'border-separator bg-white hover:border-primary/40'
              }`}
            >
              <p className="font-semibold text-[14px] text-text-primary">{c.label}</p>
              {reveal && c.outcome && <p className="text-[12px] text-text-secondary mt-1">{c.outcome}</p>}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: multiple-choice / comparison / chart-reading / chart-comparison
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-[16px] font-bold text-text-primary">{q.question}</p>
      </div>
      {q.options?.map((opt: string, i: number) => {
        const chosen = selected === opt;
        const isCorrect = q.correct_answer === opt;
        const reveal = answered;
        return (
          <button
            key={i}
            onClick={() => !answered && onSelect(opt)}
            className={`w-full text-left p-4 rounded-2xl border-2 font-medium text-[15px] transition-all ${
              reveal
                ? isCorrect ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                  : chosen ? 'border-[#EF4444] bg-red-50 text-[#EF4444]'
                  : 'border-separator bg-white opacity-50'
                : chosen ? 'border-primary bg-primary/10 text-primary'
                : 'border-separator bg-white text-text-primary hover:border-primary/40'
            }`}
          >
            <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function DuolingoPage() {
  return <Suspense><DuolingoPageInner /></Suspense>;
}

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, ChevronRight, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const SESSION_SIZE = 60;

function DuolingoPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const moduleId = params.get('moduleId') ?? '';
  const courseId = params.get('courseId') ?? '';
  const title    = params.get('title') ?? 'แบบฝึกหัด';
  const { user } = useUser();

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState<any>(null);
  const [fillValue, setFillValue] = useState('');
  const [answered, setAnswered]   = useState(false);
  const [correct, setCorrect]     = useState(false);
  const [lives, setLives]         = useState(3);
  const [xpEarned, setXpEarned]   = useState(0);
  const [done, setDone]           = useState(false);
  const [results, setResults]     = useState<any>(null);
  const [microIdx, setMicroIdx]   = useState(0);

  useEffect(() => { if (moduleId) loadQuestions(); }, [moduleId]);

  const loadQuestions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/practice/module/${moduleId}/questions`, {
        params: { user_id: user?._id || 'demo_user', limit: SESSION_SIZE },
      });
      setQuestions(Array.isArray(res.data) ? res.data : []);
    } catch { setQuestions([]); }
    finally   { setLoading(false); }
  };

  const q        = questions[current];
  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;

  const checkAnswer = (answer: any) => {
    if (answered) return;
    setSelected(answer);
    setAnswered(true);
    let isCorrect = false;
    if (q.type === 'fill-blank') {
      isCorrect = answer.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
    } else if (q.type === 'micro-lesson' || q.type === 'concept-reveal') {
      isCorrect = true;
    } else {
      isCorrect = answer === q.correct_answer;
    }
    setCorrect(isCorrect);
    if (isCorrect) setXpEarned(prev => prev + 10);
    else           setLives(prev => Math.max(0, prev - 1));
  };

  const next = async () => {
    if (!answered && q?.type !== 'micro-lesson' && q?.type !== 'concept-reveal') return;
    if (current + 1 >= questions.length || lives === 0) {
      try {
        const res = await axios.post(`${API_URL}/api/practice/module/${moduleId}/complete`, {
          user_id: user?._id || 'demo_user',
          xp_earned: xpEarned,
          questions_answered: current + 1,
          correct_answers: Math.round(xpEarned / 10),
        });
        setResults(res.data);
      } catch { setResults({ xp_earned: xpEarned }); }
      setDone(true);
      return;
    }
    setCurrent(prev => prev + 1);
    setSelected(null); setFillValue(''); setAnswered(false); setCorrect(false); setMicroIdx(0);
  };

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 text-center px-6">
      <Zap size={48} className="text-ink-3" />
      <p className="font-bold text-ink">ไม่พบคำถาม</p>
      <button onClick={() => router.back()} className="bg-brand text-white px-6 py-3 rounded-2xl font-semibold">กลับ</button>
    </div>
  );

  // Done screen
  if (done) {
    const total        = current + 1;
    const correctCount = Math.round(xpEarned / 10);
    const pct          = Math.round((correctCount / total) * 100);
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className={`rounded-3xl p-8 w-full max-w-sm flex flex-col items-center gap-3 card-shadow ${pct >= 70 ? 'bg-[#10B981]/10' : 'bg-orange-50'}`}>
          {pct >= 70 ? <CheckCircle size={80} className="text-[#10B981]" /> : <span className="text-6xl">💪</span>}
          <h2 className={`text-[22px] font-extrabold ${pct >= 70 ? 'text-[#10B981]' : 'text-orange-500'}`}>
            {pct >= 70 ? 'ยอดเยี่ยม!' : 'ทำได้ดี!'}
          </h2>
          <p className="text-[40px] font-extrabold text-ink">{pct}%</p>
          <p className="text-ink-2">ตอบถูก {correctCount} จาก {total} ข้อ</p>
          {lives === 0 && <p className="text-[#EF4444] text-sm">หมดชีวิตแล้ว</p>}
          <span className="bg-brand/10 text-brand font-bold px-4 py-1.5 rounded-full">⚡ +{xpEarned} XP</span>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={() => router.back()}
                  className="flex-1 bg-surface border border-rim rounded-2xl py-3.5 font-semibold text-ink card-shadow">
            กลับ
          </button>
          <button
            onClick={() => { setCurrent(0); setSelected(null); setFillValue(''); setAnswered(false); setCorrect(false); setLives(3); setXpEarned(0); setDone(false); setMicroIdx(0); }}
            className="flex-1 bg-brand text-white rounded-2xl py-3.5 font-bold">
            ฝึกอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-rim sticky top-0 z-10 header-shell">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg transition-colors">
            <X size={20} className="text-ink" />
          </button>
          <div className="flex-1">
            <ProgressBar pct={progress} />
          </div>
          <div className="flex gap-0.5">
            {[1,2,3].map(i => (
              <span key={i} className={`text-lg ${i <= lives ? '' : 'opacity-20'}`}>❤️</span>
            ))}
          </div>
          <span className="text-brand font-bold text-sm">+{xpEarned} XP</span>
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5 flex flex-col gap-4">
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

        {answered && q?.type !== 'micro-lesson' && q?.type !== 'concept-reveal' && (
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${correct ? 'bg-[#10B981]/10' : 'bg-[#EF4444]/10'}`}>
            {correct
              ? <CheckCircle size={24} className="text-[#10B981] shrink-0" />
              : <XCircle     size={24} className="text-[#EF4444] shrink-0" />}
            <div>
              <p className={`font-bold ${correct ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {correct ? 'ถูกต้อง!' : 'ไม่ถูกต้อง'}
              </p>
              {!correct && q?.explanation && (
                <p className="text-sm text-ink-2 mt-0.5">{q.explanation}</p>
              )}
            </div>
          </div>
        )}

        {(answered || q?.type === 'micro-lesson' || q?.type === 'concept-reveal') && (
          <button
            onClick={next}
            disabled={q?.type === 'micro-lesson' && microIdx < (q?.micro_lesson?.cards?.length ?? 0) - 1}
            className="w-full bg-brand text-white font-bold py-4 rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(232,64,155,0.28)]"
          >
            {current + 1 >= questions.length ? 'ดูผลลัพธ์' : 'ถัดไป'} <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionRenderer({ q, selected, fillValue, onFillChange, answered, correct, microIdx, onMicroNext, onSelect, onFillSubmit }: any) {
  if (!q) return null;

  if (q.type === 'micro-lesson') {
    const cards = q.micro_lesson?.cards || [];
    const card  = cards[microIdx];
    if (!card) return null;
    return (
      <div className="bg-surface rounded-2xl p-5 card-shadow flex flex-col gap-3">
        <span className="text-3xl">{card.icon || '📖'}</span>
        <p className="text-[12px] font-bold text-brand uppercase tracking-widest">{card.cardType}</p>
        <h2 className="text-[18px] font-extrabold text-ink">{card.title}</h2>
        <p className="text-[15px] text-ink-2 leading-relaxed">{card.body}</p>
        {microIdx < cards.length - 1 && (
          <button onClick={onMicroNext} className="self-end text-brand font-semibold text-sm">ถัดไป →</button>
        )}
        <p className="text-[11px] text-ink-3 text-right">{microIdx + 1}/{cards.length}</p>
      </div>
    );
  }

  if (q.type === 'concept-reveal') {
    return (
      <div className="bg-surface rounded-2xl p-5 card-shadow flex flex-col gap-3">
        <p className="text-[13px] font-bold text-brand">💡 Concept</p>
        <p className="text-[15px] text-ink leading-relaxed whitespace-pre-line">{q.concept_reveal?.content || q.question}</p>
        {q.concept_reveal?.summary && (
          <div className="bg-brand/10 rounded-xl p-3">
            <p className="text-[13px] font-semibold text-brand">{q.concept_reveal.summary}</p>
          </div>
        )}
      </div>
    );
  }

  if (q.type === 'fill-blank') {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-surface rounded-2xl p-5 card-shadow">
          <p className="text-[16px] font-bold text-ink mb-3">{q.question}</p>
          <input
            type="text"
            value={fillValue}
            onChange={e => onFillChange(e.target.value)}
            disabled={answered}
            placeholder="พิมพ์คำตอบ..."
            className={`w-full border-2 rounded-2xl px-4 py-3 text-[15px] outline-none transition-colors bg-surface ${
              answered
                ? correct ? 'border-[#10B981] text-[#10B981]' : 'border-[#EF4444] text-[#EF4444]'
                : 'border-rim focus:border-brand'
            }`}
            onKeyDown={e => { if (e.key === 'Enter' && !answered) onFillSubmit(); }}
          />
        </div>
        {!answered && (
          <button onClick={onFillSubmit} disabled={!fillValue.trim()}
                  className="w-full bg-brand text-white font-bold py-4 rounded-2xl disabled:opacity-40">
            ตรวจคำตอบ
          </button>
        )}
      </div>
    );
  }

  if (q.type === 'scenario') {
    const node = q.scenario_nodes?.[0];
    if (!node) return null;
    return (
      <div className="flex flex-col gap-3">
        <div className="bg-surface rounded-2xl p-5 card-shadow">
          <span className="text-3xl mb-2 block">{node.icon}</span>
          <p className="text-[14px] font-bold text-ink mb-1">{node.situation}</p>
          <p className="text-[13px] text-ink-2 leading-relaxed">{node.context}</p>
        </div>
        {node.choices?.map((c: any) => {
          const chosen = selected === c.id;
          const reveal = answered && (chosen || c.isCorrect);
          return (
            <button key={c.id} onClick={() => !answered && onSelect(c.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      reveal
                        ? c.isCorrect ? 'border-[#10B981] bg-[#10B981]/10' : chosen ? 'border-[#EF4444] bg-[#EF4444]/10' : 'border-rim bg-surface opacity-50'
                        : chosen ? 'border-brand bg-brand/10' : 'border-rim bg-surface'
                    }`}>
              <p className="font-semibold text-[14px] text-ink">{c.label}</p>
              {reveal && c.outcome && <p className="text-[12px] text-ink-2 mt-1">{c.outcome}</p>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface rounded-2xl p-5 card-shadow">
        <p className="text-[16px] font-bold text-ink">{q.question}</p>
      </div>
      {q.options?.map((opt: string, i: number) => {
        const chosen    = selected === opt;
        const isCorrect = q.correct_answer === opt;
        const reveal    = answered;
        return (
          <button key={i} onClick={() => !answered && onSelect(opt)}
                  className={`w-full text-left p-4 rounded-2xl border-2 font-medium text-[15px] transition-all ${
                    reveal
                      ? isCorrect ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]'
                        : chosen  ? 'border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]'
                        : 'border-rim bg-surface opacity-50'
                      : chosen ? 'border-brand bg-brand/10 text-brand' : 'border-rim bg-surface text-ink'
                  }`}>
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

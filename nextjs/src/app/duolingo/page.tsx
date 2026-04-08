'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, ChevronRight, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const SESSION_SIZE = 60;

const C = {
  brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC',
  bg: '#F2F2F7', surface: '#FFFFFF', sep: 'rgba(0,0,0,0.08)',
  green: '#10B981', red: '#EF4444', orange: '#F97316',
};

const cardShadow = '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)';
const cardStyle: React.CSSProperties = {
  backgroundColor: C.surface, borderRadius: 16,
  boxShadow: cardShadow, border: '1px solid rgba(0,0,0,0.06)',
};

function DuolingoPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const moduleId = params.get('moduleId') ?? '';
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
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color={C.brand} className="animate-spin" />
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: '0 24px' }}>
      <Zap size={48} color={C.ink3} />
      <p style={{ fontWeight: 700, color: C.ink }}>ไม่พบคำถาม</p>
      <button onClick={() => router.back()}
        style={{ backgroundColor: C.brand, color: '#fff', padding: '12px 24px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
        กลับ
      </button>
    </div>
  );

  if (done) {
    const total        = current + 1;
    const correctCount = Math.round(xpEarned / 10);
    const pct          = Math.round((correctCount / total) * 100);
    const pass         = pct >= 70;
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', gap: 20 }}>
        <div style={{ borderRadius: 24, padding: 32, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, backgroundColor: pass ? 'rgba(16,185,129,0.10)' : '#FFF7ED', boxShadow: cardShadow }}>
          {pass ? <CheckCircle size={80} color={C.green} /> : <span style={{ fontSize: 60 }}>💪</span>}
          <h2 style={{ fontSize: 22, fontWeight: 800, color: pass ? C.green : C.orange, margin: 0 }}>
            {pass ? 'ยอดเยี่ยม!' : 'ทำได้ดี!'}
          </h2>
          <p style={{ fontSize: 40, fontWeight: 800, color: C.ink, margin: 0 }}>{pct}%</p>
          <p style={{ color: C.ink2, margin: 0 }}>ตอบถูก {correctCount} จาก {total} ข้อ</p>
          {lives === 0 && <p style={{ color: C.red, fontSize: 14, margin: 0 }}>หมดชีวิตแล้ว</p>}
          <span style={{ backgroundColor: 'rgba(239,94,168,0.10)', color: C.brand, fontWeight: 700, padding: '6px 16px', borderRadius: 999, fontSize: 14 }}>⚡ +{xpEarned} XP</span>
        </div>
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360 }}>
          <button onClick={() => router.back()}
            style={{ flex: 1, borderRadius: 16, padding: '14px 0', fontWeight: 600, color: C.ink, backgroundColor: C.surface, border: '1px solid rgba(0,0,0,0.06)', boxShadow: cardShadow, cursor: 'pointer' }}>
            กลับ
          </button>
          <button
            onClick={() => { setCurrent(0); setSelected(null); setFillValue(''); setAnswered(false); setCorrect(false); setLives(3); setXpEarned(0); setDone(false); setMicroIdx(0); }}
            style={{ flex: 1, backgroundColor: C.brand, color: '#fff', borderRadius: 16, padding: '14px 0', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            ฝึกอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.sep}`, position: 'sticky', top: 0, zIndex: 10, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X size={20} color={C.ink} />
          </button>
          <div style={{ flex: 1 }}>
            <ProgressBar pct={progress} />
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3].map(i => (
              <span key={i} style={{ fontSize: 18, opacity: i <= lives ? 1 : 0.2 }}>❤️</span>
            ))}
          </div>
          <span style={{ color: C.brand, fontWeight: 700, fontSize: 14 }}>+{xpEarned} XP</span>
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: 512, margin: '0 auto', width: '100%', padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <div style={{ borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12, backgroundColor: correct ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)' }}>
            {correct
              ? <CheckCircle size={24} color={C.green} style={{ flexShrink: 0 }} />
              : <XCircle     size={24} color={C.red}   style={{ flexShrink: 0 }} />}
            <div>
              <p style={{ fontWeight: 700, color: correct ? C.green : C.red, margin: 0 }}>
                {correct ? 'ถูกต้อง!' : 'ไม่ถูกต้อง'}
              </p>
              {!correct && q?.explanation && (
                <p style={{ fontSize: 14, color: C.ink2, marginTop: 2, marginBottom: 0 }}>{q.explanation}</p>
              )}
            </div>
          </div>
        )}

        {(answered || q?.type === 'micro-lesson' || q?.type === 'concept-reveal') && (
          <button
            onClick={next}
            disabled={q?.type === 'micro-lesson' && microIdx < (q?.micro_lesson?.cards?.length ?? 0) - 1}
            style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(232,64,155,0.28)', opacity: (q?.type === 'micro-lesson' && microIdx < (q?.micro_lesson?.cards?.length ?? 0) - 1) ? 0.4 : 1 }}
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
      <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 30 }}>{card.icon || '📖'}</span>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.brand, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{card.cardType}</p>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>{card.title}</h2>
        <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.6, margin: 0 }}>{card.body}</p>
        {microIdx < cards.length - 1 && (
          <button onClick={onMicroNext} style={{ alignSelf: 'flex-end', color: C.brand, fontWeight: 600, fontSize: 14, border: 'none', background: 'none', cursor: 'pointer' }}>ถัดไป →</button>
        )}
        <p style={{ fontSize: 11, color: C.ink3, textAlign: 'right', margin: 0 }}>{microIdx + 1}/{cards.length}</p>
      </div>
    );
  }

  if (q.type === 'concept-reveal') {
    return (
      <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.brand, margin: 0 }}>💡 Concept</p>
        <p style={{ fontSize: 15, color: C.ink, lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{q.concept_reveal?.content || q.question}</p>
        {q.concept_reveal?.summary && (
          <div style={{ backgroundColor: 'rgba(239,94,168,0.10)', borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.brand, margin: 0 }}>{q.concept_reveal.summary}</p>
          </div>
        )}
      </div>
    );
  }

  if (q.type === 'fill-blank') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>{q.question}</p>
          <input
            type="text"
            value={fillValue}
            onChange={e => onFillChange(e.target.value)}
            disabled={answered}
            placeholder="พิมพ์คำตอบ..."
            style={{
              width: '100%', borderRadius: 16, padding: '12px 16px', fontSize: 15, outline: 'none', boxSizing: 'border-box',
              border: `2px solid ${answered ? (correct ? C.green : C.red) : C.sep}`,
              color: answered ? (correct ? C.green : C.red) : C.ink,
              backgroundColor: C.surface,
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !answered) onFillSubmit(); }}
          />
        </div>
        {!answered && (
          <button onClick={onFillSubmit} disabled={!fillValue.trim()}
            style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', opacity: !fillValue.trim() ? 0.4 : 1 }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <span style={{ fontSize: 30, display: 'block', marginBottom: 8 }}>{node.icon}</span>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: '0 0 4px' }}>{node.situation}</p>
          <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.6, margin: 0 }}>{node.context}</p>
        </div>
        {node.choices?.map((c: any) => {
          const chosen = selected === c.id;
          const reveal = answered && (chosen || c.isCorrect);
          const bg = reveal
            ? c.isCorrect ? 'rgba(16,185,129,0.10)' : chosen ? 'rgba(239,68,68,0.10)' : C.surface
            : chosen ? 'rgba(239,94,168,0.10)' : C.surface;
          const borderColor = reveal
            ? c.isCorrect ? C.green : chosen ? C.red : C.sep
            : chosen ? C.brand : C.sep;
          return (
            <button key={c.id} onClick={() => !answered && onSelect(c.id)}
              style={{ width: '100%', textAlign: 'left', padding: 16, borderRadius: 16, border: `2px solid ${borderColor}`, backgroundColor: bg, cursor: answered ? 'default' : 'pointer', opacity: reveal && !c.isCorrect && !chosen ? 0.5 : 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: C.ink, margin: 0 }}>{c.label}</p>
              {reveal && c.outcome && <p style={{ fontSize: 12, color: C.ink2, marginTop: 4, marginBottom: 0 }}>{c.outcome}</p>}
            </button>
          );
        })}
      </div>
    );
  }

  // Multiple choice (default)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>{q.question}</p>
      </div>
      {q.options?.map((opt: string, i: number) => {
        const chosen    = selected === opt;
        const isCorrect = q.correct_answer === opt;
        const reveal    = answered;
        const bg = reveal
          ? isCorrect ? 'rgba(16,185,129,0.10)' : chosen ? 'rgba(239,68,68,0.10)' : C.surface
          : chosen ? 'rgba(239,94,168,0.10)' : C.surface;
        const borderColor = reveal
          ? isCorrect ? C.green : chosen ? C.red : C.sep
          : chosen ? C.brand : C.sep;
        const textColor = reveal
          ? isCorrect ? C.green : chosen ? C.red : C.ink
          : chosen ? C.brand : C.ink;
        return (
          <button key={i} onClick={() => !answered && onSelect(opt)}
            style={{ width: '100%', textAlign: 'left', padding: 16, borderRadius: 16, border: `2px solid ${borderColor}`, backgroundColor: bg, cursor: answered ? 'default' : 'pointer', opacity: reveal && !isCorrect && !chosen ? 0.5 : 1, fontSize: 15, fontWeight: 500, color: textColor }}>
            <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
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

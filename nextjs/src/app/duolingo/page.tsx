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

// ── Number formatter for chart axis labels ───────────────────────────────────

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(0)}K`
  : String(Math.round(n));

// ── Chart SVG renderer — bar and line, no external dependencies ───────────────

function ChartSvg({ config }: { config: any }) {
  if (!config?.data?.length) return null;
  const W = 320, H = 180;
  const pad = { l: 40, r: 10, t: 20, b: 32 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;

  const xKey   = config.xKey   || Object.keys(config.data[0])[0];
  const rawY   = config.yKey;
  const yKey   = typeof rawY === 'string' ? rawY
               : Array.isArray(rawY)      ? rawY[0]
               : Object.keys(config.data[0])[1];
  const isLine = (config.type || 'bar') === 'line';
  const data   = config.data as any[];
  const PAL    = ['#10b981', '#f573bd', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6'];

  const vals   = data.map(d => Number(d[yKey]) || 0);
  const maxY   = Math.max(...vals, 1);
  const minY   = isLine ? Math.min(...vals) : 0;
  const range  = maxY - minY || 1;

  return (
    <div style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: '8px 4px 4px', marginBottom: 12 }}>
      {config.title && (
        <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center', margin: '0 0 4px' }}>
          {config.title}
        </p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = pad.t + ch * (1 - t);
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
              <text x={pad.l - 4} y={y + 3} fontSize="8" fill="#9CA3AF" textAnchor="end">
                {fmtNum(minY + range * t)}
              </text>
            </g>
          );
        })}

        {isLine ? (() => {
          const pts = data.map((d, i) => ({
            x: pad.l + (data.length > 1 ? (i / (data.length - 1)) * cw : cw / 2),
            y: pad.t + ch - ((Number(d[yKey]) - minY) / range) * ch,
            lbl: String(d[xKey] || '').slice(0, 5),
          }));
          const line = pts.map(p => `${p.x},${p.y}`).join(' ');
          const fill = pts.length > 1
            ? `M${pts[0].x},${pad.t + ch} ${pts.map(p => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},${pad.t + ch} Z`
            : '';
          return (
            <>
              {fill && <path d={fill} fill="#f573bd" fillOpacity="0.12" />}
              <polyline points={line} fill="none" stroke="#f573bd" strokeWidth="2" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="3" fill="#f573bd" />
                  <text x={p.x} y={H - pad.b + 12} fontSize="8" fill="#6B7280" textAnchor="middle">{p.lbl}</text>
                </g>
              ))}
            </>
          );
        })() : (() => {
          const barW = cw / data.length;
          const gap  = barW * 0.25;
          return (
            <>
              {data.map((d, i) => {
                const val  = Number(d[yKey]) || 0;
                const barH = (val / maxY) * ch;
                const x    = pad.l + i * barW + gap / 2;
                const y    = pad.t + ch - barH;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={barW - gap} height={barH} fill={PAL[i % PAL.length]} rx="3" />
                    <text x={x + (barW - gap) / 2} y={H - pad.b + 12} fontSize="8" fill="#6B7280" textAnchor="middle">
                      {String(d[xKey] || '').slice(0, 5)}
                    </text>
                  </g>
                );
              })}
            </>
          );
        })()}
      </svg>
    </div>
  );
}

// ── Shared MC option button ───────────────────────────────────────────────────

function McButton({ label, chosen, isCorrect, answered, onPress }: {
  label: string; chosen: boolean; isCorrect: boolean; answered: boolean; onPress: () => void;
}) {
  const reveal = answered;
  const bg = reveal
    ? isCorrect ? 'rgba(16,185,129,0.10)' : chosen ? 'rgba(239,68,68,0.10)' : C.surface
    : chosen ? 'rgba(239,94,168,0.10)' : C.surface;
  const border = reveal
    ? isCorrect ? C.green : chosen ? C.red : C.sep
    : chosen ? C.brand : C.sep;
  const color = reveal
    ? isCorrect ? C.green : chosen ? C.red : C.ink
    : chosen ? C.brand : C.ink;
  return (
    <button onClick={() => !answered && onPress()}
      style={{ width: '100%', textAlign: 'left', padding: 16, borderRadius: 16,
               border: `2px solid ${border}`, backgroundColor: bg,
               cursor: answered ? 'default' : 'pointer',
               opacity: reveal && !isCorrect && !chosen ? 0.5 : 1,
               fontSize: 15, fontWeight: 500, color, marginBottom: 8 }}>
      {label}
    </button>
  );
}

// ── Comparison renderer (separate component so it can own useState) ───────────

function mkHtmlDoc(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><script src="https://cdn.tailwindcss.com"><\/script><style>*{box-sizing:border-box}body{margin:0;padding:8px;font-family:sans-serif}</style></head><body>${body}</body></html>`;
}

function ComparisonRenderer({ q, content, selected, answered, onSelect }: any) {
  const [expanded, setExpanded] = useState<{ html: string; label: string } | null>(null);
  const opts: any[] = content.options || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {expanded && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 200,
                   display: 'flex', flexDirection: 'column', padding: 16 }}
          onClick={() => setExpanded(null)}
        >
          <div style={{ backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}
               onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.sep}` }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{expanded.label}</span>
              <button onClick={() => setExpanded(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: C.ink2, lineHeight: 1 }}>✕</button>
            </div>
            <iframe
              srcDoc={mkHtmlDoc(expanded.html)}
              style={{ width: '100%', flex: 1, border: 'none', display: 'block' }}
              sandbox="allow-scripts allow-same-origin"
              title={expanded.label}
            />
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>{q.question || q.prompt}</p>
        <p style={{ fontSize: 12, color: C.ink2, margin: 0 }}>🔍 เปรียบเทียบและเลือกตัวเลือกที่ดีกว่า</p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {opts.map((opt: any) => {
          const optVal   = opt.content || opt.label || opt.id;
          const chosen   = selected === optVal;
          const isAnswer = q.correct_answer === optVal;
          const reveal   = answered;
          const border   = reveal ? isAnswer ? C.green : chosen ? C.red : C.sep : chosen ? C.brand : C.sep;
          const headerBg = reveal ? isAnswer ? 'rgba(16,185,129,0.10)' : chosen ? 'rgba(239,68,68,0.10)' : '#F9FAFB' : chosen ? 'rgba(239,94,168,0.10)' : '#F9FAFB';
          return (
            <div key={opt.id} style={{ flex: 1, borderRadius: 16, border: `2px solid ${border}`, backgroundColor: C.surface, overflow: 'hidden', boxShadow: cardShadow }}>
              <div style={{ backgroundColor: headerBg, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {reveal && isAnswer && <span style={{ color: C.green }}>✅</span>}
                {reveal && chosen && !isAnswer && <span style={{ color: C.red }}>❌</span>}
                <span style={{ fontSize: 13, fontWeight: 700, color: reveal ? (isAnswer ? C.green : chosen ? C.red : C.ink2) : C.ink2 }}>
                  {opt.label}
                </span>
              </div>
              <div
                style={{ height: 170, overflow: 'hidden', position: 'relative', cursor: answered ? 'default' : 'pointer', backgroundColor: '#fff' }}
                onClick={() => !answered && onSelect(optVal)}
              >
                <iframe
                  srcDoc={mkHtmlDoc(opt.content || `<div class="p-4 text-sm text-gray-600">${opt.label}</div>`)}
                  style={{ width: '100%', height: 170, border: 'none', display: 'block', pointerEvents: 'none' }}
                  sandbox="allow-scripts allow-same-origin"
                  scrolling="no"
                  title={opt.label}
                />
                <div
                  style={{ position: 'absolute', bottom: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExpanded({ html: opt.content || '', label: opt.label }); }}
                >
                  <span style={{ fontSize: 11, backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff', padding: '3px 12px', borderRadius: 999, cursor: 'pointer' }}>
                    🔍 ขยาย
                  </span>
                </div>
              </div>
              <button
                onClick={() => !answered && onSelect(optVal)}
                disabled={answered}
                style={{ width: '100%', padding: '10px 0', fontWeight: 700, fontSize: 14, border: 'none', cursor: answered ? 'default' : 'pointer',
                         backgroundColor: chosen ? (reveal ? (isAnswer ? C.green : C.red) : C.brand) : '#F3F4F6',
                         color: chosen ? '#fff' : C.ink2 }}>
                {reveal && isAnswer ? '✅ ถูก' : reveal && chosen && !isAnswer ? '❌ ผิด' : chosen ? '✓ เลือกแล้ว' : 'เลือก'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fill-blank word-bank renderer (needs useState for multi-select) ───────────

function FillBlankWordBankRenderer({ q, visualConfig, answered, correct, onSubmit }: any) {
  const [selections, setSelections] = useState<string[]>([]);

  const blanks: any[] = (visualConfig?.blanks || []).filter((b: any) => typeof b === 'object' && b !== null);
  const allOpts: any[] = [];
  blanks.forEach((blank: any) => {
    (blank.options || []).forEach((o: any) => {
      if (typeof o === 'object' && o !== null && !allOpts.find((x: any) => x.id === o.id)) allOpts.push(o);
    });
  });

  // Build correct labels from all blanks using original answer IDs
  const idToLabel: Record<string, string> = {};
  blanks.forEach((blank: any) => {
    (blank.options || []).forEach((o: any) => { if (o?.id) idToLabel[o.id] = o.label || o.id; });
  });
  const correctIds = String(q.answer || q.correct_answer || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const correctLabels = new Set(correctIds.map(id => idToLabel[id] || id));

  const toggle = (label: string) => {
    if (answered) return;
    setSelections(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>{q.question || q.prompt}</p>
        {visualConfig?.code && (
          <pre style={{ backgroundColor: '#1e1e2e', borderRadius: 10, padding: 14, fontSize: 13, color: '#cdd6f4', overflowX: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>
            {visualConfig.code}
          </pre>
        )}
      </div>
      <p style={{ fontSize: 12, color: C.ink2, margin: '4px 0', textAlign: 'center' }}>
        {blanks.length > 1 ? `เลือก ${blanks.length} คำตอบ` : 'เลือกคำตอบที่ถูกต้อง'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {allOpts.map((o: any) => {
          const oLabel  = o.label || o.id;
          const chosen  = answered ? selections.includes(oLabel) : selections.includes(oLabel);
          const isRight = correctLabels.has(oLabel);
          const bg = answered
            ? isRight ? 'rgba(16,185,129,0.12)' : chosen ? 'rgba(239,68,68,0.10)' : '#F3F4F6'
            : chosen ? 'rgba(239,94,168,0.10)' : '#F3F4F6';
          const border = answered
            ? isRight ? C.green : chosen ? C.red : 'transparent'
            : chosen ? C.brand : 'transparent';
          return (
            <button key={o.id} onClick={() => toggle(oLabel)}
              style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                       border: `2px solid ${border}`, backgroundColor: bg, color: C.ink,
                       cursor: answered ? 'default' : 'pointer' }}>
              {oLabel}
            </button>
          );
        })}
      </div>
      {!answered && (
        <button onClick={() => onSubmit(selections, correctLabels)} disabled={selections.length === 0}
          style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700,
                   padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
                   opacity: selections.length === 0 ? 0.4 : 1 }}>
          ตรวจคำตอบ
        </button>
      )}
    </div>
  );
}

// ── Question renderer ─────────────────────────────────────────────────────────

function QuestionRenderer({ q, selected, fillValue, onFillChange, answered, correct,
  microIdx, onMicroNext, onSelect, onFillSubmit, onWordBankSubmit }: any) {
  if (!q) return null;

  const qType   = q.type || q.question_type || 'multiple-choice';
  const content = q.content || {};

  // ── Micro-lesson ──────────────────────────────────────────────────────────
  if (qType === 'micro-lesson') {
    const cards = q.micro_lesson?.cards || content.cards || [];
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

  // ── Concept-reveal ────────────────────────────────────────────────────────
  if (qType === 'concept-reveal') {
    const cr = q.concept_reveal || content.conceptReveal || {};
    return (
      <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.brand, margin: 0 }}>💡 Concept</p>
        <p style={{ fontSize: 15, color: C.ink, lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{cr.content || q.question}</p>
        {cr.summary && (
          <div style={{ backgroundColor: 'rgba(239,94,168,0.10)', borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.brand, margin: 0 }}>{cr.summary}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Scenario ──────────────────────────────────────────────────────────────
  if (qType === 'scenario') {
    const nodes = q.scenario_nodes || content.scenarioNodes || [];
    const node  = nodes[0];
    if (!node) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <span style={{ fontSize: 30, display: 'block', marginBottom: 8 }}>{node.icon}</span>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: '0 0 4px' }}>{node.situation}</p>
          <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.6, margin: 0 }}>{node.context}</p>
        </div>
        {(node.choices || []).map((c: any) => {
          const chosen = selected === c.id;
          const reveal = answered && (chosen || c.isCorrect);
          const bg = reveal ? c.isCorrect ? 'rgba(16,185,129,0.10)' : chosen ? 'rgba(239,68,68,0.10)' : C.surface : chosen ? 'rgba(239,94,168,0.10)' : C.surface;
          const border = reveal ? c.isCorrect ? C.green : chosen ? C.red : C.sep : chosen ? C.brand : C.sep;
          return (
            <button key={c.id} onClick={() => !answered && onSelect(c.id)}
              style={{ width: '100%', textAlign: 'left', padding: 16, borderRadius: 16, border: `2px solid ${border}`, backgroundColor: bg, cursor: answered ? 'default' : 'pointer', opacity: reveal && !c.isCorrect && !chosen ? 0.5 : 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: C.ink, margin: 0 }}>{c.label}</p>
              {reveal && c.outcome && <p style={{ fontSize: 12, color: C.ink2, marginTop: 4, marginBottom: 0 }}>{c.outcome}</p>}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Comparison ────────────────────────────────────────────────────────────
  if (qType === 'comparison') {
    return <ComparisonRenderer q={q} content={content} selected={selected} answered={answered} onSelect={onSelect} />;
  }

  // ── Chart-reading / Chart-comparison ─────────────────────────────────────
  if (qType === 'chart-reading' || qType === 'chart-comparison') {
    const chartConfig = content.visual?.config;
    const opts: any[] = content.options || [];
    // Prefer content.options for display (has id/label/content); fall back to q.options strings
    const displayOpts = opts.length > 0 ? opts : (q.options || []).map((s: string, i: number) => ({ id: String(i), label: s, content: s }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>{q.question || q.prompt}</p>
          {chartConfig && <ChartSvg config={chartConfig} />}
        </div>
        {displayOpts.map((opt: any) => {
          const optVal   = opt.content || opt.label || opt.id;
          const chosen   = selected === optVal;
          const isAnswer = q.correct_answer === optVal;
          return (
            <McButton key={opt.id ?? optVal} label={opt.content || opt.label || String(opt.id)} chosen={chosen} isCorrect={isAnswer} answered={answered} onPress={() => onSelect(optVal)} />
          );
        })}
      </div>
    );
  }

  // ── Fill-blank ────────────────────────────────────────────────────────────
  if (qType === 'fill-blank') {
    const visualConfig = content.visual?.config;
    const blanks: any[] = (visualConfig?.blanks || []).filter((b: any) => typeof b === 'object' && b !== null);
    const hasWordBank   = blanks.length > 0;

    if (hasWordBank) {
      return (
        <FillBlankWordBankRenderer
          q={q} visualConfig={visualConfig} answered={answered} correct={correct}
          onSubmit={onWordBankSubmit}
        />
      );
    }

    // Simple text-input fill-blank
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>{q.question || q.prompt}</p>
          <input
            type="text" value={fillValue} onChange={e => onFillChange(e.target.value)} disabled={answered}
            placeholder="พิมพ์คำตอบ..."
            style={{ width: '100%', borderRadius: 16, padding: '12px 16px', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                     border: `2px solid ${answered ? (correct ? C.green : C.red) : C.sep}`,
                     color: answered ? (correct ? C.green : C.red) : C.ink, backgroundColor: C.surface }}
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

  // ── Multiple-choice (default) ─────────────────────────────────────────────
  const contentOpts: any[] = content.options || [];
  // Use content.options when available (has proper label + content fields)
  if (contentOpts.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>{q.question || q.prompt}</p>
        </div>
        {contentOpts.map((opt: any, i: number) => {
          const optVal   = opt.content || opt.label || opt.id;
          const chosen   = selected === optVal;
          const isAnswer = q.correct_answer === optVal;
          return (
            <McButton key={opt.id ?? i} label={opt.content || opt.label || String(opt.id)} chosen={chosen} isCorrect={isAnswer} answered={answered} onPress={() => onSelect(optVal)} />
          );
        })}
      </div>
    );
  }

  // Fallback: q.options flat string array
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>{q.question || q.prompt}</p>
      </div>
      {(q.options || []).map((opt: string, i: number) => (
        <McButton key={i} label={opt} chosen={selected === opt} isCorrect={q.correct_answer === opt} answered={answered} onPress={() => onSelect(opt)} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function DuolingoPageInner() {
  const router   = useRouter();
  const params   = useSearchParams();
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
      const res = await axios.get(`${API_URL}/api/practice/module/${moduleId}`);
      const qs  = Array.isArray(res.data) ? res.data : (res.data?.questions ?? []);
      setQuestions(qs.slice(0, SESSION_SIZE));
    } catch { setQuestions([]); }
    finally   { setLoading(false); }
  };

  const q        = questions[current];
  const qt       = q ? (q.type || q.question_type || 'multiple-choice') : '';
  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;

  // Word-bank submit: receives (selections: string[], correctLabels: Set<string>)
  const checkWordBank = (selections: string[], correctLabels: Set<string>) => {
    if (answered) return;
    setSelected(selections.join(','));
    setAnswered(true);
    const isCorrect = correctLabels.size > 0 &&
      [...correctLabels].every(l => selections.includes(l)) &&
      selections.every(l => correctLabels.has(l));
    setCorrect(isCorrect);
    if (isCorrect) setXpEarned(prev => prev + 10);
    else           setLives(prev => Math.max(0, prev - 1));
  };

  const checkAnswer = (answer: any) => {
    if (answered) return;
    setSelected(answer);
    setAnswered(true);

    let isCorrect = false;
    if (qt === 'fill-blank') {
      isCorrect = String(answer).trim().toLowerCase() === String(q.correct_answer || '').trim().toLowerCase();
    } else if (qt === 'micro-lesson' || qt === 'concept-reveal') {
      isCorrect = true;
    } else if (qt === 'scenario') {
      // Scenario: compare choice id against q.correct_answer (which is the answer id)
      isCorrect = answer === q.correct_answer || (q.content?.scenarioNodes?.[0]?.choices || []).find((c: any) => c.id === answer)?.isCorrect;
    } else {
      isCorrect = answer === q.correct_answer;
    }
    setCorrect(isCorrect);
    if (isCorrect) setXpEarned(prev => prev + 10);
    else           setLives(prev => Math.max(0, prev - 1));
  };

  const next = async () => {
    if (!answered && qt !== 'micro-lesson' && qt !== 'concept-reveal') return;
    if (qt === 'micro-lesson') {
      const cards = q?.micro_lesson?.cards || q?.content?.cards || [];
      if (microIdx < cards.length - 1) { setMicroIdx(i => i + 1); return; }
    }
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
          <h2 style={{ fontSize: 22, fontWeight: 800, color: pass ? C.green : C.orange, margin: 0 }}>{pass ? 'ยอดเยี่ยม!' : 'ทำได้ดี!'}</h2>
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
          <button onClick={() => { setCurrent(0); setSelected(null); setFillValue(''); setAnswered(false); setCorrect(false); setLives(3); setXpEarned(0); setDone(false); setMicroIdx(0); }}
            style={{ flex: 1, backgroundColor: C.brand, color: '#fff', borderRadius: 16, padding: '14px 0', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            ฝึกอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  const microCards   = q?.micro_lesson?.cards || q?.content?.cards || [];
  const noAnswerType = qt === 'micro-lesson' || qt === 'concept-reveal';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.sep}`, position: 'sticky', top: 0, zIndex: 10, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X size={20} color={C.ink} />
          </button>
          <div style={{ flex: 1 }}><ProgressBar pct={progress} /></div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[1,2,3].map(i => <span key={i} style={{ fontSize: 18, opacity: i <= lives ? 1 : 0.2 }}>❤️</span>)}
          </div>
          <span style={{ color: C.brand, fontWeight: 700, fontSize: 14 }}>+{xpEarned} XP</span>
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: 512, margin: '0 auto', width: '100%', padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <QuestionRenderer
          q={q} selected={selected} fillValue={fillValue}
          onFillChange={setFillValue} answered={answered} correct={correct}
          microIdx={microIdx} onMicroNext={() => setMicroIdx(i => i + 1)}
          onSelect={checkAnswer}
          onFillSubmit={() => checkAnswer(fillValue)}
          onWordBankSubmit={checkWordBank}
        />

        {answered && !noAnswerType && (
          <div style={{ borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12, backgroundColor: correct ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)' }}>
            {correct ? <CheckCircle size={24} color={C.green} style={{ flexShrink: 0 }} /> : <XCircle size={24} color={C.red} style={{ flexShrink: 0 }} />}
            <div>
              <p style={{ fontWeight: 700, color: correct ? C.green : C.red, margin: 0 }}>{correct ? 'ถูกต้อง!' : 'ไม่ถูกต้อง'}</p>
              {!correct && q?.explanation && (
                <p style={{ fontSize: 14, color: C.ink2, marginTop: 2, marginBottom: 0 }}>{q.explanation}</p>
              )}
            </div>
          </div>
        )}

        {(answered || noAnswerType) && (
          <button onClick={next}
            disabled={qt === 'micro-lesson' && microIdx < microCards.length - 1}
            style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(232,64,155,0.28)', opacity: (qt === 'micro-lesson' && microIdx < microCards.length - 1) ? 0.4 : 1, marginBottom: 24 }}>
            {current + 1 >= questions.length ? 'ดูผลลัพธ์' : 'ถัดไป'} <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DuolingoPage() {
  return <Suspense><DuolingoPageInner /></Suspense>;
}

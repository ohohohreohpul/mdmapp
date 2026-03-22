/**
 * ChartRenderer — renders charts from the manifest config object.
 *
 * Uses react-native-svg (already installed) for all chart types.
 * Supported: bar, line, donut, radar, treemap, histogram
 */
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect, Polyline, Path, Line as SvgLine, Circle, Text as SvgText, G } from 'react-native-svg';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ChartConfig {
  type: 'bar' | 'line' | 'donut' | 'pie' | 'radar' | 'treemap' | 'histogram';
  data: Record<string, any>[];
  title?: string;
  xKey?: string;
  yKey?: string;
  key?: string;
  valueKey?: string;
  nameKey?: string;
  valueKeys?: string[];
  bins?: number;
}

interface Props {
  config: ChartConfig;
  height?: number;
}

const PAL = ['#f573bd', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(0)}K`
  : String(Math.round(n));

// ─── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ config, w, h }: { config: ChartConfig; w: number; h: number }) {
  const xKey = config.xKey!;
  const yKey = config.yKey!;
  const data = config.data;
  const pad = { l: 36, r: 8, t: 12, b: 28 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const maxY = Math.max(...data.map(d => Number(d[yKey])));
  const barW = cw / data.length;
  const gap = barW * 0.2;

  return (
    <Svg width={w} height={h}>
      {/* Y grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = pad.t + ch * (1 - t);
        return (
          <G key={t}>
            <SvgLine x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#E5E7EB" strokeWidth={1} />
            <SvgText x={pad.l - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">
              {fmtNum(maxY * t)}
            </SvgText>
          </G>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const val = Number(d[yKey]);
        const barH = (val / maxY) * ch;
        const x = pad.l + i * barW + gap / 2;
        const y = pad.t + ch - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW - gap} height={barH} fill="#f573bd" rx={3} />
            <SvgText
              x={x + (barW - gap) / 2}
              y={h - pad.b + 12}
              fontSize={9}
              fill="#6B7280"
              textAnchor="middle"
            >
              {String(d[xKey]).length > 4 ? String(d[xKey]).slice(0, 4) : String(d[xKey])}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Line Chart ─────────────────────────────────────────────────────────────────
function LineChart({ config, w, h }: { config: ChartConfig; w: number; h: number }) {
  const xKey = config.xKey!;
  const yKey = config.yKey!;
  const data = config.data;
  const pad = { l: 36, r: 8, t: 12, b: 28 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const maxY = Math.max(...data.map(d => Number(d[yKey])));
  const minY = Math.min(...data.map(d => Number(d[yKey])));
  const range = maxY - minY || 1;

  const pts = data.map((d, i) => {
    const x = pad.l + (i / (data.length - 1)) * cw;
    const y = pad.t + ch - ((Number(d[yKey]) - minY) / range) * ch;
    return { x, y, label: String(d[xKey]) };
  });

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');

  // Fill path
  const fillPath = `M${pts[0].x},${pad.t + ch} ` +
    pts.map(p => `L${p.x},${p.y}`).join(' ') +
    ` L${pts[pts.length - 1].x},${pad.t + ch} Z`;

  return (
    <Svg width={w} height={h}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = pad.t + ch * (1 - t);
        const val = minY + range * t;
        return (
          <G key={t}>
            <SvgLine x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#E5E7EB" strokeWidth={1} />
            <SvgText x={pad.l - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">{fmtNum(val)}</SvgText>
          </G>
        );
      })}
      {/* Area fill */}
      <Path d={fillPath} fill="#f573bd" fillOpacity={0.12} />
      {/* Line */}
      <Polyline points={polyline} fill="none" stroke="#f573bd" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Dots + labels */}
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={3.5} fill="#f573bd" />
          <SvgText x={p.x} y={h - pad.b + 12} fontSize={9} fill="#6B7280" textAnchor="middle">
            {p.label.length > 4 ? p.label.slice(0, 4) : p.label}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ config, size }: { config: ChartConfig; size: number }) {
  // Accept both 'key' and 'nameKey' for the label field
  const keyField = config.key || config.nameKey || Object.keys(config.data[0] || {})[0];
  const valueKey = config.valueKey || config.yKey || Object.keys(config.data[0] || {})[1];
  const data = config.data;
  if (!data || data.length === 0) return null;
  const total = data.reduce((s, d) => s + Number(d[valueKey] || 0), 0);
  if (total === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 16;
  const innerR = outerR * 0.5;

  let startAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const val = Number(d[valueKey]);
    const angle = (val / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const slice = { label: String(d[keyField] ?? i), val, pct: Math.round((val / total) * 100), color: PAL[i % PAL.length], startAngle, endAngle };
    startAngle = endAngle;
    return slice;
  });

  // Correct SVG donut-slice path: outer arc CW → line to inner → inner arc CCW → Z
  const slicePath = (s: typeof slices[0]) => {
    const sa = s.startAngle;
    const ea = s.endAngle;
    const large = ea - sa > Math.PI ? 1 : 0;
    const ox1 = cx + outerR * Math.cos(sa);
    const oy1 = cy + outerR * Math.sin(sa);
    const ox2 = cx + outerR * Math.cos(ea);
    const oy2 = cy + outerR * Math.sin(ea);
    const ix1 = cx + innerR * Math.cos(ea);
    const iy1 = cy + innerR * Math.sin(ea);
    const ix2 = cx + innerR * Math.cos(sa);
    const iy2 = cy + innerR * Math.sin(sa);
    return `M${ox1},${oy1} A${outerR},${outerR},0,${large},1,${ox2},${oy2} L${ix1},${iy1} A${innerR},${innerR},0,${large},0,${ix2},${iy2} Z`;
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path key={i} d={slicePath(s)} fill={s.color} />
        ))}
      </Svg>
      {/* Legend */}
      <View style={styles.legendRow}>
        {slices.map(s => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label} {s.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Radar Chart ───────────────────────────────────────────────────────────────
function RadarChart({ config, size }: { config: ChartConfig; size: number }) {
  const keyField = config.key || Object.keys(config.data[0] || {})[0];
  const valueKeys = config.valueKeys || [];
  const data = config.data;
  const n = data.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 40;

  const allVals = data.flatMap(d => valueKeys.map(k => Number(d[k] || 0)));
  const maxVal = Math.max(...allVals, 1);

  const angleAt = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2;
  const pt = (i: number, ratio: number) =>
    `${cx + r * ratio * Math.cos(angleAt(i))},${cy + r * ratio * Math.sin(angleAt(i))}`;

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Legend */}
      <View style={styles.legendRow}>
        {valueKeys.map((k, i) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PAL[i % PAL.length] }]} />
            <Text style={styles.legendText}>{k}</Text>
          </View>
        ))}
      </View>
      <Svg width={size} height={size}>
        {/* Grid polygons */}
        {gridLevels.map(level => (
          <Path
            key={level}
            d={`M${Array.from({ length: n }, (_, i) => pt(i, level)).join(' L')} Z`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => (
          <SvgLine key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angleAt(i))} y2={cy + r * Math.sin(angleAt(i))} stroke="#E5E7EB" strokeWidth={1} />
        ))}
        {/* Series */}
        {valueKeys.map((k, ki) => {
          const points = data.map((d, i) => pt(i, Number(d[k] || 0) / maxVal)).join(' L');
          return (
            <G key={k}>
              <Path d={`M${points} Z`} fill={PAL[ki % PAL.length]} fillOpacity={0.15} stroke={PAL[ki % PAL.length]} strokeWidth={2} />
            </G>
          );
        })}
        {/* Axis labels */}
        {data.map((d, i) => {
          const angle = angleAt(i);
          const lx = cx + (r + 20) * Math.cos(angle);
          const ly = cy + (r + 20) * Math.sin(angle);
          return (
            <SvgText key={i} x={lx} y={ly} fontSize={10} fill="#374151" textAnchor="middle" alignmentBaseline="middle">
              {String(d[keyField]).length > 8 ? String(d[keyField]).slice(0, 8) + '…' : String(d[keyField])}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── Treemap ───────────────────────────────────────────────────────────────────
function TreemapChart({ config, w }: { config: ChartConfig; w: number }) {
  const nameKey = config.nameKey!;
  const valueKey = config.valueKey!;
  const data = [...config.data].sort((a, b) => Number(b[valueKey]) - Number(a[valueKey]));
  const total = data.reduce((s, d) => s + Number(d[valueKey]), 0);

  return (
    <View style={[styles.treemapWrap, { width: w }]}>
      {data.map((d, i) => {
        const pct = (Number(d[valueKey]) / total) * 100;
        return (
          <View
            key={i}
            style={[styles.treemapCell, {
              width: `${Math.max(pct, 10)}%` as any,
              backgroundColor: PAL[i % PAL.length],
            }]}
          >
            <Text style={styles.treemapLabel} numberOfLines={2}>{d[nameKey]}</Text>
            <Text style={styles.treemapValue}>{fmtNum(Number(d[valueKey]))}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Histogram ─────────────────────────────────────────────────────────────────
function HistogramChart({ config, w, h }: { config: ChartConfig; w: number; h: number }) {
  const numKey = Object.keys(config.data[0] || {}).find(k => typeof config.data[0][k] === 'number') || 'value';
  const values = config.data.map(d => Number(d[numKey]));
  const binCount = config.bins || 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const bw = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => {
    const lo = min + i * bw;
    const hi = lo + bw;
    return {
      label: `${Math.round(lo)}-${Math.round(hi)}`,
      count: values.filter(v => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)).length,
    };
  });

  // Reuse BarChart logic via config conversion
  const fakeConfig: ChartConfig = {
    type: 'bar',
    data: bins.map(b => ({ label: b.label, count: b.count })),
    xKey: 'label',
    yKey: 'count',
  };
  return <BarChart config={fakeConfig} w={w} h={h} />;
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function ChartRenderer({ config, height = 200 }: Props) {
  const { width: sw } = useWindowDimensions();
  const w = sw - 48;

  if (!config || !config.data) return null;

  // Normalise 'pie' → 'donut' and 'area' → 'line'
  const type = config.type === 'pie' ? 'donut' : config.type;

  try {
    return (
      <View style={styles.wrapper}>
        {config.title ? <Text style={styles.title}>{config.title}</Text> : null}

        {type === 'bar' && <BarChart config={config} w={w} h={height} />}
        {type === 'line' && <LineChart config={config} w={w} h={height} />}
        {(type === 'donut') && <DonutChart config={config} size={Math.min(w, 260)} />}
        {type === 'treemap' && <TreemapChart config={config} w={w} />}
        {type === 'histogram' && <HistogramChart config={config} w={w} h={height} />}
        {type === 'radar' && <RadarChart config={config} size={Math.min(w, 280)} />}
        {!['bar','line','donut','treemap','histogram','radar'].includes(type) && (
          <View style={styles.unsupportedChart}>
            <Text style={styles.unsupportedText}>📊 {config.title || 'กราฟ'}</Text>
          </View>
        )}
      </View>
    );
  } catch {
    return (
      <View style={styles.wrapper}>
        <View style={styles.unsupportedChart}>
          <Text style={styles.unsupportedText}>📊 {config.title || 'กราฟ'}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280', maxWidth: 110 },
  treemapWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, minHeight: 100 },
  treemapCell: { minHeight: 56, borderRadius: 8, padding: 6, justifyContent: 'center', alignItems: 'center' },
  treemapLabel: { fontSize: 11, color: '#fff', fontWeight: '700', textAlign: 'center' },
  treemapValue: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' },
  unsupportedChart: { minHeight: 80, justifyContent: 'center', alignItems: 'center' },
  unsupportedText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});

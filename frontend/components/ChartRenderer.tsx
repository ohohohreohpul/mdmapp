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
  type: string; // bar | line | donut | pie | radar | treemap | histogram | scatter | area | multi-line | stacked-bar | heatmap | funnel | dual-axis
  data: Record<string, any>[];
  title?: string;
  xKey?: string;
  yKey?: string | string[];
  yKey2?: string;
  key?: string;
  valueKey?: string;
  nameKey?: string;
  valueKeys?: string[];
  bins?: number;
  [key: string]: any;
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

// ─── Scatter Chart ─────────────────────────────────────────────────────────────
function ScatterChart({ config, w, h }: { config: ChartConfig; w: number; h: number }) {
  const xKey = config.xKey!;
  const yKey = config.yKey as string;
  const data = config.data;
  const pad = { l: 36, r: 8, t: 12, b: 28 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const xs = data.map(d => Number(d[xKey]));
  const ys = data.map(d => Number(d[yKey]));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rx = maxX - minX || 1, ry = maxY - minY || 1;
  const pts = data.map(d => ({
    cx: pad.l + ((Number(d[xKey]) - minX) / rx) * cw,
    cy: pad.t + ch - ((Number(d[yKey]) - minY) / ry) * ch,
  }));
  return (
    <Svg width={w} height={h}>
      {[0, 0.5, 1].map(t => {
        const y = pad.t + ch * (1 - t);
        return <G key={t}>
          <SvgLine x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#E5E7EB" strokeWidth={1} />
          <SvgText x={pad.l - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">{fmtNum(minY + ry * t)}</SvgText>
        </G>;
      })}
      {pts.map((p, i) => <Circle key={i} cx={p.cx} cy={p.cy} r={5} fill="#f573bd" fillOpacity={0.75} />)}
      <SvgText x={w / 2} y={h - 2} fontSize={9} fill="#6B7280" textAnchor="middle">{xKey}</SvgText>
    </Svg>
  );
}

// ─── Area Chart (multi-series stacked area) ─────────────────────────────────
function AreaChart({ config, w, h }: { config: ChartConfig; w: number; h: number }) {
  const xKey = config.xKey!;
  // yKey may be an array for multi-series area
  const seriesKeys: string[] = Array.isArray(config.yKey)
    ? (config.yKey as unknown as string[])
    : [config.yKey as string];
  const data = config.data;
  const pad = { l: 36, r: 8, t: 12, b: 36 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const allVals = data.flatMap(d => seriesKeys.map(k => Number(d[k] || 0)));
  const maxY = Math.max(...allVals, 1);

  const ptX = (i: number) => pad.l + (i / Math.max(data.length - 1, 1)) * cw;
  const ptY = (val: number) => pad.t + ch - (val / maxY) * ch;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={w} height={h}>
        {[0, 0.5, 1].map(t => {
          const y = pad.t + ch * (1 - t);
          return <G key={t}>
            <SvgLine x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#E5E7EB" strokeWidth={1} />
            <SvgText x={pad.l - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">{fmtNum(maxY * t)}</SvgText>
          </G>;
        })}
        {seriesKeys.map((key, ki) => {
          const fill = `${ptX(0)},${pad.t + ch} ` +
            data.map((d, i) => `${ptX(i)},${ptY(Number(d[key] || 0))}`).join(' ') +
            ` ${ptX(data.length - 1)},${pad.t + ch}`;
          const line = data.map((d, i) => `${ptX(i)},${ptY(Number(d[key] || 0))}`).join(' ');
          return <G key={key}>
            <Polyline points={fill} fill={PAL[ki % PAL.length]} fillOpacity={0.18} stroke="none" />
            <Polyline points={line} fill="none" stroke={PAL[ki % PAL.length]} strokeWidth={2} />
          </G>;
        })}
        {data.map((d, i) => (
          <SvgText key={i} x={ptX(i)} y={h - pad.b + 12} fontSize={9} fill="#6B7280" textAnchor="middle">
            {String(d[xKey]).length > 4 ? String(d[xKey]).slice(0, 4) : String(d[xKey])}
          </SvgText>
        ))}
      </Svg>
      {seriesKeys.length > 1 && (
        <View style={styles.legendRow}>
          {seriesKeys.map((k, i) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: PAL[i % PAL.length] }]} />
              <Text style={styles.legendText}>{k}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Multi-Line Chart ──────────────────────────────────────────────────────────
function MultiLineChart({ config, w, h }: { config: ChartConfig; w: number; h: number }) {
  const xKey = config.xKey!;
  const series = [config.yKey as string, (config as any).yKey2 as string].filter(Boolean);
  const data = config.data;
  const pad = { l: 36, r: 8, t: 12, b: 28 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const allVals = data.flatMap(d => series.map(k => Number(d[k] || 0)));
  const minY = Math.min(...allVals), maxY = Math.max(...allVals, 1);
  const range = maxY - minY || 1;
  const ptX = (i: number) => pad.l + (i / Math.max(data.length - 1, 1)) * cw;
  const ptY = (val: number) => pad.t + ch - ((val - minY) / range) * ch;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={w} height={h}>
        {[0, 0.5, 1].map(t => {
          const y = pad.t + ch * (1 - t);
          return <G key={t}>
            <SvgLine x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#E5E7EB" strokeWidth={1} />
            <SvgText x={pad.l - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">{fmtNum(minY + range * t)}</SvgText>
          </G>;
        })}
        {series.map((key, ki) => {
          const pts = data.map((d, i) => `${ptX(i)},${ptY(Number(d[key] || 0))}`).join(' ');
          return <G key={key}>
            <Polyline points={pts} fill="none" stroke={PAL[ki % PAL.length]} strokeWidth={2.5} />
            {data.map((d, i) => <Circle key={i} cx={ptX(i)} cy={ptY(Number(d[key] || 0))} r={3} fill={PAL[ki % PAL.length]} />)}
          </G>;
        })}
        {data.map((d, i) => (
          <SvgText key={i} x={ptX(i)} y={h - pad.b + 12} fontSize={9} fill="#6B7280" textAnchor="middle">
            {String(d[xKey]).length > 4 ? String(d[xKey]).slice(0, 4) : String(d[xKey])}
          </SvgText>
        ))}
      </Svg>
      <View style={styles.legendRow}>
        {series.map((k, i) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PAL[i % PAL.length] }]} />
            <Text style={styles.legendText}>{k}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Stacked Bar Chart ─────────────────────────────────────────────────────────
function StackedBarChart({ config, w, h }: { config: ChartConfig; w: number; h: number }) {
  const xKey = config.xKey!;
  const series = [config.yKey as string, (config as any).yKey2 as string].filter(Boolean);
  const data = config.data;
  const pad = { l: 36, r: 8, t: 12, b: 28 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const totals = data.map(d => series.reduce((s, k) => s + Number(d[k] || 0), 0));
  const maxY = Math.max(...totals, 1);
  const barW = cw / data.length;
  const gap = barW * 0.2;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={w} height={h}>
        {[0, 0.5, 1].map(t => {
          const y = pad.t + ch * (1 - t);
          return <G key={t}>
            <SvgLine x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#E5E7EB" strokeWidth={1} />
            <SvgText x={pad.l - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">{fmtNum(maxY * t)}</SvgText>
          </G>;
        })}
        {data.map((d, i) => {
          const x = pad.l + i * barW + gap / 2;
          let bottom = pad.t + ch;
          return <G key={i}>
            {series.map((key, ki) => {
              const val = Number(d[key] || 0);
              const bh = (val / maxY) * ch;
              bottom -= bh;
              return <Rect key={key} x={x} y={bottom} width={barW - gap} height={bh} fill={PAL[ki % PAL.length]} rx={ki === series.length - 1 ? 3 : 0} />;
            })}
            <SvgText x={x + (barW - gap) / 2} y={h - pad.b + 12} fontSize={9} fill="#6B7280" textAnchor="middle">
              {String(d[xKey]).length > 4 ? String(d[xKey]).slice(0, 4) : String(d[xKey])}
            </SvgText>
          </G>;
        })}
      </Svg>
      <View style={styles.legendRow}>
        {series.map((k, i) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: PAL[i % PAL.length] }]} />
            <Text style={styles.legendText}>{k}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────
function HeatmapChart({ config, w }: { config: ChartConfig; w: number }) {
  const rows = config.data;
  if (!rows || rows.length === 0) return null;
  const cols = (rows[0].data as any[]).map((c: any) => c.x);
  const allVals = rows.flatMap(r => (r.data as any[]).map((c: any) => Number(c.y)));
  const minV = Math.min(...allVals), maxV = Math.max(...allVals, 1);
  const cellW = Math.max((w - 52) / cols.length, 20);
  const cellH = 22;
  const labelW = 48;
  return (
    <View style={{ width: w }}>
      {/* Column headers */}
      <View style={{ flexDirection: 'row', marginLeft: labelW }}>
        {cols.map((c: string) => (
          <Text key={c} style={{ width: cellW, fontSize: 8, color: '#9CA3AF', textAlign: 'center' }} numberOfLines={1}>{c}</Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={{ width: labelW, fontSize: 9, color: '#6B7280' }} numberOfLines={1}>{row[config.yKey as string] || row.id}</Text>
          {(row.data as any[]).map((cell: any, ci: number) => {
            const intensity = (Number(cell.y) - minV) / (maxV - minV);
            const alpha = Math.round(40 + intensity * 200);
            return (
              <View key={ci} style={{ width: cellW, height: cellH, backgroundColor: `rgba(245,115,189,${(alpha / 255).toFixed(2)})`, borderRadius: 3, marginHorizontal: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 7, color: intensity > 0.6 ? '#fff' : '#374151' }}>{cell.y}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Funnel Chart ─────────────────────────────────────────────────────────────
function FunnelChart({ config, w }: { config: ChartConfig; w: number }) {
  const nameKey = config.nameKey || config.xKey || 'stage';
  const valueKey = config.valueKey || config.yKey as string || 'value';
  const data = config.data;
  const maxVal = Math.max(...data.map(d => Number(d[valueKey])), 1);
  const barH = 32;
  const gap = 4;
  return (
    <View style={{ width: w, alignItems: 'center' }}>
      {data.map((d, i) => {
        const pct = Number(d[valueKey]) / maxVal;
        const barW = Math.max(pct * (w - 40), 60);
        return (
          <View key={i} style={{ alignItems: 'center', marginBottom: gap }}>
            <View style={{ width: barW, height: barH, backgroundColor: PAL[i % PAL.length], borderRadius: 6, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }} numberOfLines={1}>{d[nameKey]}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10 }}>{fmtNum(Number(d[valueKey]))}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Dual-Axis Chart (bars + line) ────────────────────────────────────────────
function DualAxisChart({ config, w, h }: { config: ChartConfig; w: number; h: number }) {
  const xKey = config.xKey!;
  const yKey = config.yKey as string;
  const yKey2 = (config as any).yKey2 as string;
  const data = config.data;
  const pad = { l: 36, r: 36, t: 12, b: 28 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const barVals = data.map(d => Number(d[yKey] || 0));
  const lineVals = data.map(d => Number(d[yKey2] || 0));
  const maxBar = Math.max(...barVals, 1);
  const minLine = Math.min(...lineVals), maxLine = Math.max(...lineVals, 1);
  const rangeL = maxLine - minLine || 1;
  const barW = cw / data.length;
  const gap = barW * 0.25;
  const ptX = (i: number) => pad.l + i * barW + barW / 2;
  const ptY = (val: number) => pad.t + ch - ((val - minLine) / rangeL) * ch;
  const linePts = data.map((d, i) => `${ptX(i)},${ptY(Number(d[yKey2] || 0))}`).join(' ');
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={w} height={h}>
        {[0, 0.5, 1].map(t => {
          const y = pad.t + ch * (1 - t);
          return <G key={t}>
            <SvgLine x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#E5E7EB" strokeWidth={1} />
            <SvgText x={pad.l - 4} y={y + 4} fontSize={9} fill="#9CA3AF" textAnchor="end">{fmtNum(maxBar * t)}</SvgText>
            <SvgText x={w - pad.r + 4} y={y + 4} fontSize={9} fill="#6366f1" textAnchor="start">{fmtNum(minLine + rangeL * t)}</SvgText>
          </G>;
        })}
        {data.map((d, i) => {
          const bh = (Number(d[yKey] || 0) / maxBar) * ch;
          const x = pad.l + i * barW + gap / 2;
          return <G key={i}>
            <Rect x={x} y={pad.t + ch - bh} width={barW - gap} height={bh} fill="#f573bd" fillOpacity={0.8} rx={3} />
            <SvgText x={ptX(i)} y={h - pad.b + 12} fontSize={9} fill="#6B7280" textAnchor="middle">
              {String(d[xKey]).length > 4 ? String(d[xKey]).slice(0, 4) : String(d[xKey])}
            </SvgText>
          </G>;
        })}
        <Polyline points={linePts} fill="none" stroke="#6366f1" strokeWidth={2.5} />
        {data.map((d, i) => <Circle key={i} cx={ptX(i)} cy={ptY(Number(d[yKey2] || 0))} r={3.5} fill="#6366f1" />)}
      </Svg>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f573bd' }]} /><Text style={styles.legendText}>{yKey}</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} /><Text style={styles.legendText}>{yKey2}</Text></View>
      </View>
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

  // Normalise aliases
  const type = config.type === 'pie' ? 'donut' : config.type;

  const SUPPORTED = ['bar','line','donut','treemap','histogram','radar','scatter','area','multi-line','stacked-bar','heatmap','funnel','dual-axis'];

  try {
    return (
      <View style={styles.wrapper}>
        {config.title ? <Text style={styles.title}>{config.title}</Text> : null}

        {type === 'bar'          && <BarChart config={config} w={w} h={height} />}
        {type === 'line'         && <LineChart config={config} w={w} h={height} />}
        {type === 'donut'        && <DonutChart config={config} size={Math.min(w, 260)} />}
        {type === 'treemap'      && <TreemapChart config={config} w={w} />}
        {type === 'histogram'    && <HistogramChart config={config} w={w} h={height} />}
        {type === 'radar'        && <RadarChart config={config} size={Math.min(w, 280)} />}
        {type === 'scatter'      && <ScatterChart config={config} w={w} h={height} />}
        {type === 'area'         && <AreaChart config={config} w={w} h={height} />}
        {type === 'multi-line'   && <MultiLineChart config={config} w={w} h={height} />}
        {type === 'stacked-bar'  && <StackedBarChart config={config} w={w} h={height} />}
        {type === 'heatmap'      && <HeatmapChart config={config} w={w} />}
        {type === 'funnel'       && <FunnelChart config={config} w={w} />}
        {type === 'dual-axis'    && <DualAxisChart config={config} w={w} h={height} />}
        {!SUPPORTED.includes(type) && (
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

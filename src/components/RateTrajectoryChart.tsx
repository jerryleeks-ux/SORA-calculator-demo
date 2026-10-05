import React, { useState, useMemo } from 'react';
import { SoraRateRecord } from '../types/sora';
import { formatPercent } from '../utils/soraMath';
import { TrendingUp, BarChart3, Download, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface RateTrajectoryChartProps {
  data: SoraRateRecord[];
}

export const RateTrajectoryChart: React.FC<RateTrajectoryChartProps> = ({ data }) => {
  const [filterPeriod, setFilterPeriod] = useState<'30D' | '60D' | 'ALL'>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<SoraRateRecord | null>(null);

  // Chronological order for chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sliceCount = filterPeriod === '30D' ? 22 : filterPeriod === '60D' ? 44 : data.length;
    return [...data.slice(0, sliceCount)].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, filterPeriod]);

  // Statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0, avg: 0, latest: 0 };
    const rates = chartData.map(d => d.sora);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = rates.reduce((acc, v) => acc + v, 0) / rates.length;
    const latest = chartData[chartData.length - 1].sora;
    return { min, max, avg, latest };
  }, [chartData]);

  // SVG Chart dimensions
  const svgWidth = 800;
  const svgHeight = 260;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };

  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Min and max for Y-axis scale (with 10bps buffer)
  const minY = Math.max(0, Math.floor((stats.min - 0.1) * 10) / 10);
  const maxY = Math.ceil((stats.max + 0.1) * 10) / 10;
  const rangeY = maxY - minY || 1;

  const getX = (index: number) => {
    if (chartData.length <= 1) return padding.left;
    return padding.left + (index / (chartData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - minY) / rangeY) * innerHeight;
  };

  // Generate paths for Daily SORA and 3M Compounded SORA
  const dailyPath = useMemo(() => {
    if (chartData.length === 0) return '';
    return chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.sora)}`).join(' ');
  }, [chartData, minY, rangeY]);

  const compound3mPath = useMemo(() => {
    if (chartData.length === 0) return '';
    const pointsWith3m = chartData.filter(d => d.sora_compound_3m !== undefined);
    if (pointsWith3m.length === 0) return '';
    return chartData
      .map((d, i) => {
        const val = d.sora_compound_3m ?? d.sora;
        return `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`;
      })
      .join(' ');
  }, [chartData, minY, rangeY]);

  // Area fill under daily curve
  const areaPath = useMemo(() => {
    if (chartData.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(chartData.length - 1);
    const bottomY = padding.top + innerHeight;
    return `${dailyPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [dailyPath, chartData, innerHeight]);

  // Export MAS raw data
  const handleExportData = () => {
    const headers = [
      'Date',
      'Overnight SORA (%)',
      '1M Compounded SORA (%)',
      '3M Compounded SORA (%)',
      '6M Compounded SORA (%)',
      'SORA Index',
      'Volume (SGD M)'
    ];

    const rows = chartData.map(d => [
      d.date,
      d.sora.toFixed(4),
      d.sora_compound_1m?.toFixed(4) || '',
      d.sora_compound_3m?.toFixed(4) || '',
      d.sora_compound_6m?.toFixed(4) || '',
      d.sora_index?.toFixed(5) || '',
      d.aggregate_volume || ''
    ]);

    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encoded = encodeURI(csv);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `MAS_SORA_Historical_Rates.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400">Latest Overnight Rate</span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {formatPercent(stats.latest, 4)}
          </div>
          <span className="text-[11px] text-slate-500">Most recent MAS fixing</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400">Period Average SORA</span>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1">
            {formatPercent(stats.avg, 4)}
          </div>
          <span className="text-[11px] text-slate-500">Mean overnight rate</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400">Period Low</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {formatPercent(stats.min, 4)}
          </div>
          <span className="text-[11px] text-slate-500">Lowest published fixing</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs font-semibold text-slate-400">Period High</span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {formatPercent(stats.max, 4)}
          </div>
          <span className="text-[11px] text-slate-500">Highest published fixing</span>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-rose-400" />
              SORA Rate Trajectory: Daily Overnight vs 3M Compounded
            </h3>
            <p className="text-xs text-slate-400">
              Notice how 3M Compounded SORA filters out daily interbank volatility for stable borrower installments
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterPeriod('30D')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterPeriod === '30D' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('60D')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterPeriod === '60D' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                60 Days
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  filterPeriod === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Series
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-400" />
              CSV
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-rose-500 rounded"></span>
            <span className="text-slate-300">Daily Overnight SORA</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-blue-400 rounded"></span>
            <span className="text-slate-300">3-Month Compounded SORA</span>
          </div>
          {hoveredPoint && (
            <div className="ml-auto font-mono text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-200">
              <span className="text-slate-400 mr-2">{hoveredPoint.date}:</span>
              <span className="text-rose-400 font-bold mr-2">Daily: {formatPercent(hoveredPoint.sora, 4)}</span>
              {hoveredPoint.sora_compound_3m && (
                <span className="text-blue-400">3M: {formatPercent(hoveredPoint.sora_compound_3m, 4)}</span>
              )}
            </div>
          )}
        </div>

        {/* Responsive SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[600px] select-none"
          >
            <defs>
              <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const val = minY + ratio * rangeY;
              const y = getY(val);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="3 3"
                    strokeWidth="0.8"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {val.toFixed(2)}%
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#roseGradient)" />}

            {/* Daily Line */}
            {dailyPath && (
              <path
                d={dailyPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* 3M Line */}
            {compound3mPath && (
              <path
                d={compound3mPath}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Points */}
            {chartData.map((d, i) => {
              const cx = getX(i);
              const cy = getY(d.sora);
              return (
                <g key={d.date}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hoveredPoint?.date === d.date ? 5 : 3}
                    fill="#f43f5e"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(d)}
                  />
                  {/* Date labels on X-axis (every few points) */}
                  {i % Math.ceil(chartData.length / 6) === 0 && (
                    <text
                      x={cx}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {d.date.slice(5)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

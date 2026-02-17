'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';

interface EnhancedLineChartProps {
  data: any[];
  xKey: string;
  yKeys: { key: string; color: string; name: string; gradient?: boolean }[];
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  showGradient?: boolean;
  curve?: 'monotone' | 'linear' | 'step';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            </div>
            <span className="font-bold" style={{ color: entry.color }}>
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function EnhancedLineChart({
  data,
  xKey,
  yKeys,
  height = 350,
  xAxisLabel,
  yAxisLabel,
  showLegend = true,
  showGrid = true,
  showDots = true,
  showGradient = true,
  curve = 'monotone',
}: EnhancedLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {yKeys.map((yKey, index) => (
            <linearGradient key={index} id={`gradient-${yKey.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={yKey.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={yKey.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-gray-200 dark:stroke-gray-700"
            opacity={0.3}
          />
        )}

        <XAxis
          dataKey={xKey}
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fill: '#e5e7eb' } : undefined}
          className="text-xs"
          tick={{ fontSize: 11, fill: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
        />

        <YAxis
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#e5e7eb' } : undefined}
          className="text-xs"
          tick={{ fontSize: 11, fill: '#e5e7eb' }}
          tickLine={{ stroke: '#e5e7eb' }}
        />

        <Tooltip content={<CustomTooltip />} />

        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '20px', color: '#e5e7eb' }}
            iconType="circle"
          />
        )}

        {showGradient && yKeys.map((yKey, index) => (
          <Area
            key={`area-${index}`}
            type={curve}
            dataKey={yKey.key}
            stroke="none"
            fill={`url(#gradient-${yKey.key})`}
          />
        ))}

        {yKeys.map((yKey, index) => (
          <Line
            key={index}
            type={curve}
            dataKey={yKey.key}
            stroke={yKey.color}
            strokeWidth={3}
            dot={showDots ? { fill: yKey.color, strokeWidth: 2, r: 4 } : false}
            activeDot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: yKey.color }}
            name={yKey.name}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

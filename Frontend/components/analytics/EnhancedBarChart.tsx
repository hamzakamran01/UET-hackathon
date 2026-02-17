'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LabelList,
} from 'recharts';

interface EnhancedBarChartProps {
  data: any[];
  xKey: string;
  yKeys: { key: string; color: string; name: string }[];
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  layout?: 'horizontal' | 'vertical';
  customColors?: string[];
  showValues?: boolean;
  stackedBars?: boolean;
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

const renderCustomLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="#e5e7eb"
      textAnchor="middle"
      fontSize={11}
      fontWeight="600"
    >
      {value}
    </text>
  );
};

export default function EnhancedBarChart({
  data,
  xKey,
  yKeys,
  height = 350,
  xAxisLabel,
  yAxisLabel,
  showLegend = true,
  showGrid = true,
  layout = 'horizontal',
  customColors,
  showValues = false,
  stackedBars = false,
}: EnhancedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 20, right: 30, left: layout === 'vertical' ? 100 : 0, bottom: 5 }}
      >
        <defs>
          {yKeys.map((yKey, index) => (
            <linearGradient key={index} id={`barGradient-${yKey.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={yKey.color} stopOpacity={0.9} />
              <stop offset="95%" stopColor={yKey.color} stopOpacity={0.6} />
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

        {layout === 'horizontal' ? (
          <>
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
          </>
        ) : (
          <>
            <XAxis
              type="number"
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fill: '#e5e7eb' } : undefined}
              className="text-xs"
              tick={{ fontSize: 11, fill: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#e5e7eb' } : undefined}
              className="text-xs"
              tick={{ fontSize: 11, fill: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
              width={90}
            />
          </>
        )}

        <Tooltip content={<CustomTooltip />} />

        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '20px', color: '#e5e7eb' }}
            iconType="circle"
          />
        )}

        {yKeys.map((yKey, index) => (
          <Bar
            key={yKey.key}
            dataKey={yKey.key}
            fill={`url(#barGradient-${yKey.key})`}
            name={yKey.name}
            radius={[8, 8, 0, 0]}
            stackId={stackedBars ? 'stack' : undefined}
          >
            {showValues && <LabelList content={renderCustomLabel} />}
            {customColors &&
              data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={customColors[i % customColors.length]} />
              ))}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

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
} from 'recharts';

interface BarChartProps {
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
}

export default function BarChart({
  data,
  xKey,
  yKeys,
  height = 300,
  xAxisLabel,
  yAxisLabel,
  showLegend = true,
  showGrid = true,
  layout = 'horizontal',
  customColors,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 10, right: 30, left: layout === 'vertical' ? 100 : 0, bottom: 0 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />}
        {layout === 'horizontal' ? (
          <>
            <XAxis
              dataKey={xKey}
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
              className="text-xs fill-gray-600 dark:fill-gray-400"
            />
            <YAxis
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              className="text-xs fill-gray-600 dark:fill-gray-400"
            />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
              className="text-xs fill-gray-600 dark:fill-gray-400"
            />
            <YAxis
              type="category"
              dataKey={xKey}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              className="text-xs fill-gray-600 dark:fill-gray-400"
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '0.75rem',
          }}
        />
        {showLegend && <Legend />}
        {yKeys.map((yKey, index) => (
          <Bar key={yKey.key} dataKey={yKey.key} fill={yKey.color} name={yKey.name} radius={[4, 4, 0, 0]}>
            {customColors &&
              data.map((entry, i) => <Cell key={`cell-${i}`} fill={customColors[i % customColors.length]} />)}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

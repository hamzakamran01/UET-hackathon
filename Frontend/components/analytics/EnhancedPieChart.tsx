'use client';

import React, { useState } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector,
} from 'recharts';

interface EnhancedPieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  colors: string[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  showPercentage?: boolean;
  animate?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.name}</p>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Value:</span>
          <span className="font-bold" style={{ color: data.payload.fill }}>
            {typeof data.value === 'number'
              ? data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : data.value}
          </span>
        </div>
        {data.payload.percentage !== undefined && (
          <div className="flex items-center justify-between gap-4 text-sm mt-1">
            <span className="text-gray-600 dark:text-gray-400">Percentage:</span>
            <span className="font-bold" style={{ color: data.payload.fill }}>
              {data.payload.percentage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-xl"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show label if less than 5%

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-bold drop-shadow-lg"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function EnhancedPieChart({
  data,
  dataKey,
  nameKey,
  colors,
  height = 350,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 100,
  showPercentage = true,
  animate = true,
}: EnhancedPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item[dataKey], 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: (item[dataKey] / total) * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <defs>
          {colors.map((color, index) => (
            <linearGradient key={index} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.9} />
              <stop offset="95%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
          ))}
        </defs>

        <Pie
          data={dataWithPercentage}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showPercentage ? renderCustomizedLabel : false}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          onMouseEnter={onPieEnter}
          onMouseLeave={onPieLeave}
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          animationBegin={0}
          animationDuration={animate ? 800 : 0}
        >
          {dataWithPercentage.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`url(#pieGradient-${index % colors.length})`}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>

        <Tooltip content={<CustomTooltip />} />

        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: '10px', color: '#e5e7eb' }}
            iconType="circle"
            formatter={(value, entry: any) => {
              const percentage = entry.payload.percentage || 0;
              return `${value} (${percentage.toFixed(1)}%)`;
            }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

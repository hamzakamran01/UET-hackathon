'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { KPIMetric } from '@/types/analytics';

interface KPICardProps {
  metric: KPIMetric;
  icon?: LucideIcon;
  colorScheme?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const colorSchemes = {
  blue: {
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
    text: 'text-blue-600',
  },
  green: {
    bg: 'from-green-500/10 to-green-600/5',
    border: 'border-green-500/20',
    icon: 'text-green-500',
    text: 'text-green-600',
  },
  yellow: {
    bg: 'from-yellow-500/10 to-yellow-600/5',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-500',
    text: 'text-yellow-600',
  },
  red: {
    bg: 'from-red-500/10 to-red-600/5',
    border: 'border-red-500/20',
    icon: 'text-red-500',
    text: 'text-red-600',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20',
    icon: 'text-purple-500',
    text: 'text-purple-600',
  },
};

const statusColors = {
  success: 'text-green-400',
  warning: 'text-yellow-400',
  danger: 'text-red-400',
  info: 'text-blue-400',
};

export default function KPICard({
  metric,
  icon: Icon,
  colorScheme = 'blue',
}: KPICardProps) {
  const colors = colorSchemes[colorScheme];

  const getTrendIcon = () => {
    if (!metric.trend) return null;

    switch (metric.trend.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    if (!metric.trend) return '';

    switch (metric.trend.direction) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} backdrop-blur-sm p-6 hover:shadow-lg transition-shadow`}
    >
      {/* Icon */}
      {Icon && (
        <div className="absolute top-4 right-4 opacity-20">
          <Icon className={`w-12 h-12 ${colors.icon}`} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Label */}
        <p className="text-sm font-medium text-gray-300 mb-2">
          {metric.label}
        </p>

        {/* Value */}
        <div className="flex items-baseline gap-2 mb-3">
          <h3
            className={`text-3xl font-bold ${metric.status
              ? statusColors[metric.status]
              : 'text-white'
              }`}
          >
            {metric.value}
          </h3>
          {metric.unit && (
            <span className="text-lg font-medium text-gray-200">
              {metric.unit}
            </span>
          )}
        </div>

        {/* Trend Indicator */}
        {metric.trend && (
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {metric.trend.percentage}%
            </span>
            <span className="text-xs text-gray-300">
              vs {metric.trend.comparisonPeriod}
            </span>
          </div>
        )}

        {/* Target Indicator */}
        {metric.target !== undefined && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300">Target: {metric.target}{metric.unit}</span>
              <span
                className={
                  typeof metric.value === 'number' && metric.value >= metric.target
                    ? 'text-green-400 font-medium'
                    : 'text-red-400 font-medium'
                }
              >
                {typeof metric.value === 'number' &&
                  (metric.value >= metric.target ? '✓ On Track' : '⚠ Below Target')}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

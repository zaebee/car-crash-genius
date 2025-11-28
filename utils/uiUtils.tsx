import React from 'react';
import { AlertTriangle, AlertCircle, Activity, CheckCircle2 } from 'lucide-react';

export const getSeverityStyles = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      bar: 'bg-red-600',
      hoverBorder: 'hover:border-red-400',
      shadow: 'hover:shadow-red-100',
      icon: <AlertTriangle size={18} className="text-red-700" />,
      boxColor: 'rgba(239, 68, 68, 0.4)',
      boxBorder: '#ef4444'
    };
    case 'high': return {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      bar: 'bg-orange-600',
      hoverBorder: 'hover:border-orange-400',
      shadow: 'hover:shadow-orange-100',
      icon: <AlertCircle size={18} className="text-orange-700" />,
      boxColor: 'rgba(249, 115, 22, 0.4)',
      boxBorder: '#f97316'
    };
    case 'medium': return {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      bar: 'bg-amber-500',
      hoverBorder: 'hover:border-amber-400',
      shadow: 'hover:shadow-amber-100',
      icon: <Activity size={18} className="text-amber-700" />,
      boxColor: 'rgba(245, 158, 11, 0.4)',
      boxBorder: '#f59e0b'
    };
    case 'low':
    default: return {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      bar: 'bg-emerald-500',
      hoverBorder: 'hover:border-emerald-400',
      shadow: 'hover:shadow-emerald-100',
      icon: <CheckCircle2 size={18} className="text-emerald-700" />,
      boxColor: 'rgba(16, 185, 129, 0.4)',
      boxBorder: '#10b981'
    };
  }
};
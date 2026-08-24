import React from 'react';
import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const getColors = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'CONFIRMED':
      case 'APPROVED':
      case 'SUCCESS':
      case 'ACTIVE':
      case 'PUBLISHED':
        return {
          bg: '#ecfdf5',
          color: '#059669',
          border: '#a7f3d0',
        };
      case 'PENDING':
      case 'INITIATED':
        return {
          bg: '#fffbeb',
          color: '#d97706',
          border: '#fde68a',
        };
      case 'COMPLETED':
        return {
          bg: '#eff6ff',
          color: '#2563eb',
          border: '#bfdbfe',
        };
      case 'CANCELLED':
      case 'REJECTED':
      case 'FAILED':
      case 'SUSPENDED':
        return {
          bg: '#fef2f2',
          color: '#dc2626',
          border: '#fecaca',
        };
      case 'NO_SHOW':
        return {
          bg: '#f5f3ff',
          color: '#7c3aed',
          border: '#ddd6fe',
        };
      case 'REFUNDED':
        return {
          bg: '#f0fdf4',
          color: '#16a34a',
          border: '#bbf7d0',
        };
      case 'DRAFT':
        return {
          bg: '#f8fafc',
          color: '#64748b',
          border: '#e2e8f0',
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
        };
    }
  };

  const style = getColors(status);

  return (
    <Chip
      label={status?.replace('_', ' ')}
      size={size}
      sx={{
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
      }}
    />
  );
};

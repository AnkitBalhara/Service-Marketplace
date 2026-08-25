import React from 'react';
import { CircularProgress } from '@mui/material';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center">
      <CircularProgress size={40} thickness={4} sx={{ color: '#4f46e5' }} />
      <p className="mt-4 text-sm font-medium text-slate-600 animate-pulse">{message}</p>
    </div>
  );
};

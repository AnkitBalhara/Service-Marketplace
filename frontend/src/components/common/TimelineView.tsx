import React from 'react';
import { BookingTimelineItem } from '../../types';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { Clock, User, ArrowRight, Info } from 'lucide-react';

interface TimelineViewProps {
  items: BookingTimelineItem[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-500 italic">No timeline entries recorded.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {items.map((item, idx) => (
        <div key={item._id || idx} className="relative group">
          {/* Dot */}
          <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-indigo-600 bg-white group-hover:bg-indigo-600 transition-colors flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 group-hover:bg-white" />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 shadow-sm">
            {/* Header: Status transition */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {item.fromStatus && (
                <>
                  <StatusBadge status={item.fromStatus} size="small" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </>
              )}
              <StatusBadge status={item.toStatus} size="small" />
              <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.createdAt ? format(new Date(item.createdAt), 'MMM dd, yyyy · hh:mm a') : ''}
              </span>
            </div>

            {/* Actor info */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>By: <strong className="text-slate-800">{item.changedByUserId?.name || 'System'}</strong> ({item.changedByUserId?.email || 'system'})</span>
            </div>

            {/* Optional Reason / Notes */}
            {item.reason && (
              <div className="mt-2 text-xs bg-white border border-slate-200/80 rounded p-2 text-slate-700 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                <span>{item.reason}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

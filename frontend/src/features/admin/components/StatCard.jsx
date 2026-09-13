import React from 'react';

const StatCard = ({ title, value, icon: Icon, subtext, color = 'teal', loading = false }) => {
  const colorMap = {
    teal: {
      iconBg: 'bg-teal-50 text-teal-700 border-teal-100/80',
      badgeDot: 'bg-teal-500'
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-700 border-blue-100/80',
      badgeDot: 'bg-blue-500'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-700 border-amber-100/80',
      badgeDot: 'bg-amber-500'
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100/80',
      badgeDot: 'bg-emerald-500'
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-700 border-purple-100/80',
      badgeDot: 'bg-purple-500'
    }
  };

  const scheme = colorMap[color] || colorMap.teal;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-500 font-cairo tracking-tight block">
            {title}
          </span>
          {loading ? (
            <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse my-1.5"></div>
          ) : (
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-cairo tracking-tight">
              {typeof value === 'number' ? value.toLocaleString('ar-EG') : value ?? 0}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-200 ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtext && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${scheme.badgeDot}`}></span>
          <p className="text-[11px] text-slate-500 font-cairo font-medium truncate">
            {subtext}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatCard;

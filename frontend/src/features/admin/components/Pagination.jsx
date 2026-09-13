import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, totalRecords, onPageChange, limit }) => {
  if (totalPages <= 1 && (!totalRecords || totalRecords <= limit)) {
    return null;
  }

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords || 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/70 border-t border-slate-200/80 text-xs font-cairo text-slate-600">
      <div>
        {totalRecords !== undefined ? (
          <span>
            عرض <strong className="text-slate-900 font-bold">{startRecord.toLocaleString('ar-EG')}</strong> إلى{' '}
            <strong className="text-slate-900 font-bold">{endRecord.toLocaleString('ar-EG')}</strong> من إجمالي{' '}
            <strong className="text-slate-900 font-bold">{totalRecords.toLocaleString('ar-EG')}</strong> سجل
          </span>
        ) : (
          <span>الصفحة {currentPage.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-all shadow-2xs"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          <span>السابق</span>
        </button>

        <span className="px-3 py-1 bg-teal-50/80 border border-teal-200/70 rounded-lg font-bold text-teal-800 text-xs shadow-2xs">
          {currentPage.toLocaleString('ar-EG')} / {totalPages.toLocaleString('ar-EG')}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-all shadow-2xs"
        >
          <span>التالي</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

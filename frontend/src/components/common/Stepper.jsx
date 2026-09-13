import React from 'react';
import { Check, ChevronLeft } from 'lucide-react';

export const STEPS = [
  { number: 1, title: 'الغلاف', short: 'الغلاف' },
  { number: 2, title: 'المقدمة والخطة', short: 'المقدمة' },
  { number: 3, title: 'هيكلية البحث', short: 'الهيكلية' },
  { number: 4, title: 'محتوى المطالب', short: 'المطالب' },
  { number: 5, title: 'الخاتمة', short: 'الخاتمة' },
  { number: 6, title: 'المصادر والمراجع', short: 'المراجع' },
  { number: 7, title: 'فهرس الموضوعات', short: 'الفهرس' },
  { number: 8, title: 'معاينة البحث', short: 'المعاينة' },
  { number: 9, title: 'تصدير PDF', short: 'التصدير' }
];

const Stepper = ({ currentStep, onStepClick, maxUnlockedStep = 10 }) => {
  return (
    <div className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3 px-4 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-2 pb-1 scrollbar-thin">
        {STEPS.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isAccessible = step.number <= maxUnlockedStep;

          return (
            <React.Fragment key={step.number}>
              <button
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && onStepClick && onStepClick(step.number)}
                className={`step-node ${isActive ? 'active' : isCompleted ? 'completed' : 'pending'} ${
                  !isAccessible ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : step.number}
                </span>
                <span className="hidden sm:inline font-cairo">{step.title}</span>
                <span className="inline sm:hidden font-cairo">{step.short}</span>
              </button>

              {idx < STEPS.length - 1 && (
                <ChevronLeft className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 hidden md:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;

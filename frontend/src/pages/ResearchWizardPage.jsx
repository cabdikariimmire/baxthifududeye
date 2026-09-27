import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Stepper from '../components/common/Stepper';
import Step1Cover from '../features/research/steps/Step1Cover';
import Step2Introduction from '../features/research/steps/Step2Introduction';
import Step3StructureReview from '../features/research/steps/Step3StructureReview';
import Step4TopicContent from '../features/research/steps/Step4TopicContent';
import Step6Conclusion from '../features/research/steps/Step6Conclusion';
import Step7References from '../features/research/steps/Step7References';
import Step8TOC from '../features/research/steps/Step8TOC';
import Step9Preview from '../features/research/steps/Step9Preview';
import Step10Export from '../features/research/steps/Step10Export';
import AIDocumentModal from '../features/research/AIDocumentModal';
import api from '../services/api';
import { AlertCircle, RotateCcw, LayoutDashboard, Sparkles } from 'lucide-react';

const ResearchWizardPage = () => {
  const { id, stepId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isNew = !id || id === 'new' || location.pathname === '/research/new';

  const [research, setResearch] = useState(null);
  const [currentStep, setCurrentStep] = useState(parseInt(stepId || '1', 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [targetPageForPreview, setTargetPageForPreview] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Ref guard to prevent double project creation in React 18 StrictMode
  const creatingRef = useRef(false);

  const initResearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isNew) {
      // Prevent duplicate creation if already creating
      if (creatingRef.current) return;
      creatingRef.current = true;

      try {
        const res = await api.post('/researches', {
          title: '',
          borderId: 'none'
        });

        if (res.data?.success && res.data?.data?.research) {
          const newResearch = res.data.data.research;
          setResearch(newResearch);
          const newId = newResearch._id;
          creatingRef.current = false;
          navigate(`/research/${newId}/step/1`, { replace: true });
        } else {
          throw new Error('استجابة غير متوقعة من الخادم');
        }
      } catch (err) {
        creatingRef.current = false;
        console.error('Error creating research draft:', err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'تعذر إنشاء مشروع البحث. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    } else if (id && id !== 'new') {
      try {
        const res = await api.get(`/researches/${id}`);
        if (res.data?.success && res.data?.data?.research) {
          const fetchedResearch = res.data.data.research;
          setResearch(fetchedResearch);
          const savedStep = fetchedResearch.currentStep || 1;
          if (!stepId) {
            setCurrentStep(savedStep);
          } else {
            setCurrentStep(parseInt(stepId, 10));
          }
        } else {
          throw new Error('مشروع البحث غير موجود');
        }
      } catch (err) {
        console.error('Error loading research draft:', err);
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          'تعذر تحميل مشروع البحث. قد يكون الرابط غير صحيح أو تم حذف المشروع.';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  }, [id, stepId, isNew, navigate]);

  useEffect(() => {
    initResearch();
  }, [initResearch]);

  // Progressive Save Handler
  const handleSaveData = async (updatedFields) => {
    if (!updatedFields) return;
    if (updatedFields._id) {
      setResearch(updatedFields);
      return;
    }
    const targetId = research?._id || id;
    if (!targetId || targetId === 'new') return;
    try {
      const res = await api.patch(`/researches/${targetId}`, updatedFields);
      if (res.data?.success && res.data?.data?.research) {
        setResearch(res.data.data.research);
      }
    } catch (err) {
      console.error('Auto save error:', err);
    }
  };

  const handleGoToStep = (stepNumber) => {
    const targetId = research?._id || id;
    setCurrentStep(stepNumber);
    if (targetId && targetId !== 'new') {
      navigate(`/research/${targetId}/step/${stepNumber}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    const nextStep = Math.min(9, currentStep + 1);
    handleGoToStep(nextStep);
  };

  const handlePrev = () => {
    const prevStep = Math.max(1, currentStep - 1);
    handleGoToStep(prevStep);
  };

  const handleNavigateToPage = (pageNum) => {
    setTargetPageForPreview(pageNum);
    handleGoToStep(8);
  };

  // Error State View with Retry Option (Never infinite loading)
  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <div className="bg-white rounded-2xl p-8 border border-red-200 shadow-sm text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 font-cairo">
              تعذر تحميل مشروع البحث
            </h2>
            <p className="text-xs text-slate-500 font-amiri leading-relaxed">
              {error}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full pt-2">
            <button
              onClick={() => {
                creatingRef.current = false;
                initResearch();
              }}
              className="btn btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة المحاولة</span>
            </button>
            <Link
              to="/dashboard"
              className="btn btn-secondary flex-1 text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة بحوثي</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading State View
  if (loading) {
    return (
      <div className="py-32 text-center flex flex-col items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-teal-700 border-t-transparent rounded-full mx-auto"></div>
        <div className="font-bold text-slate-700 font-cairo text-sm">
          جاري تجهيز مشروع البحث...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 w-full">
      {/* 9-Step Visual Stepper */}
      <Stepper
        currentStep={currentStep}
        onStepClick={handleGoToStep}
        maxUnlockedStep={9}
      />

      {/* Step Container View — Centered Max-Width */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        {currentStep === 1 && (
          <Step1Cover
            key={research?._id || 'new'}
            research={research}
            onSave={handleSaveData}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <Step2Introduction
            research={research}
            onSave={handleSaveData}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 3 && (
          <Step3StructureReview
            research={research}
            onSave={handleSaveData}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 4 && (
          <Step4TopicContent
            research={research}
            onSave={handleSaveData}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 5 && (
          <Step6Conclusion
            research={research}
            onSave={handleSaveData}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 6 && (
          <Step7References
            research={research}
            onSave={handleSaveData}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {currentStep === 7 && (
          <Step8TOC
            research={research}
            onSave={handleSaveData}
            onNext={handleNext}
            onPrev={handlePrev}
            onNavigateToPage={handleNavigateToPage}
          />
        )}

        {currentStep === 8 && (
          <Step9Preview
            research={research}
            onSave={handleSaveData}
            onNext={handleNext}
            onPrev={handlePrev}
            targetPageNumber={targetPageForPreview}
          />
        )}

        {currentStep === 9 && (
          <Step10Export
            research={research}
            onPrev={handlePrev}
          />
        )}
      </div>

      {/* Full Document AI Modal */}
      <AIDocumentModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        researchId={research?._id || id}
        onApplied={(updatedResearch) => {
          setResearch(updatedResearch);
          handleGoToStep(9);
        }}
      />
    </div>
  );
};

export default ResearchWizardPage;

import React from 'react';
import { SignUp } from '@clerk/react';
import { GraduationCap } from 'lucide-react';

const RegisterPage = () => {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#F8FAFC] flex flex-col items-center justify-center px-4 py-10 sm:py-16 font-cairo relative overflow-hidden" dir="rtl">
      
      {/* Subtle Background Mint/Teal Decorative Circles (Low Opacity) */}
      <div className="absolute top-12 -right-20 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 -left-20 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Delicate Curved Lines Accent (Edges only) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10%" cy="15%" r="180" fill="none" stroke="#0F8F83" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx="90%" cy="85%" r="220" fill="none" stroke="#0F8F83" strokeWidth="1" strokeDasharray="4 8" />
      </svg>

      {/* Centered Authentication Form Container */}
      <div className="w-full max-w-[450px] relative z-10 flex flex-col items-center">
        
        {/* Academic Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-13 h-13 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F8F83] shadow-2xs mb-3">
            <GraduationCap className="w-7 h-7 text-[#0F8F83]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2747] tracking-tight">
            إنشاء حساب جديد
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] font-tajawal mt-1">
            انضم إلى مساعد البحث الأكاديمي وابدأ إعداد أبحاثك بسهولة
          </p>
        </div>

        {/* Clerk Sign Up component */}
        <div className="w-full flex justify-center">
          <SignUp
            path="/register"
            routing="path"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
            localization={{
              formButtonPrimary: 'إنشاء حساب'
            }}
          />
        </div>

        {/* Small Bottom Whitespace Note */}
        <p className="text-[11px] text-[#94A3B8] font-tajawal mt-6 text-center">
          مساعد البحث الأكاديمي • المنصة الذكية للبحوث الجامعية
        </p>

      </div>

    </div>
  );
};

export default RegisterPage;

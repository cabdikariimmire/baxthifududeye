import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Hero from '../components/home/Hero';
import StorySections from '../components/home/StorySections';
import SimpleCTA from '../components/home/SimpleCTA';
import HowItWorksModal from '../components/home/HowItWorksModal';
import Footer from '../components/common/Footer';

const LandingPage = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  const handleOpenHowItWorks = () => {
    setIsHowItWorksOpen(true);
  };

  const handleCloseHowItWorks = () => {
    setIsHowItWorksOpen(false);
  };

  return (
    <div className="w-full font-cairo text-slate-900 bg-white selection:bg-teal-100 selection:text-teal-900 flex flex-col min-h-[calc(100vh-72px)] justify-between" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* 1. Main Hero Section with simple academic illustration */}
      <Hero onOpenHowItWorks={handleOpenHowItWorks} />

      {/* 2. Exactly 4 Visual Storytelling Sections (Alternating RTL Layout) */}
      <StorySections />

      {/* 3. Small Final CTA Section */}
      <SimpleCTA />

      {/* 4. Interactive "How It Works" Dialog Modal (Triggers on "شاهد كيف يعمل") */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={handleCloseHowItWorks}
      />

      {/* 5. Minimal Clean Footer */}
      <Footer />

    </div>
  );
};

export default LandingPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCMSContent } from '../../hooks/useCMSContent';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const { content: footerContent, tField } = useCMSContent('footer');

  const copyrightText = tField(footerContent?.copyrightText) || `All rights reserved © ${currentYear} ${t('common.appName')}`;

  return (
    <footer className="no-print bg-white border-t border-slate-200/80 text-slate-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-all">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-slate-900 leading-tight">
                {t('common.appName')}
              </span>
              <span className="text-[10px] text-teal-700">
                {t('common.appSubtitle')}
              </span>
            </div>
          </Link>

          {/* Short Copyright Text */}
          <div className="text-xs text-slate-400 text-center sm:text-start">
            <p>{copyrightText}</p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;

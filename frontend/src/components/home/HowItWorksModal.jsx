import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Play,
  ArrowRight,
  ArrowLeft,
  VideoOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCMSContent } from '../../hooks/useCMSContent';

const HowItWorksModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const { content: videoContent, tField } = useCMSContent('video');
  const [selectedTutorial, setSelectedTutorial] = useState(null);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTutorial(null);
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract CMS tutorial configurations
  const modalTitle = tField(videoContent?.videoTitle) || tField(videoContent?.title) || t('videoModal.title');
  const modalSubtitle = tField(videoContent?.videoDescription) || tField(videoContent?.subtitle) || t('videoModal.subtitle');

  const mobileUrl = videoContent?.mobileVideo?.url || videoContent?.tutorialVideos?.mobile?.videoUrl || '';
  const desktopUrl = videoContent?.desktopVideo?.url || videoContent?.tutorialVideos?.desktop?.videoUrl || '';
  const mobilePoster = videoContent?.mobileVideo?.posterUrl || videoContent?.tutorialVideos?.mobile?.thumbnailUrl || '';
  const desktopPoster = videoContent?.desktopVideo?.posterUrl || videoContent?.tutorialVideos?.desktop?.thumbnailUrl || '';

  const mobileTitle = tField(videoContent?.mobileTitle) || tField(videoContent?.tutorialVideos?.mobile?.title) || t('videoModal.mobileTitle');
  const mobileDesc = tField(videoContent?.mobileDesc) || tField(videoContent?.tutorialVideos?.mobile?.description) || t('videoModal.mobileDesc');
  const desktopTitle = tField(videoContent?.desktopTitle) || tField(videoContent?.tutorialVideos?.desktop?.title) || t('videoModal.desktopTitle');
  const desktopDesc = tField(videoContent?.desktopDesc) || tField(videoContent?.tutorialVideos?.desktop?.description) || t('videoModal.desktopDesc');

  // Check which videos are actually configured and enabled
  const hasMobileVideo = Boolean(mobileUrl && mobileUrl.trim() !== '');
  const hasDesktopVideo = Boolean(desktopUrl && desktopUrl.trim() !== '');

  // Legacy single video fallback if tutorialVideos is not yet populated
  const legacyVideoUrl = videoContent?.videoUrl?.trim();
  const hasLegacyVideo = !hasMobileVideo && !hasDesktopVideo && Boolean(legacyVideoUrl);

  const activeTutorialData =
    selectedTutorial === 'mobile'
      ? {
          title: mobileTitle,
          description: mobileDesc,
          videoUrl: mobileUrl,
          thumbnailUrl: mobilePoster,
          device: 'mobile'
        }
      : selectedTutorial === 'desktop'
      ? {
          title: desktopTitle,
          description: desktopDesc,
          videoUrl: desktopUrl,
          thumbnailUrl: desktopPoster,
          device: 'desktop'
        }
      : hasLegacyVideo
      ? {
          title: modalTitle,
          description: modalSubtitle,
          videoUrl: legacyVideoUrl,
          thumbnailUrl: videoContent?.posterUrl || '',
          device: 'desktop'
        }
      : null;

  const totalAvailableVideos = (hasMobileVideo ? 1 : 0) + (hasDesktopVideo ? 1 : 0);
  const noVideosAvailable = !hasMobileVideo && !hasDesktopVideo && !hasLegacyVideo;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      {/* Dark & Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity duration-200 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Window */}
      <div
        className={`relative w-full ${
          selectedTutorial || hasLegacyVideo
            ? 'max-w-3xl'
            : totalAvailableVideos === 1
            ? 'max-w-md'
            : 'max-w-2xl'
        } bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 p-5 sm:p-7 text-start z-10 transform transition-all duration-200 animate-scale-in my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto`}
      >
        {/* ==================================================== */}
        {/* VIEW 1: ACTIVE VIDEO PLAYER VIEW                     */}
        {/* ==================================================== */}
        {selectedTutorial && activeTutorialData ? (
          <div className="space-y-4">
            {/* Header with Back Button & Close */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setSelectedTutorial(null)}
                className="inline-flex items-center gap-2 text-slate-800 hover:text-teal-700 transition-colors text-xs sm:text-sm font-bold px-2 py-1.5 rounded-xl hover:bg-slate-100 cursor-pointer group"
                title={t('videoModal.backToSelection')}
              >
                <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <BackIcon className="w-3.5 h-3.5" />
                </div>
                <span>{activeTutorialData.title}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Container */}
            <div className="rounded-2xl overflow-hidden bg-black shadow-md aspect-video w-full flex items-center justify-center">
              {activeTutorialData.videoUrl.includes('youtube.com') ||
              activeTutorialData.videoUrl.includes('youtu.be') ? (
                <iframe
                  title={activeTutorialData.title}
                  className="w-full h-full"
                  src={
                    activeTutorialData.videoUrl.includes('watch?v=')
                      ? activeTutorialData.videoUrl.replace('watch?v=', 'embed/')
                      : activeTutorialData.videoUrl.replace('youtu.be/', 'youtube.com/embed/')
                  }
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                  poster={activeTutorialData.thumbnailUrl || undefined}
                  src={activeTutorialData.videoUrl}
                >
                  Your browser does not support HTML5 video playback.
                </video>
              )}
            </div>

            {/* Video Short Description */}
            {activeTutorialData.description && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-0.5">
                {activeTutorialData.description}
              </p>
            )}
          </div>
        ) : (
          /* ==================================================== */
          /* VIEW 2: TUTORIAL SELECTION VIEW                      */
          /* ==================================================== */
          <div>
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 inset-inline-end-4 sm:top-6 sm:inset-inline-end-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title & Subtitle */}
            <div className="text-center space-y-1.5 mb-6 pt-1 pe-6 ps-6">
              <h3
                id="video-modal-title"
                className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
              >
                {modalTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                {modalSubtitle}
              </p>
            </div>

            {/* Video Cards Grid or Empty State */}
            {noVideosAvailable ? (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-200/70 my-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <VideoOff className="w-6 h-6 text-teal-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">
                    {t('videoModal.noVideos')}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {t('videoModal.subtitle')}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`grid gap-4 sm:gap-5 ${
                  totalAvailableVideos === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1'
                }`}
              >
                {/* 📱 Mobile Tutorial Card */}
                {hasMobileVideo && (
                  <div
                    onClick={() => setSelectedTutorial('mobile')}
                    className="group flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-300 transition-all duration-200 overflow-hidden cursor-pointer"
                  >
                    {/* Card Thumbnail / Poster */}
                    <div className="relative aspect-[16/9] w-full bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950 overflow-hidden flex items-center justify-center">
                      {mobileConfig?.thumbnailUrl ? (
                        <img
                          src={mobileConfig.thumbnailUrl}
                          alt={tField(mobileConfig?.title) || t('videoModal.mobileTitle')}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-teal-200/60 p-4">
                          <Smartphone className="w-10 h-10 mb-1 text-teal-400/80" />
                        </div>
                      )}

                      {/* Dark gradient overlay & Play badge */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-teal-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:bg-teal-500 transition-all duration-200">
                          <Play className="w-5 h-5 fill-white ms-0.5" />
                        </div>
                      </div>

                      {/* Device Pill Badge */}
                      <div className="absolute top-2.5 inset-inline-start-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/10">
                        <Smartphone className="w-3.5 h-3.5 text-teal-300" />
                        <span>{t('videoModal.mobileBadge')}</span>
                      </div>
                    </div>

                    {/* Card Content & CTA */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3.5 text-start">
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-2">
                          <span>{tField(mobileConfig?.title) || t('videoModal.mobileTitle')}</span>
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {tField(mobileConfig?.description) || t('videoModal.mobileDesc')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTutorial('mobile');
                        }}
                        className="w-full btn btn-primary py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t('videoModal.watchVideo')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 💻 Desktop Tutorial Card */}
                {hasDesktopVideo && (
                  <div
                    onClick={() => setSelectedTutorial('desktop')}
                    className="group flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-300 transition-all duration-200 overflow-hidden cursor-pointer"
                  >
                    {/* Card Thumbnail / Poster */}
                    <div className="relative aspect-[16/9] w-full bg-gradient-to-tr from-slate-900 via-slate-800 to-teal-950 overflow-hidden flex items-center justify-center">
                      {desktopConfig?.thumbnailUrl ? (
                        <img
                          src={desktopConfig.thumbnailUrl}
                          alt={tField(desktopConfig?.title) || t('videoModal.desktopTitle')}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-teal-200/60 p-4">
                          <Laptop className="w-10 h-10 mb-1 text-teal-400/80" />
                        </div>
                      )}

                      {/* Dark gradient overlay & Play badge */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-teal-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:bg-teal-500 transition-all duration-200">
                          <Play className="w-5 h-5 fill-white ms-0.5" />
                        </div>
                      </div>

                      {/* Device Pill Badge */}
                      <div className="absolute top-2.5 inset-inline-start-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/10">
                        <Laptop className="w-3.5 h-3.5 text-teal-300" />
                        <span>{t('videoModal.desktopBadge')}</span>
                      </div>
                    </div>

                    {/* Card Content & CTA */}
                    <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between space-y-3.5 text-start">
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-2">
                          <span>{tField(desktopConfig?.title) || t('videoModal.desktopTitle')}</span>
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {tField(desktopConfig?.description) || t('videoModal.desktopDesc')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTutorial('desktop');
                        }}
                        className="w-full btn btn-primary py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t('videoModal.watchVideo')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HowItWorksModal;

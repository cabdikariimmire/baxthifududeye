import React from 'react';
import BorderFrame from './BorderFrame';
import {
  detectAcademicLevel,
  hasMabhathLevel,
  getHighestAcademicLevel,
  formatAcademicHeadingTitle,
  resolveAcademicHeadingStyle,
  ACADEMIC_LEVELS
} from '../../utils/academicHierarchy';
import CoverCanvasEditor from '../cover/CoverCanvasEditor';

const A4Page = ({ page, borderSvg, borderId = 'none', onTOCLinkClick }) => {
  if (!page) return null;

  const renderContent = () => {
    switch (page.pageType) {
      case 'cover': {
        const d = page.data || {};
        return (
          <CoverCanvasEditor
            coverLayout={d.coverLayout}
            onLayoutChange={page.onLayoutChange}
            coverData={d}
            selectedElementId={page.selectedElementId}
            onSelectElement={page.onSelectElement}
            isInteractive={page.isEditable || false}
          />
        );
      }

      case 'introduction': {
        const d = page.data || {};
        let paragraphs = [];
        if (page.blocks && page.blocks.length > 0) {
          paragraphs = page.blocks
            .filter((b) => b.type === 'paragraph')
            .map((b) => b.text)
            .filter(Boolean);
        } else if (d.paragraphs && d.paragraphs.length > 0) {
          paragraphs = d.paragraphs;
        } else {
          let rawContent = d.content || d.text || '';
          if (d.opening && !rawContent.includes('الحمد لله رب العالمين')) {
            rawContent = `${d.opening}\n\n${rawContent}`;
          }
          paragraphs = rawContent
            .split('\n')
            .map((p) => p.trim())
            .filter(Boolean);
        }

        const isContinuation = page.isContinuation;

        return (
          <div className="flex flex-col h-full font-amiri">
            {!isContinuation ? (
              <h1 className="main-heading page-h1-heading mb-3">{page.title || 'المقدمة وخطة البحث'}</h1>
            ) : (
              <div className="text-xs font-bold text-slate-400 mb-2 font-cairo">
                {page.title || 'المقدمة وخطة البحث'}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {paragraphs.map((para, idx) => (
                <p key={idx} className="page-body-p research-body leading-[1.5] text-slate-900 mb-1">
                  {para}
                </p>
              ))}
            </div>
          </div>
        );
      }

      case 'topic': {
        const renderFormattedTopicText = (text) => {
          if (!text) return null;
          const lines = text.split('\n');

          return lines.map((line, lIdx) => {
            const re = /(\(\d+\)|\([\u0660-\u0669]+\))([.،,؛;]?)/g;
            if (!line.match(re)) {
              return (
                <React.Fragment key={lIdx}>
                  <span>{line}</span>
                  {lIdx < lines.length - 1 && <br />}
                </React.Fragment>
              );
            }

            const segments = [];
            let lastIndex = 0;
            let match;

            while ((match = re.exec(line)) !== null) {
              const fullMarker = match[0];
              const textBefore = line.substring(lastIndex, match.index);
              segments.push({
                textBefore,
                marker: fullMarker,
                hasBreakAfter: true
              });
              lastIndex = re.lastIndex;
            }

            const trailingText = line.substring(lastIndex).trimStart();
            if (trailingText) {
              segments.push({
                textBefore: trailingText,
                marker: null,
                hasBreakAfter: false
              });
            }

            return (
              <React.Fragment key={lIdx}>
                {segments.map((seg, sIdx) => (
                  <React.Fragment key={sIdx}>
                    {seg.textBefore && <span>{seg.textBefore}</span>}
                    {seg.marker && (
                      <span
                        className="inline-footnote-marker"
                        style={{
                          color: '#000000',
                          fontWeight: 'bold',
                          fontFamily: 'Amiri, serif',
                          fontSize: '13pt',
                          margin: '0 3px',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          direction: 'rtl'
                        }}
                      >
                        {seg.marker}
                      </span>
                    )}
                    {seg.hasBreakAfter && (sIdx < segments.length - 1 || trailingText) && <br />}
                  </React.Fragment>
                ))}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            );
          });
        };

        // Dynamically determine if המبحث exists and highest academic level
        const hasMabhath = page.hasMabhath !== undefined
          ? page.hasMabhath
          : (!!page.mabhathTitle || !!page.mabhathId || hasMabhathLevel(page.blocks, page.researchContext || page.data));
        const highestLevel = hasMabhath ? ACADEMIC_LEVELS.MABHATH : ACADEMIC_LEVELS.MATALAB;

        // Extract normalized elements from blocks, handling embedded branches/mataleeb/mabahith within paragraphs
        const normalizedElements = [];
        (page.blocks || []).forEach((block) => {
          if (!block || !block.text) return;
          const textTrim = block.text.trim();
          if (!textTrim) return;

          const level = detectAcademicLevel(block);

          if (level === ACADEMIC_LEVELS.MABHATH || level === ACADEMIC_LEVELS.MATALAB || level === ACADEMIC_LEVELS.BRANCH) {
            normalizedElements.push({ type: level, text: textTrim });
            return;
          }

          if (block.type === 'quote') {
            normalizedElements.push({ type: 'quote', text: block.text });
            return;
          }

          // Inspect paragraph for embedded academic heading lines
          const lines = block.text.split('\n');
          let currentParagraphLines = [];

          const flushParagraph = () => {
            if (currentParagraphLines.length > 0) {
              const pText = currentParagraphLines.join('\n').trim();
              if (pText) {
                normalizedElements.push({ type: 'paragraph', text: pText });
              }
              currentParagraphLines = [];
            }
          };

          lines.forEach((line) => {
            const lineTrim = line.trim();
            if (!lineTrim) {
              flushParagraph();
              return;
            }

            const lineLevel = detectAcademicLevel(lineTrim);
            if (lineLevel === ACADEMIC_LEVELS.MABHATH || lineLevel === ACADEMIC_LEVELS.MATALAB || lineLevel === ACADEMIC_LEVELS.BRANCH) {
              flushParagraph();
              normalizedElements.push({ type: lineLevel, text: lineTrim });
            } else {
              currentParagraphLines.push(line);
            }
          });

          flushParagraph();
        });

        return (
          <div className="flex flex-col justify-between h-full font-amiri">
            <div className="flex-1">
              {normalizedElements.map((el, idx) => {
                const elLevel = detectAcademicLevel(el);
                const displayTitle = el.text;
                const styleConfig = resolveAcademicHeadingStyle(el, highestLevel);

                // 1. MAIN TOPIC (Highest level present -> 18pt Bold Centered)
                if (styleConfig.isMainHeading) {
                  return (
                    <h1
                      key={idx}
                      className="main-heading page-h1-heading mb-2"
                      style={{
                        fontSize: '18pt',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontFamily: 'Amiri, serif',
                        color: '#0f172a',
                        direction: 'rtl',
                        display: 'block',
                        width: '100%',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        marginTop: '8pt',
                        marginBottom: '8pt'
                      }}
                    >
                      {displayTitle}
                    </h1>
                  );
                }

                // 2. SUBORDINATE / CHILD TOPICS (Subordinate levels -> 17pt Bold Right-Aligned)
                if (styleConfig.isSubHeading) {
                  return (
                    <h2
                      key={idx}
                      className="sub-heading page-h2-subheading mt-3 mb-1.5"
                      style={{
                        fontSize: '17pt',
                        fontWeight: 'bold',
                        textAlign: 'right',
                        fontFamily: 'Amiri, serif',
                        color: '#0f172a',
                        direction: 'rtl',
                        display: 'block',
                        width: '100%',
                        marginTop: '10pt',
                        marginBottom: '8pt'
                      }}
                    >
                      {displayTitle}
                    </h2>
                  );
                }

                if (el.type === 'quote') {
                  return (
                    <blockquote
                      key={idx}
                      className="border-r-4 border-teal-800 bg-amber-50/50 p-2 pr-4 my-2 italic leading-relaxed"
                      style={{
                        fontSize: '16pt',
                        fontFamily: 'Amiri, serif',
                        direction: 'rtl'
                      }}
                    >
                      {renderFormattedTopicText(el.text)}
                    </blockquote>
                  );
                }

                // 3. Normal Body Text: 16pt Normal Weight
                return (
                  <p
                    key={idx}
                    className="page-body-p mb-2"
                    style={{
                      fontSize: '16pt',
                      fontWeight: 'normal',
                      textAlign: 'justify',
                      fontFamily: 'Amiri, serif',
                      color: '#0f172a',
                      lineHeight: '1.55',
                      direction: 'rtl',
                      marginTop: '0',
                      marginBottom: '6pt'
                    }}
                  >
                    {renderFormattedTopicText(el.text)}
                  </p>
                );
              })}
            </div>

            {/* Page-Based Footnotes Section with Short Separator */}
            {page.footnotes && page.footnotes.length > 0 && (
              <div className="page-footnotes-container mt-3 pt-1">
                <div className="page-footnotes-separator"></div>
                <div className="flex flex-col gap-1">
                  {page.footnotes.map((fn, idx) => (
                    <div
                      key={idx}
                      className="page-footnote-item"
                      style={{
                        fontSize: '12pt',
                        fontFamily: 'Amiri, serif',
                        color: '#1e293b',
                        lineHeight: '1.35',
                        textAlign: 'justify'
                      }}
                    >
                      <span
                        className="font-bold ml-1"
                        style={{ color: '#000000', fontWeight: 'bold' }}
                      >
                        {fn.marker || `(${fn.numberAr || fn.number})`}
                      </span>
                      <span>{fn.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'conclusion': {
        const d = page.data || {};
        const openingParagraph =
          d.opening ||
          d.text ||
          '';
        const isContinuation = page.isContinuation;

        let points = d.points || [];
        if (page.blocks && page.blocks.length > 0) {
          const pointBlocks = page.blocks.filter((b) => b.type === 'paragraph');
          if (pointBlocks.length > 0 && isContinuation) {
            points = pointBlocks.map((b) => b.text.replace(/^\.\d+\s*/, ''));
          }
        }

        return (
          <div className="flex flex-col h-full font-amiri">
            {!isContinuation ? (
              <h1 className="page-h1-heading mb-4 text-slate-900">{page.title || d.title || 'الخاتمة'}</h1>
            ) : (
              <div className="text-xs font-bold text-slate-400 mb-2 font-cairo">
                {page.title || 'الخاتمة'}
              </div>
            )}

            {/* Unnumbered Introductory Paragraph (16pt Amiri, exact normal paragraph style) */}
            {!isContinuation && openingParagraph && (
              <p className="page-body-p mb-3 text-slate-900">
                {openingParagraph}
              </p>
            )}

            {/* Structurally Numbered Results List (16pt Amiri) */}
            <div className="flex flex-col gap-2.5 mt-1">
              {points.map((pt, idx) => (
                <div key={idx} className="page-body-p flex gap-2 items-start text-slate-900">
                  <span className="font-bold text-teal-800 flex-shrink-0">.{idx + 1}</span>
                  <span className="flex-1">{pt}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'references': {
        const d = page.data || {};
        const isContinuation = page.isContinuation;
        return (
          <div className="flex flex-col h-full font-amiri">
            {!isContinuation ? (
              <h1 className="page-h1-heading mb-4 text-slate-900">{page.title || 'المصادر والمراجع'}</h1>
            ) : (
              <div className="text-xs font-bold text-slate-400 mb-2 font-cairo">
                {page.title || 'المصادر والمراجع'}
              </div>
            )}
            <div className="flex flex-col gap-2 mt-2">
              {(d.references || []).map((ref, idx) => (
                <div key={idx} className="page-body-p flex gap-2">
                  <span className="font-bold text-teal-800">{ref.orderAr || ref.order}.</span>
                  <span>{ref.displayText || ref.book}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'toc': {
        const d = page.data || {};
        const isContinuation = page.isContinuation;
        return (
          <div className="flex flex-col h-full font-amiri">
            {!isContinuation ? (
              <h1 className="page-h1-heading mb-4 text-slate-900">{page.title || 'فهرس الموضوعات'}</h1>
            ) : (
              <div className="text-xs font-bold text-slate-400 mb-2 font-cairo">
                {page.title || 'فهرس الموضوعات'}
              </div>
            )}
            <div className="toc-container-preview">
              <div className="flex justify-between items-center bg-slate-100 border border-slate-300 px-4 py-1.5 font-bold text-[16pt] mb-3 text-teal-900">
                <span>الموضوع</span>
                <span>الصفحة</span>
              </div>
              <div className="flex flex-col gap-2">
                {(d.entries || []).map((entry, idx) => (
                  <div
                    key={idx}
                    onClick={() => onTOCLinkClick && onTOCLinkClick(entry.pageNumber)}
                    className={`toc-row-preview ${entry.level === 2 ? 'pr-6 text-[15pt] text-slate-700' : 'font-bold text-[16pt]'}`}
                  >
                    <span className="whitespace-nowrap">{entry.title}</span>
                    <span className="toc-leader-dots"></span>
                    <span className="font-bold font-amiri text-teal-800">{entry.pageNumberAr || entry.pageNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      default:
        return <div className="page-body-p">{page.title}</div>;
    }
  };

  const isCover = page.pageType === 'cover';

  return (
    <div className="a4-sheet" id={page.anchorId}>
      <BorderFrame borderSvg={borderSvg} borderId={borderId} />
      {isCover ? (
        <div className="a4-cover-layer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 }}>
          {renderContent()}
        </div>
      ) : (
        <>
          <div className="a4-content-layer">{renderContent()}</div>
          <div className="a4-footer-layer">
            <span>{page.pageNumberAr || page.pageNumber}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default A4Page;

const {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle
} = require('docx');
const docxStyles = require('./docxStyles');
const { toArabicIndicDigits } = require('../document/arabic');

/**
 * Builds Table of Contents DOCX table element
 * Formats a clean, professional academic TOC table.
 */
function createDocxTOC(tocEntries = []) {
  if (!tocEntries || tocEntries.length === 0) return [];

  const rows = [
    // Header Row
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 85, type: WidthType.PERCENTAGE },
          shading: { fill: 'F8FAFC' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              bidirectional: true,
              children: [
                new TextRun({
                  text: 'الموضوع',
                  bold: true,
                  font: docxStyles.fonts.headings,
                  size: 24, // 12pt
                  color: '000000',
                  rightToLeft: true
                })
              ]
            })
          ]
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: 'F8FAFC' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              bidirectional: true,
              children: [
                new TextRun({
                  text: 'الصفحة',
                  bold: true,
                  font: docxStyles.fonts.headings,
                  size: 24, // 12pt
                  color: '000000',
                  rightToLeft: true
                })
              ]
            })
          ]
        })
      ]
    })
  ];

  // Data rows
  tocEntries.forEach((entry) => {
    const isMajor = entry.level === 1;
    const pageAr = toArabicIndicDigits(entry.pageNumber);
    const indentPrefix = entry.level === 3 ? '      ' : entry.level === 2 ? '   ' : '';

    rows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 85, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.DOTTED, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.DOTTED, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: `${indentPrefix}${entry.title || ''}`,
                    bold: isMajor,
                    font: docxStyles.fonts.primary,
                    size: isMajor ? 26 : 24,
                    color: '000000',
                    rightToLeft: true
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.DOTTED, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.DOTTED, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                bidirectional: true,
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: pageAr,
                    bold: isMajor,
                    font: docxStyles.fonts.primary,
                    size: 24,
                    color: '000000',
                    rightToLeft: true
                  })
                ]
              })
            ]
          })
        ]
      })
    );
  });

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      visuallyRightToLeft: true, // <w:bidiVisual/> — RTL column ordering
      rows
    })
  ];
}

module.exports = { createDocxTOC };

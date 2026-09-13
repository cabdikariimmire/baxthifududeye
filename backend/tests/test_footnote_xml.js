const { Document, Paragraph, TextRun, FootnoteReferenceRun, Packer, AlignmentType } = require('docx');
const JSZip = require('jszip');

async function testFix() {
  const doc = new Document({
    footnotes: {
      1: {
        children: [
          new Paragraph({
            alignment: AlignmentType.BOTH,
            bidirectional: true,
            spacing: { before: 40, after: 40, line: 280 },
            children: [
              new TextRun({
                text: '(1) ',
                bold: true,
                font: 'Amiri',
                size: 24,
                color: '000000',
                rightToLeft: true
              }),
              new TextRun({
                text: 'المطلع على دقائق زاد المستقنع، عبد الكريم بن محمد الالحم، دار كنوز إشبيليا للنشر والتوزيع، الرياض، المملكة العربية السعودية، الطبعة الأولى، 1429هـ، 2008م، ج3، ص64.',
                font: 'Amiri',
                size: 24,
                color: '000000',
                rightToLeft: true
              })
            ]
          })
        ]
      }
    },
    sections: [{
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          bidirectional: true,
          spacing: { before: 60, after: 100, line: 360 },
          children: [
            new TextRun({
              text: 'الالتزام بالشيء المكفول، ومنه قول إبراهيم ',
              font: 'Amiri',
              size: 32,
              color: '000000',
              rightToLeft: true
            }),
            new FootnoteReferenceRun(1),
            new TextRun({
              text: '',
              break: 1
            }),
            new TextRun({
              text: 'النص الذي يأتي بعد العلامة...',
              font: 'Amiri',
              size: 32,
              color: '000000',
              rightToLeft: true
            })
          ]
        })
      ]
    }]
  });

  const buf = await Packer.toBuffer(doc);
  const zip = await JSZip.loadAsync(buf);

  if (zip.files['word/footnotes.xml']) {
    let fnXml = await zip.files['word/footnotes.xml'].async('text');
    console.log('--- ORIGINAL FOOTNOTES XML ---');
    console.log(fnXml);

    // Make separator and continuationSeparator RTL right-aligned
    fnXml = fnXml.replace(
      /(<w:footnote\s+w:type="separator"\s+w:id="-1"><w:p>)(<w:pPr>)/,
      '$1<w:pPr><w:bidi/><w:jc w:val="right"/>'
    );
    fnXml = fnXml.replace(
      /(<w:footnote\s+w:type="continuationSeparator"\s+w:id="0"><w:p>)(<w:pPr>)/,
      '$1<w:pPr><w:bidi/><w:jc w:val="right"/>'
    );

    // Remove the duplicate default footnoteRef in our content footnotes so it doesn't double-print
    fnXml = fnXml.replace(
      /(<w:footnote\s+w:id="[1-9]\d*">[\s\S]*?)(<w:r><w:rPr><w:rStyle\s+w:val="FootnoteReference"\s*\/><\/w:rPr><w:footnoteRef\s*\/><\/w:r>)/g,
      '$1'
    );

    zip.file('word/footnotes.xml', fnXml);
    console.log('--- FIXED FOOTNOTES XML ---');
    console.log(fnXml);
  }

  const finalBuf = await zip.generateAsync({ type: 'nodebuffer' });
  console.log('Final Buffer size:', finalBuf.length);
}

testFix().catch(console.error);

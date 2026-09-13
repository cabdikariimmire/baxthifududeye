const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const JSZip = require('jszip');
const DocxGenerator = require('../src/services/docx/docxGenerator');
const DocumentBuilder = require('../src/services/document/documentBuilder');

describe('Acceptance Test: Arabic RTL Word Footnotes & Cover University Logo', () => {
  const kafalahResearch = {
    title: 'الكفالة في الفقه الإسلامي',
    cover: {
      title: 'الكفالة',
      country: 'جمهورية الصومال',
      university: 'جامعة هرمود',
      college: 'كلية الشريعة والقيادة',
      subject: 'الفقه',
      studentName: 'محمد إبراهيم عيد',
      level: 'المستوى الثاني',
      supervisor: 'محمد عبد الله ناجي',
      academicYear: '1447–1448هـ',
      gregorianYear: '2025–2026م'
    },
    introduction: {
      opening: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
      content: 'فإن عقد الكفالة من العقود المهمة في المعاملات المالية الإسلامية(1).\nوقد جاءت الشريعة ببيان أحكامها وضوابطها.',
      footnotes: [
        { number: 1, text: 'ابن منظور، لسان العرب، دار صادر، بيروت، مادة (كفل).' }
      ]
    },
    topics: [
      {
        topicId: 'topic-1',
        h1Title: 'المطلب الأول: تعريف الكفالة ومشروعيتها',
        rawContent: 'الفرع الأول: المعنى اللغوي والاصطلاحي\nالكفالة في اللغة هي الضمان والالتزام بالشيء المكفول، ومنه قول إبراهيم (1).\nوفي الاصطلاح: ضم ذمة إلى ذمة في المطالبة بالحق(2). ويثبت حكمها بالسنة والإجماع.',
        footnotes: [
          {
            number: 1,
            text: 'المطلع على دقائق زاد المستقنع، عبد الكريم بن محمد الالحم، دار كنوز إشبيليا للنشر والتوزيع، الرياض، المملكة العربية السعودية، الطبعة الأولى، 1429هـ، 2008م، ج3، ص64.'
          },
          {
            number: 2,
            text: 'ابن قدامة، المغني، دار الفكر، بيروت، 1405هـ، جـ 4، صـ 320.'
          }
        ]
      }
    ],
    conclusion: {
      title: 'الخاتمة',
      opening: 'الحمد لله الذي بنعمته تتم الصالحات، وبعد:',
      points: [
        'أن الكفالة عقد إرفاق وإحسان مشروع بالكتاب والسنة.',
        'أهمية معرفة شروط الكفيل والمكفول عنه والمكفول به.'
      ]
    },
    references: {
      references: [
        { order: 1, displayText: 'ابن قدامة، المغني، دار الفكر، بيروت، 1405هـ.' },
        { order: 2, displayText: 'ابن منظور، لسان العرب، دار صادر، بيروت.' },
        { order: 3, displayText: 'عبد الكريم الالحم، المطلع على دقائق زاد المستقنع، الرياض.' }
      ]
    }
  };

  it('1. Generates valid DOCX Buffer with native Arabic footnotes and zipped structure', async () => {
    const buffer = await DocxGenerator.generateDocx(kafalahResearch);
    assert.ok(buffer && Buffer.isBuffer(buffer), 'Output must be a valid Buffer');
    assert.ok(buffer.length > 5000, `Buffer size (${buffer.length}) must be substantial`);
  });

  it('2. Footnote separator in footnotes.xml is strictly RTL right-aligned', async () => {
    const buffer = await DocxGenerator.generateDocx(kafalahResearch);
    const zip = await JSZip.loadAsync(buffer);

    assert.ok(zip.files['word/footnotes.xml'], 'footnotes.xml must exist in DOCX');
    const fnXml = await zip.files['word/footnotes.xml'].async('text');

    // Separator line MUST have <w:bidi/> and <w:jc w:val="right"/>
    assert.match(
      fnXml,
      /<w:footnote\s+w:type="separator"\s+w:id="-1"><w:p><w:pPr><w:bidi\/><w:jc\s+w:val="right"/,
      'Footnote separator MUST have <w:bidi/> and <w:jc w:val="right"/>'
    );

    // Continuation separator MUST also have <w:bidi/> and <w:jc w:val="right"/>
    assert.match(
      fnXml,
      /<w:footnote\s+w:type="continuationSeparator"\s+w:id="0"><w:p><w:pPr><w:bidi\/><w:jc\s+w:val="right"/,
      'Continuation separator MUST have <w:bidi/> and <w:jc w:val="right"/>'
    );
  });

  it('3. Footnote text in footnotes.xml has Amiri font, black color, RTL, and exact reference text', async () => {
    const buffer = await DocxGenerator.generateDocx(kafalahResearch);
    const zip = await JSZip.loadAsync(buffer);
    const fnXml = await zip.files['word/footnotes.xml'].async('text');

    // Footnote 2 (first topic fn 1) contains "المطلع على دقائق زاد المستقنع"
    assert.ok(fnXml.includes('المطلع على دقائق زاد المستقنع'), 'Must contain exact reference text');
    assert.ok(fnXml.includes('w:color w:val="000000"'), 'Footnote text must be black');
    assert.ok(fnXml.includes('Amiri'), 'Footnote font must be Amiri');
    assert.ok(fnXml.includes('<w:bidi/>'), 'Footnote paragraph must be bidi');
  });

  it('4. Body text enforces line break after footnote marker in document.xml', async () => {
    const buffer = await DocxGenerator.generateDocx(kafalahResearch);
    const zip = await JSZip.loadAsync(buffer);

    assert.ok(zip.files['word/document.xml'], 'document.xml must exist in DOCX');
    const docXml = await zip.files['word/document.xml'].async('text');

    // Body text has footnoteReference followed by a line break <w:br/>
    assert.ok(docXml.includes('<w:footnoteReference'), 'Body must contain native footnoteReference elements');
    assert.ok(docXml.includes('<w:br/>'), 'Body must enforce line breaks after footnote markers');
  });

  it('5. Cover page respects custom logo and does not inject fake logo when empty', () => {
    const docModelEmpty = DocumentBuilder.buildDocument(kafalahResearch);
    const coverPageEmpty = docModelEmpty.pages.find((p) => p.pageType === 'cover');
    assert.ok(coverPageEmpty, 'Cover page must exist');
    assert.equal(coverPageEmpty.data.logoUrl || '', '', 'Cover page must have empty logoUrl when none provided');

    const docModelWithLogo = DocumentBuilder.buildDocument({
      ...kafalahResearch,
      cover: { ...kafalahResearch.cover, logoUrl: '/uploads/custom_logo.png' }
    });
    const coverPageWithLogo = docModelWithLogo.pages.find((p) => p.pageType === 'cover');
    assert.equal(coverPageWithLogo.data.logoUrl, '/uploads/custom_logo.png', 'Cover page must resolve custom logo when provided');
  });
});

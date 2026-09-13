const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const DocumentBuilder = require('../src/services/document/documentBuilder');
const PaginationEngine = require('../src/services/document/paginationEngine');

describe('Multi-Page A4 Document Preview & Pagination Engine', () => {
  it('1. Generates complete multi-page document with ALL pages from Page 1 to Page N accessible in document order', () => {
    const sampleResearch = {
      title: 'أحكام صلاة الجمعة وضوابطها في الفقه الإسلامي',
      borderId: 'none',
      cover: {
        title: 'أحكام صلاة الجمعة وضوابطها في الفقه الإسلامي',
        studentName: 'أحمد علي حسن',
        supervisor: 'د. محمود سعيد',
        university: 'جامعة هرمود',
        college: 'كلية الشريعة والقيادة'
      },
      introduction: {
        opening: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
        text: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:\n\nإن صلاة الجمعة من أعظم شعائر الإسلام الظاهرة، وقد فرضها الله تعالى على عباده المؤمنين في كل أسبوع لتكون مجمعاً للمسلمين وتذكيراً لهم بأمور دينهم ودنياهم.\n\nوتتجلى أهمية هذا البحث في إبراز الأحكام الفقهية المتعلقة بهذه الشعيرة العظيمة وشروط صحتها ووجوبها وآدابها المستحبة.\n\nوقد انتظمت خطة هذا البحث في ثلاثة مطالب رئيسة وخاتمة:\nالمطلب الأول: فرضية صلاة الجمعة وحكمتها\nالمطلب الثاني: شروط وجوب وصحة صلاة الجمعة\nالمطلب الثالث: آداب وسنن يوم الجمعة\nالخاتمة'
      },
      topics: [
        {
          topicId: 'topic-1',
          h1Title: 'المطلب الأول: فرضية صلاة الجمعة وحكمتها',
          rawContent: 'ثبتت فرضية صلاة الجمعة بالكتاب والسنة والإجماع، فهي فرض عين على كل مسلم مكلف حر ذكر مستوطن لا عذر له. (1)\nوقد شرعها الله تعالى لتحقيق مقاصد جليلة منها اجتماع المسلمين وتوحيد كلمتهم وسماع الموعظة النافعة التي تبصرهم بأمور دينهم. (2)',
          footnotes: [
            { footnoteId: 'fn-1-1', number: 1, text: 'بداية المجتهد ونهاية المقتصد، ابن رشد، دار المعرفة، بيروت، ج1، ص 160' },
            { footnoteId: 'fn-1-2', number: 2, text: 'المجموع شرح المهذب، النووي، دار الفكر، ج4، ص 501' }
          ]
        },
        {
          topicId: 'topic-2',
          h1Title: 'المطلب الثاني: شروط وجوب وصحة صلاة الجمعة',
          rawContent: 'تنقسم شروط صلاة الجمعة إلى شروط وجوب وشروط صحة. فشروط الوجوب هي: الإسلام، والبلوغ، والعقل، والذكورة، والحرية، والصحة، والإقامة. (1)\nوأما شروط الصحة فمنها: دخول الوقت، ووجود العدد المعتبر، وأن تقام في مصر أو قرية، وتقدم خطبتين قبل الصلاة. (2)',
          footnotes: [
            { footnoteId: 'fn-2-1', number: 1, text: 'المغني، ابن قدامة، مكتبة القاهرة، ج2، ص 201' },
            { footnoteId: 'fn-2-2', number: 2, text: 'الشرح الكبير، الدردير، دار الفكر، ج1، ص 375' }
          ]
        },
        {
          topicId: 'topic-3',
          h1Title: 'المطلب الثالث: آداب وسنن يوم الجمعة',
          rawContent: 'يستحب للمسلم في يوم الجمعة جملة من الآداب والسنن المؤكدة، كالاغتسال والتطيب ولبس أحسن الثياب والتبكير إلى المسجد. (1)\nكما يستحب الإكثار من الصلاة على النبي صلى الله عليه وسلم وقراءة سورة الكهف وتحري ساعة الإجابة. (2)',
          footnotes: [
            { footnoteId: 'fn-3-1', number: 1, text: 'فتح الباري شرح صحيح البخاري، ابن حجر، دار المعرفة، ج2، ص 365' },
            { footnoteId: 'fn-3-2', number: 2, text: 'زاد المعاد في هدي خير العباد، ابن القيم، مؤسسة الرسالة، ج1، ص 380' }
          ]
        }
      ],
      conclusion: {
        title: 'الخاتمة',
        opening: 'الحمد لله الذي بنعمته تتم الصالحات، وفي ختام هذا البحث نلخص أهم النتائج التي تم التوصل إليها:',
        points: [
          'أن صلاة الجمعة فرض عين على كل مسلم توفرت فيه شروط الوجوب.',
          'اشتمال صلاة الجمعة على شروط صحة وضوابط شرعية لا تصح إلا بها.',
          'عظم ثواب التبكير وحضور خطبة الجمعة والتأدب بآدابها الشرعية.'
        ]
      },
      references: [
        { order: 1, book: 'بداية المجتهد ونهاية المقتصد، ابن رشد، دار المعرفة، بيروت' },
        { order: 2, book: 'المجموع شرح المهذب، النووي، دار الفكر' },
        { order: 3, book: 'المغني، ابن قدامة، مكتبة القاهرة' },
        { order: 4, book: 'الشرح الكبير، الدردير، دار الفكر' },
        { order: 5, book: 'فتح الباري شرح صحيح البخاري، ابن حجر، دار المعرفة' },
        { order: 6, book: 'زاد المعاد في هدي خير العباد، ابن القيم، مؤسسة الرسالة' }
      ]
    };

    const doc = DocumentBuilder.buildDocument(sampleResearch);

    assert.ok(doc.pages.length >= 7, `Expected at least 7 pages, got ${doc.pages.length}`);

    // Verify sequential page order: Page 1 through Page N
    doc.pages.forEach((p, idx) => {
      assert.strictEqual(p.pageNumber, idx + 1, `Page at index ${idx} must have pageNumber ${idx + 1}`);
      assert.ok(p.title, `Page ${idx + 1} must have a title`);
      assert.ok(p.pageType, `Page ${idx + 1} must have a pageType`);
      assert.strictEqual(p.anchorId, `page-${idx + 1}`);
    });

    // Check page sequence types
    assert.strictEqual(doc.pages[0].pageType, 'cover');
    assert.strictEqual(doc.pages[1].pageType, 'introduction');
    assert.strictEqual(doc.pages[2].pageType, 'topic');
    assert.strictEqual(doc.pages[3].pageType, 'topic');
    assert.strictEqual(doc.pages[4].pageType, 'topic');
    assert.strictEqual(doc.pages[5].pageType, 'conclusion');
    assert.strictEqual(doc.pages[6].pageType, 'references');
    assert.strictEqual(doc.pages[7].pageType, 'toc');
  });

  it('2. Long Introduction exceeding one A4 page automatically splits into multiple A4 pages without truncation', () => {
    // Generate a 15-paragraph introduction text
    const longIntroParagraphs = [
      'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
      'فإن دراسة النوازل الفقهية المعاصرة في المعاملات المالية تعتبر من أهم واجبات الوقت لإرشاد الناس إلى الحلال وتجنيبهم الشبهات والمعاملات المحرمة في ضوء القواعد الأصولية والمقاصد الكلية للشريعة الإسلامية.',
      'وتبرز أهمية هذا البحث في إيضاح المفاهيم الاقتصادية الحديثة وتكييفها الفقهي تكييفاً سليماً يتفق مع مقتضيات العدل والأمانة وحفظ الأموال وتنميتها بما يعود بالنفع على الأفراد والمجتمعات.',
      'وقد بذل العلماء والفقهاء المعاصرون جهوداً مشكورة في تقعيد هذه المسائل وبيان الفروق الدقيقة بين العقود الصحيحة والعقود الفاسدة أو المشوبة بالغرر والربا.',
      'ويهدف هذا البحث إلى تقديم دراسة تأصيلية مقارنة تجمع بين النظرة الفقهية التراثية والواقع الاقتصادي التطبيقي، مع التركيز على أهم التطبيقات المصرفية الإسلامية المعاصرة.',
      'وقد استند البحث في منهجه إلى الاستقراء والتحليل والمقارنة بين آراء المذاهب الفقهية الأربعة وقرارات المجامع الفقهية المعتمدة وهيئات الفتوى في المؤسسات المالية الرائدة.',
      'وقد انتظمت خطة هذا البحث وفق هيكلية أكاديمية محكمة تشتمل على مقدمة وثلاثة مباحث رئيسة وخاتمة على النحو الآتي:',
      'المبحث الأول: الإطار المفاهيمي والتاريخي للمعاملات المالية المعاصرة ومراحل تطورها.',
      'المطلب الأول: تعريف المعاملات المالية الحديثة وخصائصها العامة.',
      'الفرع الأول: المعنى اللغوي والاصطلاحي.',
      'الفرع الثاني: نشأة المؤسسات المالية وتطورها.',
      'المطلب الثاني: الضوابط والقواعد الشرعية الحاكمة للعقود المالية.',
      'المبحث الثاني: التطبيقات المعاصرة لعقود المشاركات والمضاربات والمرابحات.',
      'المبحث الثالث: النوازل والمستجدات الرقمية والعملات المشفرة وأحكامها الفقهية.',
      'الخاتمة: وتتضمن خلاصة النتائج وأبرز التوصيات العلمية والعملية.'
    ];

    const researchWithLongIntro = {
      title: 'المعاملات المالية المعاصرة',
      introduction: {
        text: longIntroParagraphs.join('\n\n')
      },
      topics: [
        { topicId: 't-1', h1Title: 'المطلب الأول: الضوابط العامة', rawContent: 'محتوى المطلب الأول...' }
      ]
    };

    const doc = DocumentBuilder.buildDocument(researchWithLongIntro);

    const introPages = doc.pages.filter(p => p.pageType === 'introduction');
    assert.ok(introPages.length >= 2, `Long introduction must paginate across at least 2 pages, got ${introPages.length}`);

    // All paragraphs must be preserved across intro pages
    const collectedParagraphs = introPages.flatMap(p => (p.blocks || []).filter(b => b.type === 'paragraph').map(b => b.text));
    assert.ok(collectedParagraphs.length >= 10, 'All intro paragraphs must be preserved across pages without loss');

    // Subsequent topic pages must have correct shifted page numbers
    const firstTopicPage = doc.pages.find(p => p.pageType === 'topic');
    assert.strictEqual(firstTopicPage.pageNumber, 1 + introPages.length + 1, 'Topic page must seamlessly follow introduction pages');
  });

  it('3. Topic content exceeding one page splits across multiple pages and preserves page-based footnotes', () => {
    const engine = new PaginationEngine();

    const heavyTopicBlocks = [
      { type: 'h1', text: 'المطلب الأول: الدراسة الموسعة للأحكام الفقهية' },
      { type: 'paragraph', text: 'الفقرة الأولى: '.repeat(50) + ' (1)' },
      { type: 'paragraph', text: 'الفقرة الثانية: '.repeat(50) + ' (2)' },
      { type: 'paragraph', text: 'الفقرة الثالثة: '.repeat(50) + ' (3)' }
    ];

    const footnotes = [
      { footnoteId: 'fn-1', number: 1, text: 'مرجع الفقرة الأولى بالتفصيل...' },
      { footnoteId: 'fn-2', number: 2, text: 'مرجع الفقرة الثانية بالتفصيل...' },
      { footnoteId: 'fn-3', number: 3, text: 'مرجع الفقرة الثالثة بالتفصيل...' }
    ];

    const res = engine.paginateSection({
      sectionType: 'topic',
      title: 'المطلب الأول',
      blocks: heavyTopicBlocks,
      footnotes,
      startPageNumber: 3
    });

    assert.ok(res.pages.length >= 2, `Heavy topic must produce at least 2 pages, got ${res.pages.length}`);

    // Footnotes on each page must restart numbering at (1)
    res.pages.forEach((p) => {
      if (p.footnotes && p.footnotes.length > 0) {
        assert.strictEqual(p.footnotes[0].number, 1, 'First footnote on any page must be numbered 1');
      }
    });
  });

  it('4. TOC correctly references actual generated start page numbers for all sections', () => {
    const sampleResearch = {
      title: 'بحث تجريبي متعدد الصفحات',
      topics: [
        { topicId: 't-1', h1Title: 'المطلب الأول: مقدمات تمهيدية', rawContent: 'نص المطلب الأول...' },
        { topicId: 't-2', h1Title: 'المطلب الثاني: الأحكام والمسائل', rawContent: 'نص المطلب الثاني...' }
      ]
    };

    const doc = DocumentBuilder.buildDocument(sampleResearch);
    const tocPage = doc.pages.find(p => p.pageType === 'toc');

    assert.ok(tocPage, 'TOC page must exist');
    assert.ok(tocPage.data.entries.length >= 4, 'TOC entries must include Cover, Intro, Topics, Conclusion, References');

    // Check that Introduction is at page 2
    const introEntry = tocPage.data.entries.find(e => e.title.includes('المقدمة'));
    assert.ok(introEntry, 'TOC must include Introduction');
    assert.strictEqual(introEntry.pageNumber, 2);

    // Check that TOC itself is the last page
    const tocEntry = tocPage.data.entries.find(e => e.title.includes('فهرس الموضوعات'));
    assert.ok(tocEntry, 'TOC must include itself');
    assert.strictEqual(tocEntry.pageNumber, doc.pages.length);
  });
});

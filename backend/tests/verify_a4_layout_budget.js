const PaginationEngine = require('../src/services/document/paginationEngine');
const documentSpec = require('../src/services/document/documentSpec');
const DocumentBuilder = require('../src/services/document/documentBuilder');

const engine = new PaginationEngine(documentSpec);

console.log('================================================================');
console.log('A4 DOCUMENT SYSTEM: PHYSICAL GEOMETRY & MATHEMATICAL BUDGET DERIVATION');
console.log('================================================================');
console.log(`- Physical Sheet: 210mm × 297mm`);
console.log(`- Page Width (pt):  ${engine.pageWidthPt} pt (210mm)`);
console.log(`- Page Height (pt): ${engine.pageHeightPt} pt (297mm)`);
console.log(`- Top Margin (pt):  ${engine.topMarginPt} pt (24mm)`);
console.log(`- Bottom Margin (pt): ${engine.bottomMarginPt} pt (24mm)`);
console.log(`- Side Margin (pt): ${engine.sideMarginPt} pt (25mm)`);
console.log(`- Usable Content Width:  ${engine.contentWidthPt} pt (160mm)`);
console.log(`- Usable Content Height: ${engine.usableHeightPt} pt (249mm = 297mm - 24mm - 24mm)`);
console.log(`- Max Content Budget:    ${engine.maxContentHeightPt} pt (strictly derived, no arbitrary buffer)`);
console.log('================================================================\n');

// Realistic Arabic multi-page research document test
const sampleResearch = {
  title: 'أحكام صلاة الجمعة وضوابطها في الفقه الإسلامي',
  borderId: 'none',
  cover: {
    title: 'أحكام صلاة الجمعة وضوابطها في الفقه الإسلامي',
    studentName: 'أحمد علي حسن',
    supervisor: 'د. محمود سعيد',
    university: 'جامعة هرمود',
    college: 'كلية الشريعة والقيادة',
    country: 'المملكة العربية السعودية',
    subject: 'الفقه المقارن',
    academicYear: '1446هـ',
    gregorianYear: '2025م'
  },
  introduction: {
    opening: 'الحمد لله رب العالمين، والصلاة والسلام على سيدنا محمد وعلى آله وصحبه أجمعين، أما بعد:',
    text: 'إن صلاة الجمعة من أعظم شعائر الإسلام الظاهرة، وقد فرضها الله تعالى على عباده المؤمنين في كل أسبوع لتكون مجمعاً للمسلمين وتذكيراً لهم بأمور دينهم ودنياهم.\n\nوتتجلى أهمية هذا البحث في إبراز الأحكام الفقهية المتعلقة بهذه الشعيرة العظيمة وشروط صحتها ووجوبها وآدابها المستحبة في ضوء الأدلة الشرعية المعتمدة.\n\nوقد انتظمت خطة هذا البحث في ثلاثة مطالب رئيسة وخاتمة:\nالمطلب الأول: فرضية صلاة الجمعة وحكمتها\nالمطلب الثاني: شروط وجوب وصحة صلاة الجمعة\nالمطلب الثالث: آداب وسنن يوم الجمعة\nالخاتمة والمصادر والمراجع.'
  },
  topics: [
    {
      topicId: 'topic-1',
      h1Title: 'المطلب الأول: فرضية صلاة الجمعة وحكمتها التشريعية',
      rawContent: `ثبتت فرضية صلاة الجمعة بالكتاب والسنة والإجماع، فهي فرض عين على كل مسلم مكلف حر ذكر مستوطن لا عذر له يمنعه من الحضور (1).
وقد شرعها الله تعالى لتحقيق مقاصد جليلة وحكم سامية، منها اجتماع المسلمين في مكان واحد وتوحيد كلمتهم وسماع الموعظة النافعة التي تبصرهم بأمور دينهم وتصلح أحوال دنياهم (2).

الفرع الأول: أدلة الوجوب من الكتاب العزيز
دل قوله تعالى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِنْ يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَى ذِكْرِ اللَّهِ وَذَرُوا الْبَيْعَ﴾ [الجمعة: 9] على فرضية صلاة الجمعة بالاتفاق (3).
وقد علق الإمام القرطبي على هذه الآية الكريمة مبيناً أن الأمر بالسعي والنهي عن البيع يقتضيان وجوب الصلاة وحرمة الانشغال عنها بأي عمل دنيوي.

الفرع الثاني: أدلة الوجوب من السنة النبوية المطهرة
تواترت الأحاديث النبوية الآمرة بحضور صلاة الجمعة والمحذرة من التخلف عنها لغير عذر شرعي، ومن ذلك قوله صلى الله عليه وسلم: «لينتهين أقوام عن ودعهم الجمعات أو ليختمن الله على قلوبهم ثم ليكونن من الغافلين» (4).
وهذا الحديث الشريف صريح في الزجر الشديد والوعيد الأكيد لمن يتهاون في أداء هذه الشعيرة المباركة.`,
      footnotes: [
        { footnoteId: 'fn-1-1', number: 1, text: 'بداية المجتهد ونهاية المقتصد، ابن رشد، دار المعرفة، بيروت، ج1، ص 160' },
        { footnoteId: 'fn-1-2', number: 2, text: 'المجموع شرح المهذب، النووي، دار الفكر، ج4، ص 501' },
        { footnoteId: 'fn-1-3', number: 3, text: 'الجامع لأحكام القرآن، القرطبي، دار الكتب المصرية، القاهرة، ج18، ص 105' },
        { footnoteId: 'fn-1-4', number: 4, text: 'صحيح مسلم، كتاب الجمعة، باب تغليظ ترك الجمعة، رقم الحديث: 865' }
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
    { order: 1, book: 'بداية المجتهد ونهاية المقتصد، ابن رشد، دار المعرفة، بيروت، 1425هـ' },
    { order: 2, book: 'المجموع شرح المهذب، النووي، دار الفكر، بيروت، 1417هـ' },
    { order: 3, book: 'الجامع لأحكام القرآن، القرطبي، دار الكتب المصرية، القاهرة، 1384هـ' },
    { order: 4, book: 'صحيح مسلم، مسلم بن الحجاج، دار إحياء التراث العربي، بيروت، 1374هـ' }
  ]
};

const doc = DocumentBuilder.buildDocument(sampleResearch);

console.log(`Total Pages Generated: ${doc.pages.length}`);
console.log('----------------------------------------------------------------');

doc.pages.forEach((page) => {
  const cHeight = page.debugContentHeight || 0;
  const fHeight = page.debugFootnoteHeight || 0;
  const totalConsumed = cHeight + fHeight;
  const remaining = engine.usableHeightPt - totalConsumed;

  console.log(`Page ${page.pageNumber} [${page.pageType.toUpperCase()}] : "${page.title}"`);
  console.log(`  • Usable A4 Height: ${engine.usableHeightPt} pt (249mm)`);
  console.log(`  • Content Consumed: ${cHeight.toFixed(2)} pt (${(page.blocks || []).length} blocks)`);
  console.log(`  • Footnotes Consumed: ${fHeight.toFixed(2)} pt (${(page.footnotes || []).length} footnotes)`);
  console.log(`  • Total Page Consumed: ${totalConsumed.toFixed(2)} pt / ${engine.usableHeightPt} pt`);
  console.log(`  • Remaining Usable: ${remaining.toFixed(2)} pt`);
  console.log(`  • Status: ${totalConsumed <= engine.usableHeightPt ? '✓ FITS PERFECTLY (No Overflow)' : '✗ OVERFLOW'}`);
  console.log('----------------------------------------------------------------');
});

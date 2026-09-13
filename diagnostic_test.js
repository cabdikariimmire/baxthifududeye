const path = require('path');
const fs = require('fs');

const DocumentBuilder = require('./backend/src/services/document/documentBuilder');
const PDFGenerator = require('./backend/src/services/pdf/pdfGenerator');
const DocxGenerator = require('./backend/src/services/docx/docxGenerator');
const PaginationEngine = require('./backend/src/services/document/paginationEngine');
const documentSpec = require('./backend/src/services/document/documentSpec');

async function runDiagnostic() {
  console.log('=== STARTING A4 DOCUMENT GENERATION & PAGINATION DIAGNOSTIC ===\n');

  // Sample Research Document Model with multiple topics, paragraphs, and footnotes
  const sampleResearch = {
    title: 'أثر التحول الرقمي في جودة التعليم العالي',
    cover: {
      country: 'المملكة العربية السعودية',
      university: 'جامعة الملك سعود',
      college: 'كلية العلوم التربوية',
      subject: 'طرق التدريس الحديثة',
      title: 'أثر التحول الرقمي في جودة التعليم العالي في الجامعات السعودية',
      studentName: 'عبد الله بن خالد الدوسري',
      level: 'الماجستير',
      supervisor: 'أ.د. عبد الرحمن بن صالح المنصور',
      semester: 'الفصل الدراسي الثاني',
      academicYear: '1447هـ',
      gregorianYear: '2026م'
    },
    introduction: {
      title: 'المقدمة وخطة البحث',
      opening: 'الحمد لله رب العالمين والصلاة والسلام على أشرف الأنبياء والمرسلين سيدنا محمد وعلى آله وصحبه أجمعين.',
      text: 'شهد قطاع التعليم العالي في الآونة الأخيرة تحولات جذرية نتيجة للثورة الرقمية المتسارعة وتطور تقنيات الاتصال والمعلومات.\nوقد فرضت هذه التغيرات واقعاً جديداً يتطلب إعادة النظر في أساليب التدريس التقليدية واعتماد نماذج تعليمية مبتكرة تعزز من فاعلية العملية التعليمية وتلبي متطلبات العصر الحديث.\nيهدف هذا البحث إلى دراسة واقع التحول الرقمي وأثره في تحسين جودة مخرجات التعليم العالي، مع التركيز على تجربة الجامعات السعودية.'
    },
    structure: {
      tree: [
        {
          id: 'mb-1',
          type: 'mabhath',
          title: 'الإطار المفاهيمي للتحول الرقمي في التعليم',
          order: 1,
          children: [
            {
              id: 'mt-1',
              type: 'matlab',
              title: 'مفهوم التحول الرقمي وأبعاده الأكاديمية',
              order: 1,
              children: [
                { id: 'br-1', type: 'branch', title: 'تعريف التحول الرقمي لغة واصطلاحاً', order: 1 },
                { id: 'br-2', type: 'branch', title: 'الأبعاد الاستراتيجية للتحول الرقمي', order: 2 }
              ]
            },
            {
              id: 'mt-2',
              type: 'matlab',
              title: 'متطلبات تطبيق التحول الرقمي في الجامعات',
              order: 2,
              children: []
            }
          ]
        }
      ]
    },
    topics: [
      {
        structureNodeId: 'mt-1',
        topicId: 'topic-1',
        order: 1,
        mabhathId: 'mb-1',
        mabhathTitle: 'المبحث الأول: الإطار المفاهيمي للتحول الرقمي في التعليم',
        h1Title: 'المطلب الأول: مفهوم التحول الرقمي وأبعاده الأكاديمية',
        rawContent: `يعتبر التحول الرقمي عملية استراتيجية شاملة تهدف إلى توظيف التقنيات الرقمية المتقدمة لإعادة تشكيل العمليات التعليمية والإدارية في المؤسسات الجامعية (1).\nالفرع الأول: تعريف التحول الرقمي لغة واصطلاحاً\nالتحول في اللغة يعني التغير والانتقال من حال إلى حال، بينما الاصطلاح الأكاديمي يشير إلى دمج الأدوات التقنية في صميم الأداء المؤسسي (2).\nالفرع الثاني: الأبعاد الاستراتيجية للتحول الرقمي\nتتنوع الأبعاد بين البنية التحتية التقنية، وتطوير الكفايات الرقمية لأعضاء هيئة التدريس، وتحديث المناهج لتتوافق مع متطلبات الثورة الصناعية الرابعة (3).`,
        footnotes: [
          { footnoteId: 'fn-1', number: 1, marker: '(1)', text: 'الحربي، محمد. الإدارة الرقمية في الجامعات الحديثة، الرياض: دار النشر الجامعي، 2024م، ص 45.' },
          { footnoteId: 'fn-2', number: 2, marker: '(2)', text: 'ابن منظور، لسان العرب، مادة (حول)، بيروت: دار صادر، ج 11، ص 188.' },
          { footnoteId: 'fn-3', number: 3, marker: '(3)', text: 'العتيبي، سارة. استراتيجيات التحول الرقمي في التعليم العالي، مجلة الدراسات التربوية، العدد 28، 2025م، ص 112.' }
        ]
      },
      {
        structureNodeId: 'mt-2',
        topicId: 'topic-2',
        order: 2,
        mabhathId: 'mb-1',
        mabhathTitle: 'المبحث الأول: الإطار المفاهيمي للتحول الرقمي في التعليم',
        h1Title: 'المطلب الثاني: متطلبات تطبيق التحول الرقمي في الجامعات',
        rawContent: `يتطلب التطبيق الناجح للتحول الرقمي توفير بنية تحتية تقنية متينة، بالإضافة إلى كوادر مؤهلة وسياسات واضحة تضمن أمن المعلومات وحماية الخصوصية الأكاديمية (1).\nكما يستلزم ذلك توفير الدعم المالي واللوجستي لضمان استدامة المشاريع التقنية في البيئات الجامعية (2).`,
        footnotes: [
          { footnoteId: 'fn-4', number: 1, marker: '(1)', text: 'الغامدي، أحمد. معايير الأمن السيبراني في المنصات التعليمية، مجلة التقنية التربوية، 2024م، ص 77.' },
          { footnoteId: 'fn-5', number: 2, marker: '(2)', text: 'السالم، فهد. تمويل التعليم العالي في العصر الرقمي، الرياض: مكتبة الملك فهد، 2023م، ص 94.' }
        ]
      }
    ],
    conclusion: {
      title: 'الخاتمة',
      opening: 'توصل هذا البحث من خلال الدراسة والتحليل إلى مجموعة من النتائج والتوصيات المهمة.',
      points: [
        'أن التحول الرقمي لم يعد خياراً ترفيهياً بل ضرورة حتمية لرفع كفاءة التعليم العالي.',
        'وجود أثر إيجابي ذو دلالة إحصائية للبيئات الرقمية على التحصيل الأكاديمي للطلاب.',
        'أهمية التدريب المستمر لأعضاء هيئة التدريس لضمان الاستخدام الأمثل للتقنيات.'
      ]
    },
    references: [
      { order: 1, type: 'book', displayText: 'ابن منظور، محمد بن مكرم. لسان العرب، بيروت: دار صادر، 2010م.' },
      { order: 2, type: 'book', displayText: 'الحربي، محمد. الإدارة الرقمية في الجامعات الحديثة، الرياض: دار النشر الجامعي، 2024م.' },
      { order: 3, type: 'journal', displayText: 'العتيبي، سارة. استراتيجيات التحول الرقمي في التعليم العالي، مجلة الدراسات التربوية، العدد 28، 2025م.' },
      { order: 4, type: 'journal', displayText: 'الغامdi، أحمد. معايير الأمن السيبراني في المنصات التعليمية، مجلة التقنية التربوية، 2024م.' }
    ]
  };

  console.log('1. Building Document via DocumentBuilder...');
  const docModel = DocumentBuilder.buildDocument(sampleResearch);
  console.log(`-> Document built with ${docModel.pages.length} pages:`);
  docModel.pages.forEach((p) => {
    console.log(`   Page ${p.pageNumber}: [${p.pageType}] Title: "${p.title}" | Blocks: ${p.blocks?.length || 0} | Footnotes: ${p.footnotes?.length || 0} | ContentHeight: ${p.debugContentHeight?.toFixed(1) || 'N/A'}pt | Usable: 705.8pt`);
  });

  console.log('\n2. Testing PDF Generation...');
  const pdfBuffer = await PDFGenerator.generatePDF(sampleResearch);
  console.log(`-> PDF Generated successfully: Buffer size = ${pdfBuffer.length} bytes`);
  fs.writeFileSync('./scratch_test.pdf', pdfBuffer);

  console.log('\n3. Testing Word DOCX Generation...');
  const docxBuffer = await DocxGenerator.generateDocx(sampleResearch);
  console.log(`-> Word DOCX Generated successfully: Buffer size = ${docxBuffer.length} bytes`);
  fs.writeFileSync('./scratch_test.docx', docxBuffer);

  console.log('\n=== DIAGNOSTIC COMPLETE ===');
}

runDiagnostic().catch(console.error);

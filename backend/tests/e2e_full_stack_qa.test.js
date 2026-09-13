const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const JSZip = require('jszip');

const app = require('../src/app');
const User = require('../src/models/User');
const Research = require('../src/models/Research');
const DocxGenerator = require('../src/services/docx/docxGenerator');

let server;
let baseUrl;
let authToken;
let testUserId;
let controlledResearchId;
let emptyResearchId;

describe('Comprehensive End-to-End QA & Stabilization Suite', () => {
  before(async () => {
    // 1. Ensure DB Connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_research_assistant_test');
    }

    // 2. Start HTTP Test Server on random available port
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api`;
  });

  after(async () => {
    // Clean up created QA research and test user
    if (controlledResearchId) await Research.findByIdAndDelete(controlledResearchId);
    if (emptyResearchId) await Research.findByIdAndDelete(emptyResearchId);
    if (testUserId) await User.findByIdAndDelete(testUserId);

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ==========================================
  // PHASE 3: USER REGISTRATION & AUTHENTICATION
  // ==========================================
  it('Phase 3: Real User Registration & Login Flow', async () => {
    const testEmail = `qa.hasan.${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'حسن عبد الله أحمد';

    // 1. Register
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword
      })
    });
    const regData = await regRes.json();
    assert.equal(regRes.status, 201, `Registration failed: ${JSON.stringify(regData)}`);
    assert.ok(regData.success, 'Registration must be successful');
    assert.ok(regData.data.token, 'Must return JWT auth token');

    authToken = regData.data.token;
    testUserId = regData.data.user.id || regData.data.user._id;

    // 2. Verify /auth/me with Bearer token
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const meData = await meRes.json();
    assert.equal(meRes.status, 200);
    assert.equal(meData.data.user.email, testEmail);
    assert.equal(meData.data.user.name, testName);
  });

  // ==========================================
  // PHASE 4: CREATE CONTROLLED TEST RESEARCH
  // ==========================================
  it('Phase 4: Create Controlled Research Document with Full Cover Metadata', async () => {
    const researchPayload = {
      title: 'أحكام الاعتكاف ومقاصده في الشريعة الإسلامية',
      cover: {
        country: 'المملكة العربية السعودية',
        university: 'جامعة هرمود',
        college: 'كلية الشريعة والقانون',
        subject: 'فقه العبادات المقارن',
        studentName: 'حسن عبد الله أحمد',
        supervisor: 'الشيخ الناجي الشرعبي',
        academicYear: '1447 - 1448هـ',
        gregorianYear: '2025 - 2026م',
        badgeColor: '#38761d'
      }
    };

    const res = await fetch(`${baseUrl}/researches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(researchPayload)
    });

    const data = await res.json();
    assert.equal(res.status, 201, `Creation failed: ${JSON.stringify(data)}`);
    assert.ok(data.success);
    assert.ok(data.data.research._id);
    controlledResearchId = data.data.research._id;

    assert.equal(data.data.research.title, 'أحكام الاعتكاف ومقاصده في الشريعة الإسلامية');
    assert.equal(data.data.research.cover.university, 'جامعة هرمود');
    assert.equal(data.data.research.cover.studentName, 'حسن عبد الله أحمد');
    assert.equal(data.data.research.cover.supervisor, 'الشيخ الناجي الشرعبي');
  });

  // ==========================================
  // PHASE 5: INTRODUCTION & PLAN
  // ==========================================
  it('Phase 5: Introduction & Plan Content Preservation and Clean Stream', async () => {
    const introPayload = {
      introduction: {
        opening: 'الحمد لله رب العالمين، والصلاة والسلام على نبينا محمد وعلى آله وصحبه أجمعين، أما بعد:',
        text: 'فإن الاعتكاف من أعظم القربات إلى الله تعالى في الشريعة الإسلامية، وهو عكوف القلب على طاعة الله وملازمة المسجد تفرغاً للعبادة. ونستعرض في هذا البحث خطة علمية متكاملة تتضمن مبحثين رئيسيين.',
        planSummary: 'المبحث الأول: تعريف الاعتكاف ومشروعيته، المبحث الثاني: أحكام الاعتكاف ومقاصده'
      },
      currentStep: 2
    };

    const res = await fetch(`${baseUrl}/researches/${controlledResearchId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(introPayload)
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.success);
    assert.equal(data.data.research.introduction.opening, introPayload.introduction.opening);
    assert.equal(data.data.research.introduction.text, introPayload.introduction.text);
  });

  // ==========================================
  // PHASE 6: STRUCTURE REVIEW (2 Mabaheth, 4 Mataleeb, 8 Furoo)
  // ==========================================
  it('Phase 6: Semantic Academic Hierarchy Review (2 Mabaheth, 4 Mataleeb, 8 Furoo)', async () => {
    const semanticTree = [
      {
        id: 'mabhath-1',
        type: 'mabhath',
        title: 'المبحث الأول: تعريف الاعتكاف ومشروعيته',
        order: 1,
        children: [
          {
            id: 'matlab-1-1',
            type: 'matlab',
            title: 'المطلب الأول: تعريف الاعتكاف',
            order: 1,
            parentId: 'mabhath-1',
            children: [
              { id: 'branch-1-1-1', type: 'branch', title: 'الفرع الأول: تعريف الاعتكاف لغة', order: 1, parentId: 'matlab-1-1' },
              { id: 'branch-1-1-2', type: 'branch', title: 'الفرع الثاني: تعريف الاعتكاف اصطلاحاً', order: 2, parentId: 'matlab-1-1' }
            ]
          },
          {
            id: 'matlab-1-2',
            type: 'matlab',
            title: 'المطلب الثاني: مشروعية الاعتكاف',
            order: 2,
            parentId: 'mabhath-1',
            children: [
              { id: 'branch-1-2-1', type: 'branch', title: 'الفرع الأول: أدلة مشروعية الاعتكاف', order: 1, parentId: 'matlab-1-2' },
              { id: 'branch-1-2-2', type: 'branch', title: 'الفرع الثاني: حكم الاعتكاف', order: 2, parentId: 'matlab-1-2' }
            ]
          }
        ]
      },
      {
        id: 'mabhath-2',
        type: 'mabhath',
        title: 'المبحث الثاني: أحكام الاعتكاف ومقاصده',
        order: 2,
        children: [
          {
            id: 'matlab-2-1',
            type: 'matlab',
            title: 'المطلب الأول: أحكام الاعتكاف',
            order: 1,
            parentId: 'mabhath-2',
            children: [
              { id: 'branch-2-1-1', type: 'branch', title: 'الفرع الأول: شروط الاعتكاف', order: 1, parentId: 'matlab-2-1' },
              { id: 'branch-2-1-2', type: 'branch', title: 'الفرع الثاني: مبطلات الاعتكاف', order: 2, parentId: 'matlab-2-1' }
            ]
          },
          {
            id: 'matlab-2-2',
            type: 'matlab',
            title: 'المطلب الثاني: مقاصد الاعتكاف',
            order: 2,
            parentId: 'mabhath-2',
            children: [
              { id: 'branch-2-2-1', type: 'branch', title: 'الفرع الأول: المقاصد التعبدية', order: 1, parentId: 'matlab-2-2' },
              { id: 'branch-2-2-2', type: 'branch', title: 'الفرع الثاني: المقاصد التربوية', order: 2, parentId: 'matlab-2-2' }
            ]
          }
        ]
      }
    ];

    const res = await fetch(`${baseUrl}/researches/${controlledResearchId}/structure`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ tree: semanticTree, currentStep: 3 })
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Structure update failed: ${JSON.stringify(data)}`);
    assert.ok(data.success);
    const topics = data.data.topics || data.data.research.topics;
    assert.equal(topics.length, 4, 'Must create 4 topic units corresponding to the 4 Mataleeb');

    // Verify first topic metadata and branches
    const topic1 = topics[0];
    assert.equal(topic1.mabhathTitle, 'المبحث الأول: تعريف الاعتكاف ومشروعيته');
    assert.equal(topic1.h1Title, 'المطلب الأول: تعريف الاعتكاف');
    assert.equal(topic1.branches.length, 2);
    assert.equal(topic1.branches[0].title, 'الفرع الأول: تعريف الاعتكاف لغة');
    assert.equal(topic1.branches[1].title, 'الفرع الثاني: تعريف الاعتكاف اصطلاحاً');

    // Verify third topic metadata (under Mabhath 2)
    const topic3 = topics[2];
    assert.equal(topic3.mabhathTitle, 'المبحث الثاني: أحكام الاعتكاف ومقاصده');
    assert.equal(topic3.h1Title, 'المطلب الأول: أحكام الاعتكاف');
    assert.equal(topic3.branches.length, 2);
  });

  // ==========================================
  // PHASE 7 & 8: TOPIC CONTENT & FOOTNOTES
  // ==========================================
  it('Phase 7 & 8: Topic Content Persistence and Inline Footnotes Insertion', async () => {
    const researchDoc = await Research.findById(controlledResearchId);
    const topic1Id = researchDoc.topics[0].topicId;
    const topic2Id = researchDoc.topics[1].topicId;

    // 1. Save content for Topic 1 with 2 footnotes
    const topic1Payload = {
      rawContent: 'الاعتكاف لغة هو لزوم الشيء وحبس النفس عليه(1)، وفي الاصطلاح المكث في المسجد بنية التقرب إلى الله تعالى(2).',
      blocks: [
        {
          type: 'h2',
          text: 'الفرع الأول: تعريف الاعتكاف لغة'
        },
        {
          type: 'paragraph',
          text: 'الاعتكاف في لسان العرب مأخوذ من عكف على الشيء إذا لزمه وأقبل عليه مواظباً لا يصرف عنه وجهه(1).'
        },
        {
          type: 'h2',
          text: 'الفرع الثاني: تعريف الاعتكاف اصطلاحاً'
        },
        {
          type: 'paragraph',
          text: 'وأما في الاصطلاح الشرعي فهو المقام في المسجد على وجه القربة لله تعالى بشروط مخصوصة(2).'
        }
      ],
      footnotes: [
        {
          footnoteId: 'fn-top1-1',
          number: 1,
          marker: '(1)',
          text: 'لسان العرب، ابن منظور، دار صادر، بيروت، ج9، ص 255'
        },
        {
          footnoteId: 'fn-top1-2',
          number: 2,
          marker: '(2)',
          text: 'المغني، ابن قدامة، دار الفكر، بيروت، ج3، ص 120'
        }
      ]
    };

    const res1 = await fetch(`${baseUrl}/researches/${controlledResearchId}/topics/${topic1Id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(topic1Payload)
    });
    const data1 = await res1.json();
    assert.equal(res1.status, 200);
    assert.ok(data1.success);

    // 2. Save content for Topic 2 with 1 footnote
    const topic2Payload = {
      rawContent: 'ثبتت مشروعية الاعتكاف بالكتاب والسنة والإجماع(1).',
      blocks: [
        {
          type: 'h2',
          text: 'الفرع الأول: أدلة مشروعية الاعتكاف'
        },
        {
          type: 'paragraph',
          text: 'قال الله تعالى: (وأنتم عاكفون في المساجد)، وثبت عن النبي ﷺ أنه اعتكف في العشر الأواخر من رمضان(1).'
        }
      ],
      footnotes: [
        {
          footnoteId: 'fn-top2-1',
          number: 1,
          marker: '(1)',
          text: 'المجموع شرح المهذب، النووي، دار الفكر، ج6، ص 475'
        }
      ]
    };

    const res2 = await fetch(`${baseUrl}/researches/${controlledResearchId}/topics/${topic2Id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(topic2Payload)
    });
    const data2 = await res2.json();
    assert.equal(res2.status, 200);
    assert.ok(data2.success);
  });

  // ==========================================
  // PHASE 10: CONCLUSION
  // ==========================================
  it('Phase 10: Conclusion Content & Structurally Numbered Results', async () => {
    const conclusionPayload = {
      conclusion: {
        title: 'الخاتمة',
        opening: 'وفي ختام هذا البحث المبارك الذي تناولنا فيه أحكام الاعتكاف ومقاصده في الفقه الإسلامي، نلخص أهم النتائج:',
        text: 'وفي ختام هذا البحث المبارك الذي تناولنا فيه أحكام الاعتكاف ومقاصده في الفقه الإسلامي، نلخص أهم النتائج:',
        points: [
          'الاعتكاف سنة مؤكدة في العشر الأواخر من رمضان، ومشروعيته ثابتة بالكتاب والسنة.',
          'يشترط للاعتكاف النية والطهارة وأن يكون في مسجد تقام فيه صلاة الجماعة.',
          'المقصد الأسمى من الاعتكاف هو تخلية القلب عن شواغل الدنيا والإقبال الكامل على عبادة الله تعالى.'
        ]
      },
      currentStep: 6
    };

    const res = await fetch(`${baseUrl}/researches/${controlledResearchId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(conclusionPayload)
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.success);
    assert.equal(data.data.research.conclusion.points.length, 3);
    assert.ok(data.data.research.conclusion.points[0].includes('الاعتكاف سنة مؤكدة'));
  });

  // ==========================================
  // PHASE 11: REFERENCES EXTRACTION & ARABIC SORTING
  // ==========================================
  it('Phase 11: Automatic References Extraction, Normalization & Arabic Alphabetical Sorting', async () => {
    const res = await fetch(`${baseUrl}/researches/${controlledResearchId}/references/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.success);
    assert.ok(data.data.references.length >= 3, 'Must extract at least 3 distinct bibliography references');

    // Verify that volume/page numbers are stripped in normalized bibliography
    for (const ref of data.data.references) {
      assert.ok(!ref.book.match(/ج\d+/), `Bibliography entry should not have volume number: ${ref.book}`);
      assert.ok(!ref.book.match(/ص\s*\d+/), `Bibliography entry should not have page number: ${ref.book}`);
    }

    // Verify Arabic alphabetical ordering
    const books = data.data.references.map((r) => r.book);
    assert.ok(books.some((b) => b.includes('لسان العرب')));
    assert.ok(books.some((b) => b.includes('المغني')));
    assert.ok(books.some((b) => b.includes('المجموع')));
  });

  // ==========================================
  // PHASE 9: A4 PREVIEW & PAGINATION RULES
  // ==========================================
  it('Phase 9: A4 Document Model & Pagination Invariants', async () => {
    const res = await fetch(`${baseUrl}/researches/${controlledResearchId}/preview`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.success);

    const docModel = data.data.document;
    assert.ok(docModel.pages.length >= 6, `Expected at least 6 pages, got ${docModel.pages.length}`);

    // Cover Page
    const cover = docModel.pages.find((p) => p.pageType === 'cover');
    assert.ok(cover);
    assert.equal(cover.data.title, 'أحكام الاعتكاف ومقاصده في الشريعة الإسلامية');
    assert.equal(cover.data.university, 'جامعة هرمود');

    // Introduction Page
    const intro = docModel.pages.find((p) => p.pageType === 'introduction');
    assert.ok(intro);
    assert.ok(intro.blocks.some((b) => b.text.includes('فإن الاعتكاف من أعظم القربات')));

    // Topic Pages & Page-based Footnotes
    const topicPages = docModel.pages.filter((p) => p.pageType === 'topic');
    assert.ok(topicPages.length >= 2);
    const pageWithFn = topicPages.find((p) => p.footnotes && p.footnotes.length > 0);
    assert.ok(pageWithFn, 'At least one topic page must contain page-local footnotes');
    assert.equal(pageWithFn.footnotes[0].number, 1, 'Page footnotes must start at (1)');

    // Conclusion Page
    const conclusion = docModel.pages.find((p) => p.pageType === 'conclusion');
    assert.ok(conclusion);
    assert.equal(conclusion.data.points.length, 3);

    // References Page
    const references = docModel.pages.find((p) => p.pageType === 'references');
    assert.ok(references);
    assert.ok(references.data.references.length >= 3);
  });

  // ==========================================
  // PHASE 12: PDF GENERATION & REAL INSPECTION
  // ==========================================
  it('Phase 12: PDF Generation with Puppeteer & Valid A4 Binary Stream', async () => {
    const res = await fetch(`${baseUrl}/researches/${controlledResearchId}/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('application/pdf'), `Expected PDF content-type, got ${contentType}`);

    const buffer = await res.arrayBuffer();
    const pdfBuf = Buffer.from(buffer);
    assert.ok(pdfBuf.length > 15000, `PDF size is too small (${pdfBuf.length} bytes)`);

    // Verify PDF header %PDF-
    const header = pdfBuf.subarray(0, 5).toString('ascii');
    assert.equal(header, '%PDF-', 'Must contain valid PDF header magic bytes');

    // Also inspect HTML structure
    const htmlRes = await fetch(`${baseUrl}/researches/${controlledResearchId}/pdf/html`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const html = await htmlRes.text();
    assert.ok(html.includes('أحكام الاعتكاف ومقاصده في الشريعة الإسلامية'));
    assert.ok(html.includes('جامعة هرمود'));
    assert.ok(html.includes('حسن عبد الله أحمد'));
    assert.ok(!html.includes('جامعة الإمام'), 'Must NOT contain fake university');
    assert.ok(!html.includes('الفيومي'), 'Must NOT contain fake sample author');
  });

  // ==========================================
  // PHASE 13: DOCX GENERATION & ZIP/XML INSPECTION
  // ==========================================
  it('Phase 13: Microsoft Word DOCX Generation & Native XML Structure Verification', async () => {
    const res = await fetch(`${baseUrl}/researches/${controlledResearchId}/docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.equal(res.status, 200);
    const buffer = await res.arrayBuffer();
    const docxBuf = Buffer.from(buffer);
    assert.ok(docxBuf.length > 5000, `DOCX size is too small (${docxBuf.length} bytes)`);

    // Unzip DOCX and inspect internal OpenXML files
    const zip = await JSZip.loadAsync(docxBuf);
    assert.ok(zip.file('word/document.xml'), 'DOCX must contain word/document.xml');
    assert.ok(zip.file('word/footnotes.xml'), 'DOCX must contain word/footnotes.xml for native footnotes');

    const documentXml = await zip.file('word/document.xml').async('text');
    const footnotesXml = await zip.file('word/footnotes.xml').async('text');

    // 1. Verify Headings & Body text
    assert.ok(documentXml.includes('أحكام الاعتكاف ومقاصده في الشريعة الإسلامية'), 'Must contain research title');
    assert.ok(documentXml.includes('المبحث الأول'), 'Must contain Mabhath 1');
    assert.ok(documentXml.includes('المطلب الأول'), 'Must contain Matlab 1');
    assert.ok(documentXml.includes('<w:footnoteReference'), 'Must contain native Word footnoteReference tags');

    // 2. Verify Native Footnotes XML
    assert.ok(footnotesXml.includes('لسان العرب'), 'Footnotes XML must contain Ibn Manzoor citation');
    assert.ok(footnotesXml.includes('المغني'), 'Footnotes XML must contain Ibn Qudamah citation');
    assert.ok(footnotesXml.includes('Amiri'), 'Footnotes XML must format with Amiri font');
    assert.ok(footnotesXml.includes('w:bidi'), 'Footnotes XML must have RTL bidirectional tag');
  });

  // ==========================================
  // PHASE 14: EMPTY RESEARCH TEST (EMPTY = EMPTY)
  // ==========================================
  it('Phase 14: Empty Research Invariant (Zero Mock / Zero Fake Data across Preview, PDF & DOCX)', async () => {
    // 1. Create brand new empty research
    const createRes = await fetch(`${baseUrl}/researches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: '',
        cover: {}
      })
    });

    const createData = await createRes.json();
    assert.equal(createRes.status, 201, `Empty research creation failed: ${JSON.stringify(createData)}`);
    emptyResearchId = createData.data.research._id;

    const freshDoc = await Research.findById(emptyResearchId);
    assert.equal(freshDoc.title, '');
    assert.equal(freshDoc.cover?.university || '', '');
    assert.equal(freshDoc.cover?.studentName || '', '');
    assert.equal(freshDoc.cover?.logoUrl || '', '');
    assert.equal(freshDoc.introduction?.opening || '', '');
    assert.equal(freshDoc.introduction?.text || '', '');
    assert.deepEqual(freshDoc.structure?.tree || [], []);
    assert.deepEqual(freshDoc.topics || [], []);
    assert.deepEqual(freshDoc.conclusion?.points || [], []);
    assert.deepEqual(freshDoc.references || [], []);

    // 2. Preview Empty Research
    const previewRes = await fetch(`${baseUrl}/researches/${emptyResearchId}/preview`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const previewData = await previewRes.json();
    assert.equal(previewRes.status, 200);

    const docModel = previewData.data.document;
    assert.equal(docModel.title, '');
    const coverPage = docModel.pages.find((p) => p.pageType === 'cover');
    assert.equal(coverPage.data.title, '');
    assert.equal(coverPage.data.university, '');
    assert.equal(coverPage.data.logoUrl || '', '');

    const topicPages = docModel.pages.filter((p) => p.pageType === 'topic');
    assert.equal(topicPages.length, 0, 'Empty research must have 0 topic pages');

    const conclusionPage = docModel.pages.find((p) => p.pageType === 'conclusion');
    assert.deepEqual(conclusionPage.data.points, [], 'Empty research must have 0 conclusion results');

    const refPage = docModel.pages.find((p) => p.pageType === 'references');
    assert.deepEqual(refPage.data.references, [], 'Empty research must have 0 references');

    // 3. DOCX Export Guard & Direct Service Test
    const docxRes = await fetch(`${baseUrl}/researches/${emptyResearchId}/docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      }
    });
    // API correctly enforces entering a title before final file export
    assert.equal(docxRes.status, 400);
    const docxGuardData = await docxRes.json();
    assert.equal(docxGuardData.code, 'VALIDATION_FAILED');

    // Direct DocxGenerator on empty research generates valid clean buffer without mock data
    const directDocxBuf = await DocxGenerator.generateDocx(freshDoc);
    assert.ok(directDocxBuf.length > 2000);

    // 4. PDF HTML Empty Research
    const htmlRes = await fetch(`${baseUrl}/researches/${emptyResearchId}/pdf/html`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const html = await htmlRes.text();
    assert.ok(!html.includes('جامعة الإمام'));
    assert.ok(!html.includes('الفيومي'));
    assert.ok(!html.includes('الاعتكاف'));
  });
});

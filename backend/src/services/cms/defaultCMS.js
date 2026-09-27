/**
 * Default Multilingual CMS Content (Arabic, Somali, English)
 * Ensures 100% resilient zero-downtime offline fallbacks and seamless seeding
 */

const defaultCMS = {
  home: {
    hero: {
      label: {
        ar: 'المنصة الأكاديمية الذكية للبحوث الجامعية',
        so: 'Madasha Caqliga Badan ee Cilmi-baarisyada Jaamacadda',
        en: 'The Smart Academic Platform for University Researches'
      },
      title: {
        ar: 'أنشئ بحثك الأكاديمي بسهولة',
        so: 'U diyaari cilmi-baaristaada si fudud',
        en: 'Create Your Academic Research Effortlessly'
      },
      highlightedTitle: {
        ar: 'بسهولة',
        so: 'si fudud',
        en: 'Effortlessly'
      },
      description: {
        ar: 'منصة ذكية متكاملة تساعدك في إعداد وتنسيق وكتابة بحوثك الأكاديمية وفق أعلى المعايير المعتمدة للجامعات، مع التصدير المباشر بتنسيق Word و PDF.',
        so: 'Madal dhamaystiran oo kugu caawinaysa diyaarinta, nidaaminta, iyo qorista cilmi-baaristaada jaamacadeed oo leh soo dajin toos ah oo Word iyo PDF ah.',
        en: 'An intelligent all-in-one platform to help you prepare, format, and author university research aligned with academic standards, with instant Word and PDF export.'
      },
      primaryButtonText: {
        ar: 'ابدأ بحثك الآن',
        so: 'Bilow cilmi-baaristaada',
        en: 'Start Your Research Now'
      },
      primaryButtonUrl: '/research/new',
      secondaryButtonText: {
        ar: 'شاهد كيف يعمل',
        so: 'Eeg sida ay u shaqeyso',
        en: 'See How It Works'
      },
      secondaryButtonAction: 'open_video',
      image: '',
      enabled: true
    },
    sections: [
      {
        id: 'journey-section',
        label: {
          ar: 'رحلة البحث المتكامل',
          so: 'Socdaalka Cilmi-baarista',
          en: 'Comprehensive Research Journey'
        },
        title: {
          ar: 'ابدأ بحثك من فكرة واضحة',
          so: 'Ka bilow cilmi-baaristaada fikrad cad',
          en: 'Start with a Clear Concept'
        },
        description: {
          ar: 'حوّل فكرتك إلى بحث أكاديمي منظم من خلال خطوات بسيطة وواضحة ترشدك خطوة بخطوة نحو بحث جامعي متكامل.',
          so: 'U beddel fikraddaada cilmi-baaris nidaamsan adoo maraya tallaabooyin fudud oo cad.',
          en: 'Transform your concept into a structured academic research through simple guided steps.'
        },
        image: '',
        imagePosition: 'left',
        order: 1,
        enabled: true
      },
      {
        id: 'ai-formatting-section',
        label: {
          ar: 'تنسيق أكاديمي ذكي',
          so: 'Nidaaminta Qoraalka ee AI',
          en: 'Smart Academic Formatting'
        },
        title: {
          ar: 'صياغة علمية وتوثيق دقيق',
          so: 'Qoraal cilmiyeed iyo tixraacyo sax ah',
          en: 'Scholarly Writing & Precise Citations'
        },
        description: {
          ar: 'نوفر لك أدوات ذكية لصياغة المقدمات والمطالب والخاتمة مع ضبط الهوامش والمراجع وفق أصول البحث العلمي.',
          so: 'Waxaan kuu fududeyneynaa qorista hordhaca, qaybaha cilmi-baarista, iyo hagaajinta tixraacyada.',
          en: 'Intelligent assistants for structuring chapters, drafting content, and automatically managing footnote citations.'
        },
        image: '',
        imagePosition: 'right',
        order: 2,
        enabled: true
      },
      {
        id: 'export-section',
        label: {
          ar: 'تصدير فوري معتمد',
          so: 'Soo Dajin Toos ah',
          en: 'Instant Print-Ready Export'
        },
        title: {
          ar: 'تصدير جاهز للطباعة والتقديم',
          so: 'Soo daji fayl diyaar u ah daabacaadda',
          en: 'Export Ready for Print & Submission'
        },
        description: {
          ar: 'قم بتحميل بحثك فوراً بصيغة PDF أو مستند Word (DOCX) منسق بصفحة غلاف وهوامش رسمية وإطارات مزخرفة.',
          so: 'Kala soo deg cilmi-baaristaada qaab PDF ama Word (DOCX) oo leh bogga hore iyo xuduudaha rasmiga ah.',
          en: 'Download your finalized document instantly in pristine PDF or editable DOCX formats.'
        },
        image: '',
        imagePosition: 'left',
        order: 3,
        enabled: true
      }
    ]
  },

  features: {
    badge: {
      ar: 'ميزات المنصة الأكاديمية',
      so: 'Astaamaha Madasha',
      en: 'Platform Features'
    },
    title: {
      ar: 'المميزات الأكاديمية والتقنية',
      so: 'Astaamaha Cilmiyeed & Farsamo',
      en: 'Academic & Technical Features'
    },
    description: {
      ar: 'كل ما تحتاجه لإعداد بحث جامعي رصين متكامل في مكان واحد وبأعلى معايير الجودة الأكاديمية.',
      so: 'Wax kasta oo aad ugu baahan tahay diyaarinta cilmi-baaris jaamacadeed oo tayo sare leh.',
      en: 'Everything you need to craft high-standard academic papers in one place.'
    },
    features: [
      {
        id: '1',
        icon: 'FileEdit',
        title: {
          ar: 'خطة بحث متكاملة',
          so: 'Qorshe Cilmi-baaris Dhamaystiran',
          en: 'Comprehensive Research Plan'
        },
        description: {
          ar: 'توليد واقتراح خطة بحث محكمة ومقسمة إلى أبواب وفصول ومطالب منطقية.',
          so: 'Abuuritaanka qorshe cilmi-baaris oo u qaybsan cutubyo iyo mowduucyo macquul ah.',
          en: 'Generate and organize structured thesis outlines, chapters, and sections.'
        },
        order: 1,
        enabled: true
      },
      {
        id: '2',
        icon: 'Sparkles',
        title: {
          ar: 'صياغة علمية متخصصة',
          so: 'Qoraal Cilmiyeed Casri ah',
          en: 'Specialized Scholarly Writing'
        },
        description: {
          ar: 'مساعدة ذكية في صياغة المحتوى الأكاديمي بلغة عربية فصحى رصينة.',
          so: 'Caawinaad caqliyeed oo ku saabsan qorista qoraalka cilmiga ah.',
          en: 'AI-assisted drafting with formal academic vocabulary and rigor.'
        },
        order: 2,
        enabled: true
      },
      {
        id: '3',
        icon: 'BookOpen',
        title: {
          ar: 'توثيق المراجع والهوامش',
          so: 'Tixraacyada & Faallooyinka Hoose',
          en: 'Citations & Footnote Referencing'
        },
        description: {
          ar: 'تنظيم المصادر والمراجع الأكاديمية وترتيبها حسب المعايير المعتمدة.',
          so: 'Habaynta ilaha iyo tixraacyada cilmiga ah si waafaqsan heerarka caalamiga ah.',
          en: 'Automated footnote tracking and standardized bibliographic indexing.'
        },
        order: 3,
        enabled: true
      },
      {
        id: '4',
        icon: 'FileDown',
        title: {
          ar: 'تصدير Word و PDF',
          so: 'Soo Dajinta Word & PDF',
          en: 'Word & PDF Export'
        },
        description: {
          ar: 'تصدير فوري للبحث بصيغة DOCX أو PDF بجودة طباعة فائقة.',
          so: 'Soo dajinta degdegga ah ee cilmi-baarista qaab DOCX ama PDF ah.',
          en: 'One-click publication in print-ready PDF and editable Microsoft Word.'
        },
        order: 4,
        enabled: true
      },
      {
        id: '5',
        icon: 'ShieldCheck',
        title: {
          ar: 'أمان وخصوصية تامة',
          so: 'Amni & Qarsoodi Buuxda',
          en: 'Security & Complete Privacy'
        },
        description: {
          ar: 'بياناتك وبحوثك محفوظة بأعلى درجات التشفير والسرية التامة.',
          so: 'Xogtaada iyo cilmi-baaristaada waxaa lagu ilaaliyaa habka ugu sarreeya ee amniga.',
          en: 'End-to-end encrypted storage ensuring your academic intellectual property is safe.'
        },
        order: 5,
        enabled: true
      },
      {
        id: '6',
        icon: 'Clock',
        title: {
          ar: 'توفير الوقت والجهد',
          so: 'Badbaadinta Waqtiga & Dadaalka',
          en: 'Save Hours of Formatting'
        },
        description: {
          ar: 'اختصار ساعات طويلة من التنسيق والترتيب اليدوي بنقرة زر واحدة.',
          so: 'Ka gaabi saacado badan oo habeyn gacanta ah hal gujin.',
          en: 'Eliminate tedious manual layout work and focus on research insights.'
        },
        order: 6,
        enabled: true
      }
    ]
  },

  'how-it-works': {
    title: {
      ar: 'طريقة الاستخدام',
      so: 'Habka Isticmaalka',
      en: 'How It Works'
    },
    subtitle: {
      ar: 'خطوات بسيطة وواضحة لتحويل فكرتك إلى بحث أكاديمي متكامل',
      so: 'Tallaabooyin fudud oo lagu diyaariyo cilmi-baaris buuxda',
      en: 'Simple, streamlined steps to turn your concept into a completed thesis'
    },
    steps: [
      {
        id: 'step-1',
        number: '01',
        icon: 'Lightbulb',
        title: {
          ar: 'أدخل عنوان وفكرة البحث',
          so: 'Geli Cinwaanka & Fikradda',
          en: 'Enter Concept & Title'
        },
        description: {
          ar: 'حدد موضوعك ومجالك الأكاديمي والجامعة لبدء الهيكلة الذكية.',
          so: 'Xulo mowduucaaga, jaamacaddaada, iyo macluumaadka aasaasiga ah.',
          en: 'Specify research topic, discipline, and university details.'
        },
        order: 1,
        enabled: true
      },
      {
        id: 'step-2',
        number: '02',
        icon: 'ListTree',
        title: {
          ar: 'اعتمد خطة البحث والمطالب',
          so: 'Xaqiiji Qorshaha Cilmi-baarista',
          en: 'Adopt Research Structure'
        },
        description: {
          ar: 'راجع الفصول والمباحث المقترحة وعدلها بما يتناسب مع متطلباتك.',
          so: 'Dib u eeg cutubyada iyo qaybaha la soo jeediyay oo wax ka beddel.',
          en: 'Review and customize the generated outline, sections, and objectives.'
        },
        order: 2,
        enabled: true
      },
      {
        id: 'step-3',
        number: '03',
        icon: 'PenTool',
        title: {
          ar: 'صياغة وتوثيق المحتوى',
          so: 'Qorista & Tixraacyada',
          en: 'Drafting & Footnote Citation'
        },
        description: {
          ar: 'اكتب وراجع نصوص البحث بمساعدة الأدوات الأكاديمية الذكية.',
          so: 'Qor oo dib u eeg nuxurka adoo kaashanaya qalabka caqliga badan.',
          en: 'Write and refine paragraphs with assisted footnotes and sources.'
        },
        order: 3,
        enabled: true
      },
      {
        id: 'step-4',
        number: '04',
        icon: 'Printer',
        title: {
          ar: 'التصدير والطباعة',
          so: 'Soo Dajinta & Daabacaadda',
          en: 'Export & Print'
        },
        description: {
          ar: 'حمّل بحثك الجاهز بصيغة PDF أو Word بصفحة غلاف وإطارات أنيقة.',
          so: 'Soo daji cilmi-baaristaada oo diyaarsan qaab PDF ama Word ah.',
          en: 'Export your final work with cover page, margins, and borders.'
        },
        order: 4,
        enabled: true
      }
    ]
  },

  about: {
    title: {
      ar: 'عن المنصة',
      so: 'Nagu Saabsan',
      en: 'About the Platform'
    },
    introduction: {
      ar: 'منصة مساعد البحث الأكاديمي هي منصة رقمية رائدة تهدف إلى تمكين طلاب الجامعات والباحثين من إعداد أبحاثهم العلمية باحترافية وسهولة.',
      so: 'Madasha Kaaliyaha Cilmi-baarista waa nidaam casri ah oo u fududeynaya ardayda iyo cilmi-baarayaasha qorista cilmi-baarisyada heerka sare ah.',
      en: 'The Academic Research Assistant is a premier digital platform empowering students and scholars to produce rigorous research with ease.'
    },
    vision: {
      ar: 'أن نكون المنصة الأكاديمية الذكية الأولى في العالم العربي لدعم وإثراء البحث العلمي الجامعي.',
      so: 'Inaan noqono madasha koowaad ee taageerta horumarinta cilmi-baarista jaamacadeed.',
      en: 'To be the leading smart academic workspace supporting scholastic research globally.'
    },
    mission: {
      ar: 'توفير بيئة عمل أكاديمية ذكية وميسرة تختصر وقت الباحث وترتقي بجودة صياغة وتنسيق البحوث العلمية.',
      so: 'Bixinta jawi wax-qabad oo caqli badan kaasoo badbaadiya waqtiga cilmi-baaraha korna u qaada tayada qoraalka.',
      en: 'Provide an intuitive scholarly environment that streamlines formatting and elevates research quality.'
    },
    targetAudience: {
      ar: 'طلاب البكالوريوس، طلبة الدراسات العليا (ماجستير ودكتوراه)، والأساتذة والباحثون الأكاديميون.',
      so: 'Ardayda heerka koowaad, heerka labaad (Master), heerka saddexaad (PhD), iyo macallimiinta jaamacadda.',
      en: 'Undergraduate students, Master & PhD candidates, professors, and academic researchers.'
    },
    blocks: [
      {
        id: 'b1',
        title: {
          ar: 'أصالة البحث العلمي',
          so: 'Asalka Cilmi-baarista',
          en: 'Academic Integrity'
        },
        description: {
          ar: 'الالتزام بأخلاقيات وضوابط البحث الأكاديمي الرصين.',
          so: 'U hoggaansanaanta anshaxa iyo xeerarka cilmi-baarista.',
          en: 'Strict adherence to scholarly standards and ethical citation.'
        },
        order: 1,
        enabled: true
      },
      {
        id: 'b2',
        title: {
          ar: 'سهولة الاستخدام',
          so: 'Fududaanta Isticmaalka',
          en: 'Intuitive Experience'
        },
        description: {
          ar: 'واجهة بديهية وسريعة تناسب جميع الباحثين في مختلف التخصصات.',
          so: 'Waji fudud oo ku habboon cilmi-baarayaasha qaybaha kala duwan.',
          en: 'Clean, frictionless workflows for scholars across all disciplines.'
        },
        order: 2,
        enabled: true
      },
      {
        id: 'b3',
        title: {
          ar: 'تكامل الخدمات',
          so: 'Adeegyo Isku Dhafan',
          en: 'End-to-End Workflow'
        },
        description: {
          ar: 'من الغلاف والمقدمة إلى الفهارس والمراجع والتصدير المباشر.',
          so: 'Laga bilaabo bogga hore ilaa tixraacyada iyo soo dajinta.',
          en: 'From cover page and hypothesis to footnotes, index, and export.'
        },
        order: 3,
        enabled: true
      }
    ]
  },

  video: {
    videoTitle: {
      ar: 'شاهد كيف يعمل',
      so: 'Daawo sida uu u shaqeeyo',
      en: 'See How It Works'
    },
    videoDescription: {
      ar: 'تعرّف على طريقة استخدام المنصة خطوة بخطوة.',
      so: 'Baro sida loo isticmaalo website-ka tallaabo tallaabo.',
      en: 'Learn how to use the platform step by step.'
    },
    tutorialVideos: {
      mobile: {
        enabled: true,
        videoUrl: '',
        thumbnailUrl: '',
        title: {
          ar: 'شرح استخدام الهاتف',
          so: 'Sharaxaadda telefoonka',
          en: 'Mobile Tutorial'
        },
        description: {
          ar: 'شاهد طريقة استخدام المنصة من الهاتف.',
          so: 'Daawo sida loo isticmaalo madasha taleefanka.',
          en: 'Watch how to use the platform on mobile.'
        }
      },
      desktop: {
        enabled: true,
        videoUrl: '',
        thumbnailUrl: '',
        title: {
          ar: 'شرح استخدام الكمبيوتر',
          so: 'Sharaxaadda computer-ka',
          en: 'Desktop Tutorial'
        },
        description: {
          ar: 'شاهد طريقة استخدام المنصة من الكمبيوتر.',
          so: 'Daawo sida loo isticmaalo madasha computer-ka.',
          en: 'Watch how to use the platform on computer.'
        }
      }
    },
    videoUrl: '',
    posterUrl: '',
    enabled: true
  },

  navigation: {
    websiteName: {
      ar: 'مساعد البحث الأكاديمي',
      so: 'Kaaliyaha Cilmi-baarista',
      en: 'Academic Research Assistant'
    },
    subtitle: {
      ar: 'من الفكرة إلى البحث المتكامل',
      so: 'Laga bilaabo Fikirka ilaa Cilmi-baaris Dhameystiran',
      en: 'From Concept to Completed Thesis'
    },
    logo: '',
    loginButtonText: {
      ar: 'تسجيل الدخول',
      so: 'Gal Akoonka',
      en: 'Sign In'
    },
    registerButtonText: {
      ar: 'إنشاء حساب',
      so: 'Is-diiwaangeli',
      en: 'Sign Up'
    },
    links: [
      { id: 'l1', label: { ar: 'الرئيسية', so: 'Hormuudka', en: 'Home' }, url: '/', order: 1, enabled: false },
      { id: 'l2', label: { ar: 'المميزات', so: 'Astaamaha', en: 'Features' }, url: '/features', order: 2, enabled: false },
      { id: 'l3', label: { ar: 'طريقة الاستخدام', so: 'Habka Isticmaalka', en: 'How It Works' }, url: '/how-it-works', order: 3, enabled: false },
      { id: 'l4', label: { ar: 'عن المنصة', so: 'Nagu Saabsan', en: 'About Us' }, url: '/about', order: 4, enabled: false }
    ]
  },

  footer: {
    description: {
      ar: 'المنصة الأكاديمية الذكية الرائدة لإعداد وتنسيق البحوث الجامعية وفق المعايير العلمية المعتمدة.',
      so: 'Madasha caqliga badan ee diyaarinta iyo habeynta cilmi-baarisyada jaamacadeed.',
      en: 'The leading smart platform for authoring and formatting university academic research.'
    },
    contactEmail: 'info@baxthi.com',
    contactPhone: '+966 50 000 0000',
    copyrightText: {
      ar: 'جميع الحقوق محفوظة © 2026 مساعد البحث الأكاديمي',
      so: 'Dhammaan xuquuqda way dhowran yihiin © 2026 Kaaliyaha Cilmi-baarista',
      en: 'All rights reserved © 2026 Academic Research Assistant'
    },
    socialLinks: {
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      github: 'https://github.com',
      facebook: '',
      youtube: ''
    }
  },

  seo: {
    siteTitle: {
      ar: 'مساعد البحث الأكاديمي | من الفكرة إلى البحث المتكامل',
      so: 'Kaaliyaha Cilmi-baarista | Fikirka ilaa Cilmi-baaris Dhameystiran',
      en: 'Academic Research Assistant | Smart Thesis & Research Workspace'
    },
    metaDescription: {
      ar: 'المنصة الأكاديمية الذكية لإعداد وتنسيق الأبحاث الجامعية والعلمية باللغة العربية مع التصدير بصيغة Word و PDF.',
      so: 'Madal caqli badan oo lagu diyaariyo laguna nidaamiyo cilmi-baarisyada jaamacadeed oo leh soo dajin Word iyo PDF ah.',
      en: 'Smart academic platform to prepare, format, and export university theses and research papers in Word and PDF.'
    },
    keywords: {
      ar: 'بحث أكاديمي, بحوث جامعية, مساعد الذكاء الاصطناعي, تنسيق خطة البحث, توثيق المراجع, تصدير وورد, تصدير PDF',
      so: 'cilmi-baaris, jaamacad, qoraal cilmiyeed, tixraacyo, soo dajinta word, soo dajinta pdf',
      en: 'academic research, thesis builder, AI research assistant, citations, word export, pdf thesis'
    },
    ogTitle: {
      ar: 'مساعد البحث الأكاديمي',
      so: 'Kaaliyaha Cilmi-baarista',
      en: 'Academic Research Assistant'
    },
    ogDescription: {
      ar: 'أنشئ بحثك الأكاديمي بسهولة وبأعلى المعايير المعتمدة',
      so: 'U diyaari cilmi-baaristaada si fudud oo heer sare ah',
      en: 'Create your academic thesis effortlessly with top standards'
    },
    ogImage: '',
    pageSEO: {
      home: {
        title: { ar: 'الرئيسية | مساعد البحث الأكاديمي', so: 'Hormuudka | Kaaliyaha Cilmi-baarista', en: 'Home | Academic Research Assistant' },
        description: { ar: 'أنشئ بحثك الأكاديمي بسهولة', so: 'U diyaari cilmi-baaristaada si fudud', en: 'Create your academic research effortlessly' }
      },
      features: {
        title: { ar: 'المميزات | مساعد البحث الأكاديمي', so: 'Astaamaha | Kaaliyaha Cilmi-baarista', en: 'Features | Academic Research Assistant' },
        description: { ar: 'مميزات المنصة الأكاديمية الذكية', so: 'Astaamaha madasha caqliga badan', en: 'Smart academic platform features' }
      },
      'how-it-works': {
        title: { ar: 'طريقة الاستخدام | مساعد البحث الأكاديمي', so: 'Habka Isticmaalka | Kaaliyaha Cilmi-baarista', en: 'How It Works | Academic Research Assistant' },
        description: { ar: 'خطوات إعداد البحث الأكاديمي', so: 'Tallaabooyinka diyaarinta cilmi-baarista', en: 'Steps to build your research paper' }
      },
      about: {
        title: { ar: 'عن المنصة | مساعد البحث الأكاديمي', so: 'Nagu Saabsan | Kaaliyaha Cilmi-baarista', en: 'About | Academic Research Assistant' },
        description: { ar: 'رؤية ورسالة مساعد البحث الأكاديمي', so: 'Himilada iyo aragtida madasha', en: 'Vision and mission of the academic assistant' }
      },
      login: {
        title: { ar: 'تسجيل الدخول | مساعد البحث الأكاديمي', so: 'Galitaanka | Kaaliyaha Cilmi-baarista', en: 'Sign In | Academic Research Assistant' },
        description: { ar: 'سجل دخولك إلى منصتك الأكاديمية', so: 'Gal akoonkaaga madasha', en: 'Sign in to your academic workspace' }
      },
      register: {
        title: { ar: 'إنشاء حساب جديد | مساعد البحث الأكاديمي', so: 'Is-diiwaangeli | Kaaliyaha Cilmi-baarista', en: 'Sign Up | Academic Research Assistant' },
        description: { ar: 'انضم إلى مساعد البحث الأكاديمي', so: 'Ku biir madasha cilmi-baarista', en: 'Join the academic research assistant' }
      }
    }
  }
};

module.exports = defaultCMS;

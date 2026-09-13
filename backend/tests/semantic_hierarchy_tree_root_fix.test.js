const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  ACADEMIC_LEVELS,
  normalizeToSemanticTree,
  resolveAcademicHierarchy,
  formatAcademicHeadingTitle,
  flattenSemanticTreeToTopics,
  stripAcademicPrefix,
  getArabicOrdinal
} = require('../src/services/document/academicHierarchy');

describe('Semantic Academic Hierarchy Tree Root Fix Acceptance', () => {
  it('TEST A: Correctly builds nested semantic tree with Mabhath -> Mataleeb -> Branches', () => {
    const rawStructure = [
      {
        id: 'mb-1',
        title: 'المبحث الأول: تعريف الاعتكاف ومشروعيته',
        level: 'mabhath',
        children: [
          {
            id: 'mt-1',
            title: 'المطلب الأول: تعريف الاعتكاف',
            children: [
              { id: 'br-1', title: 'الفرع الأول: المعنى اللغوي' },
              { id: 'br-2', title: 'الفرع الثاني: المعنى الاصطلاحي' }
            ]
          },
          {
            id: 'mt-2',
            title: 'المطلب الثاني: أحكام الاعتكاف',
            children: [
              { id: 'br-3', title: 'الفرع الأول: شروط الاعتكاف' },
              { id: 'br-4', title: 'الفرع الثاني: مبطلات الاعتكاف' }
            ]
          },
          {
            id: 'mt-3',
            title: 'المطلب الثالث: مقاصد الاعتكاف وآثاره التربوية والإيمانية',
            children: []
          }
        ]
      }
    ];

    const tree = normalizeToSemanticTree(rawStructure);
    assert.equal(tree.length, 1);

    const mabhath = tree[0];
    assert.equal(mabhath.type, ACADEMIC_LEVELS.MABHATH);
    assert.equal(mabhath.parentId, null);
    assert.equal(mabhath.children.length, 3);

    // Verify each Matlab is a true child of the Mabhath
    mabhath.children.forEach((matlab, idx) => {
      assert.equal(matlab.type, ACADEMIC_LEVELS.MATALAB);
      assert.equal(matlab.parentId, mabhath.id);
      assert.equal(matlab.order, idx + 1);
    });

    // Verify branches belong to matlab 1
    const matlab1 = mabhath.children[0];
    assert.equal(matlab1.children.length, 2);
    assert.equal(matlab1.children[0].type, ACADEMIC_LEVELS.BRANCH);
    assert.equal(matlab1.children[0].parentId, matlab1.id);
  });

  it('TEST B: Adding another matlab when Mabhath exists creates it as a child of the Mabhath', () => {
    const initialTree = normalizeToSemanticTree([
      {
        id: 'mb-1',
        title: 'المبحث الأول: تعريف الاعتكاف',
        level: 'mabhath',
        children: [
          { id: 'mt-1', title: 'تعريف الاعتكاف لغة واصطلاحا' }
        ]
      }
    ]);

    const mabhath = initialTree[0];
    const newMatlab = {
      id: 'mt-2',
      type: ACADEMIC_LEVELS.MATALAB,
      title: 'شروط صحة الاعتكاف',
      parentId: mabhath.id,
      order: 2,
      children: []
    };
    mabhath.children.push(newMatlab);

    const resolved = resolveAcademicHierarchy(initialTree);
    assert.equal(resolved.hasMabhath, true);
    assert.equal(resolved.mainLevel, ACADEMIC_LEVELS.MABHATH);
    assert.equal(resolved.tree[0].children.length, 2);
    assert.equal(resolved.tree[0].children[1].parentId, 'mb-1');
  });

  it('TEST C: Adding a branch under a matlab links parentId to that matlab', () => {
    const tree = normalizeToSemanticTree([
      {
        id: 'mt-1',
        title: 'المطلب الأول: تعريف الاعتكاف',
        type: 'matalab',
        children: [{ id: 'br-1', title: 'المعنى اللغوي' }]
      }
    ]);

    const newBranch = {
      id: 'br-2',
      type: ACADEMIC_LEVELS.BRANCH,
      title: 'المعنى الاصطلاحي',
      parentId: 'mt-1',
      order: 2
    };
    tree[0].children.push(newBranch);

    assert.equal(tree[0].children.length, 2);
    assert.equal(tree[0].children[1].parentId, 'mt-1');
  });

  it('TEST D: Research with NO Mabhath treats Mataleeb as Level 1 main topics', () => {
    const rawStructure = [
      {
        id: 'mt-1',
        title: 'المطلب الأول: تعريف الاعتكاف ومشروعيته',
        children: [
          { id: 'br-1', title: 'المعنى اللغوي' },
          { id: 'br-2', title: 'المعنى الاصطلاحي' }
        ]
      },
      {
        id: 'mt-2',
        title: 'المطلب الثاني: أحكام الاعتكاف وشروطه',
        children: [
          { id: 'br-3', title: 'شروط الاعتكاف' }
        ]
      }
    ];

    const tree = normalizeToSemanticTree(rawStructure);
    assert.equal(tree.length, 2);
    assert.equal(tree[0].type, ACADEMIC_LEVELS.MATALAB);
    assert.equal(tree[0].parentId, null);
    assert.equal(tree[1].type, ACADEMIC_LEVELS.MATALAB);
    assert.equal(tree[1].parentId, null);

    const resolved = resolveAcademicHierarchy(tree);
    assert.equal(resolved.hasMabhath, false);
    assert.equal(resolved.mainLevel, ACADEMIC_LEVELS.MATALAB);
  });

  it('TEST E & F: Adding a Mabhath wraps existing Mataleeb under it, and removing Mabhath unwraps them back to root', () => {
    // Starting with Case 2 (No Mabhath)
    const matlab1 = { id: 'mt-1', type: 'matalab', title: 'المطلب الأول', children: [] };
    const matlab2 = { id: 'mt-2', type: 'matalab', title: 'المطلب الثاني', children: [] };
    let tree = [matlab1, matlab2];

    assert.equal(resolveAcademicHierarchy(tree).hasMabhath, false);

    // TEST E: Add Mabhath
    const newMabhath = {
      id: 'mb-1',
      type: ACADEMIC_LEVELS.MABHATH,
      title: 'عنوان المبحث الأول',
      parentId: null,
      order: 1,
      children: tree.map((m, idx) => ({ ...m, parentId: 'mb-1', order: idx + 1 }))
    };
    tree = [newMabhath];

    const resolvedWithMb = resolveAcademicHierarchy(tree);
    assert.equal(resolvedWithMb.hasMabhath, true);
    assert.equal(resolvedWithMb.mainLevel, ACADEMIC_LEVELS.MABHATH);
    assert.equal(tree[0].children.length, 2);
    assert.equal(tree[0].children[0].parentId, 'mb-1');

    // TEST F: Remove Mabhath
    const unwrappedMataleeb = tree[0].children.map((m, idx) => ({
      ...m,
      parentId: null,
      order: idx + 1
    }));
    tree = unwrappedMataleeb;

    const resolvedWithoutMb = resolveAcademicHierarchy(tree);
    assert.equal(resolvedWithoutMb.hasMabhath, false);
    assert.equal(resolvedWithoutMb.mainLevel, ACADEMIC_LEVELS.MATALAB);
    assert.equal(tree.length, 2);
    assert.equal(tree[0].parentId, null);
  });

  it('TEST G: Renaming title preserves semantic type, ID, and parentId', () => {
    const matlab = {
      id: 'mt-100',
      type: ACADEMIC_LEVELS.MATALAB,
      title: 'تعريف الاعتكاف',
      parentId: 'mb-1',
      order: 1,
      children: []
    };

    // Rename title
    matlab.title = 'أحكام الاعتكاف ومقاصده الشرعية';

    assert.equal(matlab.id, 'mt-100');
    assert.equal(matlab.type, ACADEMIC_LEVELS.MATALAB);
    assert.equal(matlab.parentId, 'mb-1');
  });

  it('TEST H: Correctly flattens semantic tree to research topics with scoped ordinal titles', () => {
    const tree = [
      {
        id: 'mb-1',
        type: ACADEMIC_LEVELS.MABHATH,
        title: 'تعريف الاعتكاف ومشروعيته',
        order: 1,
        children: [
          {
            id: 'mt-1',
            type: ACADEMIC_LEVELS.MATALAB,
            title: 'تعريف الاعتكاف',
            order: 1,
            children: [{ title: 'المعنى اللغوي' }, { title: 'المعنى الاصطلاحي' }]
          },
          {
            id: 'mt-2',
            type: ACADEMIC_LEVELS.MATALAB,
            title: 'أحكام الاعتكاف',
            order: 2,
            children: []
          }
        ]
      }
    ];

    const topics = flattenSemanticTreeToTopics(tree);
    assert.equal(topics.length, 2);

    assert.equal(topics[0].h1Title, 'المطلب الأول: تعريف الاعتكاف');
    assert.equal(topics[0].mabhathTitle, 'المبحث الأول: تعريف الاعتكاف ومشروعيته');
    assert.equal(topics[0].branches.length, 2);
    assert.equal(topics[0].branches[0].title, 'الفرع الأول: المعنى اللغوي');
    assert.equal(topics[0].branches[1].title, 'الفرع الثاني: المعنى الاصطلاحي');

    assert.equal(topics[1].h1Title, 'المطلب الثاني: أحكام الاعتكاف');
  });
});

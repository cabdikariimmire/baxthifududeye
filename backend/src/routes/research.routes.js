const express = require('express');
const router = express.Router();
const researchController = require('../controllers/researchController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const {
  createResearchSchema,
  analyzeIntroSchema
} = require('../validators/researchValidator');

const multer = require('multer');
const path = require('path');
const config = require('../config/env');

// Configure multer storage for university logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = `logo-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueSuffix);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(png|jpe?g|svg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يرجى رفع صورة بصيغة PNG أو JPG أو SVG'));
    }
  }
});

// Protect all research routes with authentication
router.use(authenticate);

router.post('/', validate(createResearchSchema), researchController.createResearch);
router.get('/', researchController.listResearches);
router.get('/:id', researchController.getResearchById);
router.patch('/:id', researchController.updateResearch);
router.delete('/:id', researchController.deleteResearch);

// Cover Logo Upload / Remove
router.post('/:id/logo', upload.single('logo'), researchController.uploadLogo);

// Full Document AI Extraction Mode
router.post('/:id/ai/full-document', researchController.analyzeFullDocument);
router.post('/:id/ai/apply-full-document', researchController.applyFullDocument);

// Introduction & AI Structure
router.post('/:id/introduction/generate', researchController.generateIntroduction);
router.post('/:id/introduction/analyze', validate(analyzeIntroSchema), researchController.analyzeIntroduction);
router.patch('/:id/structure', researchController.updateStructure);

// Topics & Footnotes
router.post('/:id/topics/:topicId', researchController.saveTopic);

// References & TOC
router.post('/:id/references/generate', researchController.generateReferences);
router.post('/:id/toc/generate', researchController.generateTOC);

// Preview, PDF & DOCX
router.get('/:id/preview', researchController.getPreview);
router.post('/:id/pdf', researchController.exportPDF);
router.get('/:id/pdf/html', researchController.getPrintableHTML);
router.post('/:id/docx', researchController.exportDOCX);
router.get('/:id/docx', researchController.exportDOCX);

module.exports = router;

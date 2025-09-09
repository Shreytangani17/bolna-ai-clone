const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// In-memory storage
const knowledgeBases = new Map();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET /api/knowledge/list
router.get('/list', (req, res) => {
  const kbList = Array.from(knowledgeBases.values());
  res.json({
    success: true,
    knowledgeBases: kbList,
    total: kbList.length
  });
});

// POST /api/knowledge/create
router.post('/create', (req, res) => {
  try {
    const kb = {
      id: uuidv4(),
      name: req.body.name,
      description: req.body.description,
      type: req.body.type || 'documents',
      size: '0 MB',
      documents: 0,
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };
    
    knowledgeBases.set(kb.id, kb);
    
    res.status(201).json({
      success: true,
      knowledgeBase: kb
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/knowledge/:id/upload
router.post('/:id/upload', upload.array('files'), (req, res) => {
  try {
    const kb = knowledgeBases.get(req.params.id);
    if (!kb) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge base not found'
      });
    }

    const files = req.files.map(file => ({
      id: uuidv4(),
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      content: file.buffer.toString('utf-8'),
      uploadedAt: new Date().toISOString()
    }));

    kb.files.push(...files);
    kb.documents = kb.files.length;
    kb.size = `${(kb.files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(1)} MB`;
    kb.updatedAt = new Date().toISOString();

    knowledgeBases.set(kb.id, kb);

    res.json({
      success: true,
      knowledgeBase: kb,
      uploadedFiles: files.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/knowledge/:id
router.delete('/:id', (req, res) => {
  const deleted = knowledgeBases.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: 'Knowledge base not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Knowledge base deleted successfully'
  });
});

// GET /api/knowledge/:id/search
router.get('/:id/search', (req, res) => {
  const kb = knowledgeBases.get(req.params.id);
  if (!kb) {
    return res.status(404).json({
      success: false,
      error: 'Knowledge base not found'
    });
  }

  const query = req.query.q?.toLowerCase() || '';
  const results = kb.files
    .filter(file => file.content.toLowerCase().includes(query))
    .map(file => ({
      id: file.id,
      name: file.name,
      snippet: file.content.substring(0, 200) + '...'
    }));

  res.json({
    success: true,
    results,
    total: results.length
  });
});

module.exports = router;
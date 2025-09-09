const express = require('express');
const { v4: uuidv4 } = require('uuid');
const CallHistory = require('../models/CallHistory');
const router = express.Router();

// In-memory storage
const callHistories = new Map();

// GET /api/call-history/list
router.get('/list', (req, res) => {
  const histories = Array.from(callHistories.values())
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  
  res.json({
    success: true,
    callHistories: histories,
    total: histories.length
  });
});

// POST /api/call-history/save
router.post('/save', (req, res) => {
  try {
    const callHistory = new CallHistory({
      id: uuidv4(),
      ...req.body,
      endTime: new Date().toISOString()
    });
    
    callHistories.set(callHistory.id, callHistory);
    
    res.json({
      success: true,
      callHistory: callHistory.toJSON()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/call-history/:id
router.get('/:id', (req, res) => {
  const history = callHistories.get(req.params.id);
  if (!history) {
    return res.status(404).json({
      success: false,
      error: 'Call history not found'
    });
  }
  
  res.json({
    success: true,
    callHistory: history.toJSON()
  });
});

module.exports = router;
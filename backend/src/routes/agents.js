const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Agent = require('../models/Agent');
const router = express.Router();

// Import shared agents storage
let agents;
try {
  const webrtc = require('./webrtc');
  agents = webrtc.agents;
} catch {
  agents = new Map();
}

// Simple in-memory storage for now
const saveAgents = () => {
  // Skip file operations for now
};

// GET /api/agent/templates
router.get('/templates', (req, res) => {
  res.json({ templates: {} });
});

// POST /api/agent/create
router.post('/create', (req, res) => {
  console.log('Creating agent with data:', req.body);
  
  try {
    const agentData = {
      id: uuidv4(),
      name: req.body.name || 'Unnamed Agent',
      type: req.body.type || 'conversational',
      prompt: req.body.prompt || '',
      description: req.body.description || '',
      welcomeMessage: req.body.welcomeMessage || 'Hello!',
      voice: req.body.voice || 'alloy',
      language: req.body.language || 'en',
      providers: req.body.providers || {},
      settings: req.body.settings || {}
    };
    
    console.log('Agent data prepared:', agentData);
    
    const agent = new Agent(agentData);
    console.log('Agent created:', agent);
    
    agents.set(agent.id, agent);
    console.log('Agent stored, total agents:', agents.size);
    
    res.status(201).json({
      success: true,
      agent: agent.toJSON()
    });
  } catch (error) {
    console.error('Agent creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/agent/list
router.get('/list', (req, res) => {
  const agentList = Array.from(agents.values()).map(agent => agent.toJSON());
  res.json({
    success: true,
    agents: agentList,
    total: agentList.length
  });
});

// GET /api/agent/:id
router.get('/:id', (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({
      success: false,
      error: 'Agent not found'
    });
  }
  
  res.json({
    success: true,
    agent: agent.toJSON()
  });
});

// PUT /api/agent/:id
router.put('/:id', (req, res) => {
  const agent = agents.get(req.params.id);
  if (!agent) {
    return res.status(404).json({
      success: false,
      error: 'Agent not found'
    });
  }
  
  try {
    const updatedAgent = new Agent({
      ...agent.toJSON(),
      ...req.body,
      id: req.params.id
    });
    
    agents.set(req.params.id, updatedAgent);
    saveAgents();
    
    res.json({
      success: true,
      agent: updatedAgent.toJSON()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/agent/:id
router.delete('/:id', (req, res) => {
  try {
    const deleted = agents.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    saveAgents();
    
    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Agent deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete agent'
    });
  }
});

module.exports = { router, agents };
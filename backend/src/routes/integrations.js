const express = require('express');
const router = express.Router();

// In-memory storage for integrations
const integrations = new Map();

// Initialize default integrations
const defaultIntegrations = [
  { id: 'openai', name: 'OpenAI', category: 'LLM', status: 'disconnected', config: {} },
  { id: 'twilio', name: 'Twilio', category: 'Telephony', status: 'disconnected', config: {} },
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'TTS', status: 'disconnected', config: {} },
  { id: 'deepgram', name: 'Deepgram', category: 'ASR', status: 'disconnected', config: {} },
  { id: 'anthropic', name: 'Anthropic', category: 'LLM', status: 'disconnected', config: {} },
  { id: 'plivo', name: 'Plivo', category: 'Telephony', status: 'disconnected', config: {} },
  { id: 'azure', name: 'Azure Speech', category: 'TTS/ASR', status: 'disconnected', config: {} }
];

defaultIntegrations.forEach(int => integrations.set(int.id, int));

// GET /api/integrations/list
router.get('/list', (req, res) => {
  const integrationList = Array.from(integrations.values());
  res.json({
    success: true,
    integrations: integrationList,
    total: integrationList.length
  });
});

// POST /api/integrations/:id/configure
router.post('/:id/configure', (req, res) => {
  try {
    const integration = integrations.get(req.params.id);
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    integration.config = req.body;
    integration.status = 'connected';
    integration.updatedAt = new Date().toISOString();
    
    integrations.set(req.params.id, integration);

    res.json({
      success: true,
      integration
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/integrations/:id/disconnect
router.post('/:id/disconnect', (req, res) => {
  try {
    const integration = integrations.get(req.params.id);
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Integration not found'
      });
    }

    integration.config = {};
    integration.status = 'disconnected';
    integration.updatedAt = new Date().toISOString();
    
    integrations.set(req.params.id, integration);

    res.json({
      success: true,
      integration
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
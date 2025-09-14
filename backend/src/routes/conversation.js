const express = require('express');
const LLMService = require('../services/LLMService');
const TTSService = require('../services/TTSService');
const router = express.Router();

// Store conversation history
const conversations = new Map();

// POST /api/conversation/chat
router.post('/chat', async (req, res) => {
  try {
    const { agentId, message, sessionId = 'default', language = 'en', model = 'gpt-3.5-turbo' } = req.body;
    
    console.log('Chat request:', { message, language, model });
    
    // Get conversation history
    const conversationKey = `${agentId}-${sessionId}`;
    let history = conversations.get(conversationKey) || [];
    
    // Test agent with specified parameters
    const agent = {
      name: 'Test Assistant',
      prompt: 'You are a helpful AI assistant. Keep responses under 50 words and be conversational.',
      providers: { llm: 'openrouter' },
      model: model.includes('/') ? model : `openai/${model}`,
      language: language
    };
    
    console.log('Using agent config:', agent);
    
    // Generate response
    const response = await LLMService.generateResponse(message, agent, history);
    console.log('Generated response:', response);
    
    // Update history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: response });
    
    // Keep only last 8 messages
    if (history.length > 8) {
      history = history.slice(-8);
    }
    
    conversations.set(conversationKey, history);
    
    res.json({
      success: true,
      response,
      model: agent.model,
      language: agent.language,
      sessionId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/conversation/test
router.get('/test', async (req, res) => {
  const LLMService = require('../services/LLMService');
  
  try {
    // Test OpenAI API
    const testResponse = await LLMService.generateResponse(
      'Hello, how are you?',
      {
        name: 'Test Agent',
        prompt: 'You are a helpful assistant.',
        language: 'en',
        providers: { llm: 'openai' },
        model: 'gpt-3.5-turbo'
      },
      []
    );
    
    res.json({ 
      success: true, 
      message: 'LLM working properly',
      testResponse: testResponse,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    });
  }
});

// POST /api/conversation/voice-preview
router.post('/voice-preview', async (req, res) => {
  try {
    const { text = 'Hello, this is a voice preview test.', voice = 'alloy', provider = 'openai', language = 'en' } = req.body;
    
    if (provider === 'sarvam') {
      const LLMService = require('../services/LLMService');
      const audioBuffer = await LLMService.textToSpeech(text, voice, provider, language);
      
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length
      });
      res.send(audioBuffer);
    } else {
      // Use browser TTS for other providers
      res.json({
        success: true,
        message: 'Use browser TTS for preview',
        text: text,
        voice: voice
      });
    }
    
  } catch (error) {
    console.error('Voice preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
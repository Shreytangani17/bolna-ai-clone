const express = require('express');
const LLMService = require('../services/LLMService');
const TTSService = require('../services/TTSService');
const router = express.Router();

// Test LLM providers
router.post('/llm', async (req, res) => {
  try {
    const { provider = 'openai', model, message = 'Hello, how are you?', language = 'en' } = req.body;
    
    const mockAgent = {
      name: 'Test Agent',
      prompt: 'You are a helpful assistant.',
      providers: { llm: provider },
      model: model,
      language: language
    };
    
    const response = await LLMService.generateResponse(message, mockAgent, []);
    
    res.json({
      success: true,
      provider,
      model,
      message,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: req.body.provider
    });
  }
});

// Test TTS providers
router.post('/tts', async (req, res) => {
  try {
    const { 
      provider = 'openai', 
      voice = 'alloy', 
      text = 'Hello, this is a test of the text to speech system.',
      language = 'en',
      speed = '1.0'
    } = req.body;
    
    const ttsService = new TTSService();
    const result = await ttsService.synthesizeSpeech(text, {
      provider,
      voice,
      language,
      speed
    });
    
    res.json({
      success: true,
      provider,
      voice,
      text,
      result: {
        ...result,
        audioBuffer: result.audioBuffer ? `${result.audioBuffer.length} bytes` : 'No buffer'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: req.body.provider
    });
  }
});

// Test ASR providers
router.post('/asr', async (req, res) => {
  try {
    const { provider = 'deepgram', language = 'en' } = req.body;
    
    // Mock audio buffer for testing
    const mockAudioBuffer = Buffer.alloc(5000, 'mock audio data');
    
    const transcript = await LLMService.transcribeAudio(mockAudioBuffer, provider, language);
    
    res.json({
      success: true,
      provider,
      language,
      transcript: transcript || 'No transcript generated (mock data)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      provider: req.body.provider
    });
  }
});

// Get available providers and models
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    providers: {
      llm: LLMService.getAvailableProviders(),
      models: {
        openai: LLMService.getAvailableModels('openai'),
        anthropic: LLMService.getAvailableModels('anthropic'),
        gemini: LLMService.getAvailableModels('gemini'),
        mistral: LLMService.getAvailableModels('mistral'),
        groq: LLMService.getAvailableModels('groq'),
        meta: LLMService.getAvailableModels('meta')
      },
      tts: ['openai', 'elevenlabs', 'azure'],
      asr: ['deepgram', 'whisper', 'azure']
    }
  });
});

module.exports = router;
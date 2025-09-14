const express = require('express');
const WebSocket = require('ws');
const llmService = require('../services/LLMService');
const Agent = require('../models/Agent');

// Create shared agents storage
const agents = new Map();

const setupWebRTC = (server) => {
  const wss = new WebSocket.Server({ 
    server,
    path: '/webrtc'
  });

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const agentId = url.searchParams.get('agentId');
    
    console.log(`WebRTC connection established for agent: ${agentId}`);
    
    // Get agent from persistent storage
    let agent = agents.get(agentId);
    if (!agent) {
      // Try to get from agents route
      try {
        const { agents: agentsFromRoute } = require('./agents');
        agent = agentsFromRoute.get(agentId);
      } catch (e) {}
    }
    
    if (!agent) {
      // Fallback agent for testing
      agent = {
        id: agentId,
        name: 'Customer Service Rep',
        type: 'support',
        voice: 'alloy',
        language: 'en',
        description: 'A friendly customer service representative',
        welcomeMessage: 'Hi! Thanks for calling. How can I help you today?',
        prompt: 'You are a friendly customer service representative. Answer questions about services, pricing, and help customers. Be helpful and professional.',
        providers: { llm: 'openrouter', tts: 'openai' },
        model: 'openai/gpt-3.5-turbo'
      };
    }
    
    console.log('Using agent:', agent.name, 'with prompt:', agent.prompt);

    // Send welcome message
    const welcomeText = agent.welcomeMessage || 'Hello! How can I help you today?';
    
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'transcript',
        speaker: 'ai',
        text: welcomeText
      }));
      
      ws.send(JSON.stringify({
        type: 'speak',
        text: welcomeText,
        voice: agent.voice || 'alloy',
        language: agent.language || 'en',
        provider: agent.providers?.tts || 'openai'
      }));
    }, 1000);
    
    let conversationHistory = [];
    let isProcessing = false;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'audio' && !isProcessing) {
          isProcessing = true;
          console.log('Received audio data, processing...');
          await processAudioChunk(ws, data.data, agent, conversationHistory);
          isProcessing = false;
        }
        
        if (data.type === 'text') {
          if (!isProcessing) {
            isProcessing = true;
            console.log('Received text input:', data.text);
            await processTextInput(ws, data.text, agent, conversationHistory);
            isProcessing = false;
          }
        }
        
        if (data.type === 'speech_ended') {
          // AI finished speaking, ready for user input
          ws.send(JSON.stringify({
            type: 'ready'
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        isProcessing = false;
      }
    });

    ws.on('close', () => {
      console.log(`WebRTC connection closed for agent: ${agentId}`);
    });
  });

  const processAudioChunk = async (ws, audioData, agent, conversationHistory) => {
    try {
      console.log('=== PROCESSING REAL AUDIO ===');
      console.log('Audio chunk size:', audioData.length);
      console.log('Agent language:', agent.language);
      console.log('ASR provider:', agent.providers?.asr || 'deepgram');
      
      // FORCE REAL TRANSCRIPTION - NO MOCK DATA
      let transcript = null;
      try {
        const audioBuffer = Buffer.from(audioData);
        transcript = await llmService.transcribeAudio(audioBuffer, agent.providers?.asr || 'deepgram', agent.language || 'en');
        console.log('REAL TRANSCRIPT:', transcript);
      } catch (error) {
        console.error('TRANSCRIPTION FAILED:', error);
        transcript = `[TRANSCRIPTION ERROR] ${error.message}`;
      }
      
      // If no transcript, show the error clearly
      if (!transcript || transcript.trim() === '') {
        transcript = '[NO AUDIO DETECTED] Please speak louder or check microphone';
        console.log('NO TRANSCRIPT GENERATED');
      }
      
      await processTextInput(ws, transcript, agent, conversationHistory);
      
    } catch (error) {
      console.error('Audio processing error:', error);
    }
  };
  
  const processTextInput = async (ws, text, agent, conversationHistory) => {
    try {
      console.log('Processing text:', text, 'for agent:', agent.name);

      // Send user transcript
      ws.send(JSON.stringify({
        type: 'transcript',
        speaker: 'user',
        text: text
      }));

      // Add to conversation history
      conversationHistory.push({ role: 'user', content: text });

      // Create proper agent object for LLM with phone call context
      const agentForLLM = {
        name: agent.name || 'Phone Assistant',
        prompt: agent.prompt || 'You are a helpful phone assistant.',
        description: agent.description || 'A professional phone assistant',
        language: agent.language || 'en',
        type: agent.type || 'support',
        providers: agent.providers || { llm: 'openrouter' },
        model: agent.model || 'openai/gpt-3.5-turbo'
      };
      
      console.log('Using LLM provider:', agentForLLM.providers.llm, 'model:', agentForLLM.model);

      // Generate AI response using agent's prompt - FORCE REAL LLM USAGE
      let aiResponse;
      try {
        console.log('FORCING REAL LLM CALL - NO FALLBACKS');
        aiResponse = await llmService.generateResponse(text, agentForLLM, conversationHistory);
        console.log('REAL AI Response:', aiResponse);
        
        if (!aiResponse || aiResponse.trim() === '') {
          throw new Error('Empty response from LLM');
        }
      } catch (error) {
        console.error('LLM FAILED - MUST FIX:', error.message);
        
        // Only use fallback if absolutely necessary and make it obvious
        aiResponse = `[FALLBACK] I'm having technical difficulties. The error was: ${error.message}. Please try again.`;
      }
      
      // Add AI response to history
      conversationHistory.push({ role: 'assistant', content: aiResponse });
      
      // Send AI response transcript
      ws.send(JSON.stringify({
        type: 'transcript',
        speaker: 'ai',
        text: aiResponse
      }));

      // Send TTS command with voice and language settings
      ws.send(JSON.stringify({
        type: 'speak',
        text: aiResponse,
        voice: agent.voice || 'alloy',
        language: agent.language || 'en',
        provider: agent.providers?.tts || 'openai'
      }));

    } catch (error) {
      console.error('CRITICAL TEXT PROCESSING ERROR:', error);
      
      // Send error details for debugging
      const errorResponse = `[ERROR] System failure: ${error.message}. Check backend logs.`;
      
      ws.send(JSON.stringify({
        type: 'transcript',
        speaker: 'ai',
        text: errorResponse
      }));
      
      ws.send(JSON.stringify({
        type: 'speak',
        text: 'System error occurred. Please check the logs.',
        voice: agent.voice || 'alloy',
        language: agent.language || 'en',
        provider: agent.providers?.tts || 'openai'
      }));
    }
  };

  return wss;
};

module.exports = { setupWebRTC, agents };
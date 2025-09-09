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
    let agent = agents.get(agentId) || agents.get(parseInt(agentId));
    if (!agent) {
      // Fallback agent for testing
      agent = {
        id: agentId,
        name: 'Test Agent',
        type: 'conversational',
        voice: 'alloy',
        description: 'A helpful AI assistant.',
        welcomeMessage: 'Hello! How can I help you today?',
        prompt: 'You are a helpful AI assistant.'
      };
    }

    // Send welcome message
    const welcomeText = agent.welcomeMessage || 'Hello! How can I help you today?';
    
    ws.send(JSON.stringify({
      type: 'transcript',
      speaker: 'ai',
      text: welcomeText
    }));
    
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'speak',
        text: welcomeText
      }));
    }, 500);
    
    let conversationHistory = [];
    let isProcessing = false;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'audio' && !isProcessing) {
          isProcessing = true;
          await processAudioChunk(ws, data.data, agent, conversationHistory);
          isProcessing = false;
        }
        
        if (data.type === 'text') {
          // Handle direct text input for testing
          if (!isProcessing) {
            isProcessing = true;
            await processTextInput(ws, data.text, agent, conversationHistory);
            isProcessing = false;
          }
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
      console.log('Processing audio chunk');
      
      // Transcribe audio using LLM service
      const audioBuffer = Buffer.from(audioData);
      const transcript = await llmService.transcribeAudio(audioBuffer);
      
      if (!transcript || transcript.trim() === '') {
        console.log('No transcript generated');
        return;
      }
      
      await processTextInput(ws, transcript, agent, conversationHistory);
      
    } catch (error) {
      console.error('Audio processing error:', error);
    }
  };
  
  const processTextInput = async (ws, text, agent, conversationHistory) => {
    try {
      console.log('Processing text:', text);

      // Send user transcript
      ws.send(JSON.stringify({
        type: 'transcript',
        speaker: 'user',
        text: text
      }));

      // Add to conversation history
      conversationHistory.push({ role: 'user', content: text });

      // Generate AI response
      const aiResponse = await llmService.generateResponse(text, agent, conversationHistory);
      console.log('AI Response:', aiResponse);
      
      // Add AI response to history
      conversationHistory.push({ role: 'assistant', content: aiResponse });
      
      // Send AI response transcript
      ws.send(JSON.stringify({
        type: 'transcript',
        speaker: 'ai',
        text: aiResponse
      }));

      // Send TTS command
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'speak',
          text: aiResponse
        }));
      }, 300);

    } catch (error) {
      console.error('Text processing error:', error);
    }
  };

  return wss;
};

module.exports = { setupWebRTC, agents };
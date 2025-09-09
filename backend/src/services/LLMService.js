const axios = require('axios');
require('dotenv').config();

class LLMService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    this.elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    
    console.log('=== API Keys Status ===');
    console.log('OpenAI API Key loaded:', this.openaiApiKey ? 'Yes' : 'No');
    console.log('Deepgram API Key loaded:', this.deepgramApiKey ? 'Yes' : 'No');
    console.log('ElevenLabs API Key loaded:', this.elevenlabsApiKey ? 'Yes' : 'No');
    console.log('Twilio Account SID loaded:', this.twilioAccountSid ? 'Yes' : 'No');
    console.log('Twilio Auth Token loaded:', this.twilioAuthToken ? 'Yes' : 'No');
    console.log('=====================');
  }

  async transcribeAudio(audioBuffer) {
    if (!this.deepgramApiKey) {
      throw new Error('Deepgram API key required for transcription');
    }
    
    if (audioBuffer.length < 1000) {
      return null;
    }
    
    const response = await axios.post(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true',
      audioBuffer,
      {
        headers: {
          'Authorization': `Token ${this.deepgramApiKey}`,
          'Content-Type': 'audio/wav'
        },
        timeout: 10000
      }
    );
    
    const transcript = response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    return transcript?.trim() || null;
  }

  getAgentPrompt(agent) {
    let systemPrompt = `You are ${agent.name}, an AI assistant.`;
    
    if (agent.description) {
      systemPrompt += ` Description: ${agent.description}.`;
    }
    
    if (agent.prompt) {
      systemPrompt += ` ${agent.prompt}`;
    }
    
    systemPrompt += ' Speak naturally and conversationally.';
    
    return systemPrompt;
  }

  async generateResponse(transcript, agent, conversationHistory = []) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key required for response generation');
    }
    
    const messages = [
      {
        role: 'system',
        content: this.getAgentPrompt(agent)
      },
      ...conversationHistory.slice(-6),
      {
        role: 'user',
        content: transcript
      }
    ];
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    return response.data.choices[0].message.content.trim();
  }

  async generateWelcomeAudio(agent) {
    const welcomeMessage = agent.welcomeMessage || 'Hello! How can I help you today?';
    return await this.textToSpeech(welcomeMessage, agent.voice);
  }

  async textToSpeech(text, voice = 'alloy') {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key required for text-to-speech');
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        input: text.substring(0, 200),
        voice: voice,
        response_format: 'mp3'
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );
    
    return Buffer.from(response.data);
  }
}

module.exports = new LLMService();
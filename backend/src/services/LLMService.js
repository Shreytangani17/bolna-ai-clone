const axios = require('axios');
require('dotenv').config();

class LLMService {
  constructor() {
    this.apiKeys = {
      openai: process.env.OPENAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      groq: process.env.GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
      sarvam: process.env.SARVAM_API_KEY,
      deepgram: process.env.DEEPGRAM_API_KEY,
      elevenlabs: process.env.ELEVENLABS_API_KEY,
      twilio_sid: process.env.TWILIO_ACCOUNT_SID,
      twilio_token: process.env.TWILIO_AUTH_TOKEN
    };
    
    this.models = {
      openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      gemini: ['gemini-pro', 'gemini-pro-vision'],
      mistral: ['mistral-large', 'mistral-medium', 'mistral-small'],
      groq: ['llama2-70b-4096', 'mixtral-8x7b-32768'],
      meta: ['llama-2-70b', 'llama-2-13b', 'llama-2-7b']
    };
    
    console.log('=== LLM Service Initialized ===');
    Object.entries(this.apiKeys).forEach(([key, value]) => {
      console.log(`${key.toUpperCase()} API Key:`, value ? 'Loaded' : 'Missing');
    });
    console.log('==============================');
  }

  async transcribeAudio(audioBuffer, provider = 'deepgram', language = 'en') {
    if (!audioBuffer || audioBuffer.length < 1000) {
      return null;
    }
    
    try {
      if (provider === 'deepgram' && this.apiKeys.deepgram) {
        return await this.deepgramASR(audioBuffer, language);
      } else {
        console.log('No transcription service available');
        return null;
      }
    } catch (error) {
      console.error('Transcription error:', error);
      return null;
    }
  }

  async deepgramASR(audioBuffer, language) {
    if (!this.apiKeys.deepgram) {
      throw new Error('Deepgram API key required for transcription');
    }
    
    if (audioBuffer.length < 1000) {
      return null;
    }
    
    const response = await axios.post(
      `https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=${language}`,
      audioBuffer,
      {
        headers: {
          'Authorization': `Token ${this.apiKeys.deepgram}`,
          'Content-Type': 'audio/wav'
        },
        timeout: 10000
      }
    );
    
    const transcript = response.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    return transcript?.trim() || null;
  }

  async whisperASR(audioBuffer) {
    if (!this.apiKeys.openai) {
      throw new Error('OpenAI API key required for Whisper transcription');
    }
    
    const formData = new FormData();
    formData.append('file', audioBuffer, 'audio.wav');
    formData.append('model', 'whisper-1');
    
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.openai}`,
          ...formData.getHeaders()
        },
        timeout: 10000
      }
    );
    
    return response.data.text?.trim() || null;
  }

  async azureASR(audioBuffer, language) {
    // Mock Azure ASR for now
    await new Promise(resolve => setTimeout(resolve, 500));
    return 'Mock transcription from Azure';
  }

  getAgentPrompt(agent) {
    const language = agent.language || 'en';
    let systemPrompt = `You are ${agent.name || 'AI Assistant'} on a phone call.`;
    
    if (agent.description) {
      systemPrompt += ` ${agent.description}`;
    }
    
    if (agent.prompt) {
      systemPrompt += ` ${agent.prompt}`;
    }
    
    // Language-specific instructions
    const languageInstructions = {
      en: 'IMPORTANT: Always respond in English only. Keep responses under 20 words. Be helpful and conversational.',
      hi: 'IMPORTANT: हमेशा केवल हिंदी में जवाब दें। 20 शब्दों से कम में जवाब दें। मददगार और बातचीत के अंदाज में रहें।',
      'hi-IN': 'IMPORTANT: हमेशा केवल हिंदी में जवाब दें। 20 शब्दों से कम में जवाब दें।',
      'en-IN': 'IMPORTANT: Always respond in Indian English only. Keep responses under 20 words. Be helpful.',
      es: 'IMPORTANT: Responde solo en español. Mantén las respuestas bajo 20 palabras.',
      fr: 'IMPORTANT: Répondez uniquement en français. Gardez les réponses sous 20 mots.',
      de: 'IMPORTANT: Antworten Sie nur auf Deutsch. Halten Sie Antworten unter 20 Wörtern.'
    };
    
    systemPrompt += ` ${languageInstructions[language] || languageInstructions.en}`;
    
    return systemPrompt;
  }

  getAvailableModels(provider) {
    return this.models[provider] || [];
  }

  getAvailableProviders() {
    return Object.keys(this.models);
  }

  async generateOpenRouterResponse(messages, model) {
    if (!this.apiKeys.openrouter) {
      throw new Error('OpenRouter API key required');
    }
    
    console.log('Making OpenRouter request with model:', model);
    
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model || 'openai/gpt-3.5-turbo',
          messages,
          max_tokens: 80,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.openrouter}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Bolna AI Voice Agent'
          },
          timeout: 15000
        }
      );
      
      console.log('OpenRouter response received');
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API Error:', error.response?.data || error.message);
      throw new Error(`OpenRouter API failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateResponse(transcript, agent, conversationHistory = []) {
    const provider = agent.providers?.llm || 'openai';
    const model = agent.model || 'gpt-3.5-turbo';
    
    const messages = [
      {
        role: 'system',
        content: this.getAgentPrompt(agent)
      },
      ...conversationHistory.slice(-4), // Reduce context to avoid rate limits
      {
        role: 'user',
        content: transcript
      }
    ];
    
    try {
      switch (provider) {
        case 'openai':
          return await this.generateOpenAIResponse(messages, model);
        case 'gemini':
          return await this.generateGeminiResponse(messages, model);
        case 'groq':
          return await this.generateGroqResponse(messages, model);
        case 'openrouter':
          return await this.generateOpenRouterResponse(messages, model);
        default:
          return await this.generateOpenAIResponse(messages, 'gpt-3.5-turbo');
      }
    } catch (error) {
      console.error(`LLM Error (${provider}):`, error.message);
      
      // Fallback to OpenRouter if OpenAI fails with rate limit
      if (provider === 'openai' && error.message.includes('rate limit') && this.apiKeys.openrouter) {
        console.log('OpenAI rate limited, falling back to OpenRouter...');
        try {
          return await this.generateOpenRouterResponse(messages, 'openai/gpt-3.5-turbo');
        } catch (fallbackError) {
          console.error('OpenRouter fallback failed:', fallbackError.message);
        }
      }
      
      throw error;
    }
  }

  getIntelligentFallback(transcript, language) {
    const responses = {
      en: {
        greeting: "Hello! How can I help you today?",
        question: "That's a great question. Let me help you with that.",
        service: "We offer various services. What specifically interests you?",
        price: "I'd be happy to discuss pricing. What service are you asking about?",
        help: "I'm here to assist you. What do you need help with?",
        default: "I understand. Could you tell me more about what you're looking for?"
      },
      hi: {
        greeting: "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?",
        question: "यह एक अच्छा सवाल है। मैं इसमें आपकी मदद करता हूँ।",
        service: "हमारी कई सेवाएँ हैं। आप किसमें रुचि रखते हैं?",
        price: "मैं कीमत के बारे में बात करने में खुश हूँ। आप किस सेवा के बारे में पूछ रहे हैं?",
        help: "मैं आपकी सहायता के लिए यहाँ हूँ। आपको क्या चाहिए?",
        default: "मैं समझ गया। आप क्या खोज रहे हैं, इसके बारे में और बताएं?"
      }
    };
    
    const langResponses = responses[language] || responses.en;
    const text = transcript.toLowerCase();
    
    if (text.includes('hello') || text.includes('hi') || text.includes('नमस्ते')) {
      return langResponses.greeting;
    } else if (text.includes('service') || text.includes('सेवा')) {
      return langResponses.service;
    } else if (text.includes('price') || text.includes('cost') || text.includes('कीमत')) {
      return langResponses.price;
    } else if (text.includes('help') || text.includes('मदद')) {
      return langResponses.help;
    } else if (text.includes('?')) {
      return langResponses.question;
    } else {
      return langResponses.default;
    }
  }

  getDefaultModel(provider) {
    const defaults = {
      openai: 'gpt-3.5-turbo',
      anthropic: 'claude-3-sonnet',
      gemini: 'gemini-pro',
      mistral: 'mistral-medium',
      groq: 'llama2-70b-4096',
      meta: 'llama-2-70b'
    };
    return defaults[provider] || 'gpt-3.5-turbo';
  }

  async generateOpenAIResponse(messages, model) {
    if (!this.apiKeys.openai || this.apiKeys.openai.includes('example')) {
      throw new Error('Valid OpenAI API key required');
    }
    
    console.log('Making OpenAI request with model:', model);
    console.log('Messages:', JSON.stringify(messages, null, 2));
    
    try {
      const requestData = {
        model: model || 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 80,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      };
      
      console.log('OpenAI request data:', JSON.stringify(requestData, null, 2));
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.openai}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      console.log('OpenAI response:', response.data);
      
      if (!response.data.choices || !response.data.choices[0]) {
        throw new Error('No response from OpenAI');
      }
      
      const content = response.data.choices[0].message.content.trim();
      console.log('Extracted content:', content);
      
      return content;
    } catch (error) {
      console.error('OpenAI API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (error.response?.status === 429) {
        console.log('Rate limit hit, waiting and retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retry once with simpler request
        try {
          const retryResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-3.5-turbo',
              messages: messages.slice(-2), // Only last 2 messages
              max_tokens: 50,
              temperature: 0.5
            },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKeys.openai}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          return retryResponse.data.choices[0].message.content.trim();
        } catch (retryError) {
          console.error('RETRY ALSO FAILED:', retryError.message);
          throw new Error(`OpenAI rate limit exceeded. Original: ${error.response?.data?.error?.message}. Retry: ${retryError.message}`);
        }
      } else if (error.response?.status === 400) {
        throw new Error(`OpenAI request error: ${error.response.data?.error?.message || 'Bad request'}`);
      }
      
      throw new Error(`OpenAI API failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async generateAnthropicResponse(messages, model) {
    if (!this.apiKeys.anthropic || this.apiKeys.anthropic.includes('example')) {
      throw new Error('Valid Anthropic API key required. Please add your key to .env file.');
    }
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 150,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content
      },
      {
        headers: {
          'x-api-key': this.apiKeys.anthropic,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        timeout: 10000
      }
    );
    
    return response.data.content[0].text.trim();
  }

  async generateGeminiResponse(messages, model) {
    if (!this.apiKeys.gemini || this.apiKeys.gemini.includes('example')) {
      throw new Error('Valid Gemini API key required. Please add your key to .env file.');
    }
    
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKeys.gemini}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    return response.data.candidates[0].content.parts[0].text.trim();
  }

  async generateMistralResponse(messages, model) {
    if (!this.apiKeys.mistral || this.apiKeys.mistral.includes('example')) {
      throw new Error('Valid Mistral API key required. Please add your key to .env file.');
    }
    
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model,
        messages,
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.mistral}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    return response.data.choices[0].message.content.trim();
  }

  async generateGroqResponse(messages, model) {
    if (!this.apiKeys.groq || this.apiKeys.groq.includes('example')) {
      throw new Error('Valid Groq API key required. Please add your key to .env file.');
    }
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model,
        messages,
        max_tokens: 150,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.groq}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    return response.data.choices[0].message.content.trim();
  }

  async generateWelcomeAudio(agent) {
    const welcomeMessage = agent.welcomeMessage || 'Hello! How can I help you today?';
    const provider = agent.providers?.tts || 'openai';
    const language = agent.language || 'en';
    return await this.textToSpeech(welcomeMessage, agent.voice, provider, language);
  }

  async textToSpeech(text, voice = 'alloy', provider = 'openai', language = 'en') {
    switch (provider) {
      case 'sarvam':
        return await this.sarvamTTS(text, voice, language);
      case 'openai':
      default:
        return await this.openaiTTS(text, voice);
    }
  }

  async sarvamTTS(text, voice, language) {
    if (!this.apiKeys.sarvam) {
      throw new Error('Sarvam API key required');
    }

    try {
      const response = await axios.post(
        'https://api.sarvam.ai/text-to-speech',
        {
          inputs: [text.substring(0, 500)],
          target_language_code: language === 'hi' ? 'hi-IN' : 'en-IN',
          speaker: voice || 'meera',
          pitch: 0,
          pace: 1.0,
          loudness: 1.0,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: 'bulbul:v1'
        },
        {
          headers: {
            'api-subscription-key': this.apiKeys.sarvam,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data.audios && response.data.audios[0]) {
        return Buffer.from(response.data.audios[0], 'base64');
      }
      throw new Error('No audio data received from Sarvam');
    } catch (error) {
      console.error('Sarvam TTS Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async openaiTTS(text, voice) {
    if (!this.apiKeys.openai) {
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
          'Authorization': `Bearer ${this.apiKeys.openai}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );
    
    return Buffer.from(response.data);
  }

  async elevenlabsTTS(text, voiceId) {
    if (!this.apiKeys.elevenlabs) {
      throw new Error('ElevenLabs API key required for text-to-speech');
    }
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text.substring(0, 200),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'xi-api-key': this.apiKeys.elevenlabs,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );
    
    return Buffer.from(response.data);
  }

  async azureTTS(text, voice, language) {
    // Mock Azure TTS for now
    await new Promise(resolve => setTimeout(resolve, 500));
    return Buffer.from('mock-azure-audio-data');
  }
}

module.exports = new LLMService();
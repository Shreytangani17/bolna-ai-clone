const axios = require('axios');
require('dotenv').config();

class TTSService {
  constructor() {
    this.providers = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
      },
      elevenlabs: {
        apiKey: process.env.ELEVENLABS_API_KEY,
        voices: ['Rachel', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh']
      },
      azure: {
        apiKey: process.env.AZURE_SPEECH_KEY,
        region: process.env.AZURE_SPEECH_REGION,
        voices: ['en-US-JennyNeural', 'en-US-GuyNeural', 'en-US-AriaNeural']
      }
    };
  }

  async synthesizeSpeech(text, options = {}) {
    const { voice = 'alloy', provider = 'openai', language = 'en', speed = '1.0' } = options;
    
    try {
      switch (provider) {
        case 'openai':
          return await this.openaiTTS(text, voice, speed);
        case 'elevenlabs':
          return await this.elevenlabsTTS(text, voice);
        case 'azure':
          return await this.azureTTS(text, voice, language);
        default:
          throw new Error(`Unsupported TTS provider: ${provider}`);
      }
    } catch (error) {
      console.error(`TTS Error (${provider}):`, error.message);
      // Return mock response on error
      return {
        audioUrl: `https://api.example.com/audio/${Date.now()}.mp3`,
        duration: Math.ceil(text.length / 10),
        format: 'mp3',
        voice,
        provider,
        language,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async openaiTTS(text, voice, speed) {
    if (!this.providers.openai.apiKey) {
      throw new Error('OpenAI API key required');
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
          'Authorization': `Bearer ${this.providers.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );

    return {
      audioBuffer: Buffer.from(response.data),
      duration: Math.ceil(text.length / 10),
      format: 'mp3',
      voice,
      provider: 'openai'
    };
  }

  async elevenlabsTTS(text, voiceId) {
    if (!this.providers.elevenlabs.apiKey) {
      throw new Error('ElevenLabs API key required');
    }

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text.substring(0, 2500),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'xi-api-key': this.providers.elevenlabs.apiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );

    return {
      audioBuffer: Buffer.from(response.data),
      duration: Math.ceil(text.length / 8),
      format: 'mp3',
      voice: voiceId,
      provider: 'elevenlabs',
      timestamp: new Date().toISOString()
    };
  }

  async azureTTS(text, voice, language) {
    // Mock Azure TTS implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      audioBuffer: Buffer.from('mock-azure-audio'),
      duration: Math.ceil(text.length / 12),
      format: 'wav',
      voice,
      provider: 'azure',
      language,
      timestamp: new Date().toISOString()
    };
  }

  async getVoices(provider = 'openai') {
    const voices = this.providers[provider]?.voices || [];
    
    return voices.map(voice => ({
      id: voice.toLowerCase(),
      name: voice,
      language: 'en',
      gender: Math.random() > 0.5 ? 'male' : 'female',
      provider
    }));
  }

  async cloneVoice(audioSample, voiceName) {
    // Mock voice cloning
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return {
      voiceId: `custom_${Date.now()}`,
      name: voiceName,
      status: 'ready',
      similarity: 0.92,
      createdAt: new Date().toISOString()
    };
  }
}

module.exports = TTSService;
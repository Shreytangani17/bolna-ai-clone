class Agent {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type || 'conversational';
    this.prompt = data.prompt;
    this.description = data.description || '';
    this.welcomeMessage = data.welcomeMessage || 'Hello! How can I help you today?';
    this.voice = data.voice || 'alloy';
    this.language = data.language || 'en';
    this.model = data.model || 'gpt-3.5-turbo';
    this.providers = {
      telephony: data.providers?.telephony || 'twilio',
      llm: data.providers?.llm || 'openai',
      tts: data.providers?.tts || 'openai',
      asr: data.providers?.asr || 'deepgram'
    };
    this.settings = {
      maxCallDuration: data.settings?.maxCallDuration || 300,
      silenceTimeout: data.settings?.silenceTimeout || 30,
      interruptible: data.settings?.interruptible !== false,
      speechSpeed: data.settings?.speechSpeed || '1.0',
      latencyMode: data.settings?.latencyMode || 'balanced',
      voiceCloning: data.settings?.voiceCloning || false,
      backgroundNoise: data.settings?.backgroundNoise || false
    };
    this.status = data.status || 'active';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      prompt: this.prompt,
      description: this.description,
      welcomeMessage: this.welcomeMessage,
      voice: this.voice,
      language: this.language,
      model: this.model,
      providers: this.providers,
      settings: this.settings,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Agent;
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PlayIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { agentAPI, conversationAPI } from '../services/api';
import toast from 'react-hot-toast';

const AGENT_TYPES = ['conversational', 'sales', 'support', 'appointment', 'survey'];

const PROVIDERS = {
  telephony: ['twilio', 'plivo', 'vonage'],
  llm: ['openai', 'anthropic', 'gemini', 'mistral', 'groq', 'openrouter', 'meta'],
  tts: ['openai', 'elevenlabs', 'azure', 'sarvam'],
  asr: ['deepgram', 'whisper', 'azure']
};

const LLM_MODELS = {
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  gemini: ['gemini-pro', 'gemini-pro-vision'],
  mistral: ['mistral-large', 'mistral-medium', 'mistral-small'],
  groq: ['llama2-70b-4096', 'mixtral-8x7b-32768'],
  openrouter: [
    'openai/gpt-4-turbo',
    'openai/gpt-3.5-turbo',
    'google/gemini-pro',
    'x-ai/grok-beta',
    'anthropic/claude-3-sonnet'
  ],
  meta: ['llama-2-70b', 'llama-2-13b', 'llama-2-7b']
};

const VOICES = {
  openai: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  elevenlabs: ['Rachel', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh'],
  azure: ['en-US-JennyNeural', 'en-US-GuyNeural', 'en-US-AriaNeural'],
  sarvam: ['meera', 'aditi', 'arjun', 'kavya']
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'multilingual', name: 'Multilingual' },
  { code: 'hi-IN', name: 'Hindi India' },
  { code: 'en-IN', name: 'English India' }
];

function CreateAgent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [templates, setTemplates] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    type: 'conversational',
    prompt: '',
    voice: 'alloy',
    language: 'en',
    model: 'gpt-3.5-turbo',
    providers: {
      telephony: 'twilio',
      llm: 'openai',
      tts: 'openai',
      asr: 'deepgram'
    },
    settings: {
      maxCallDuration: 300,
      silenceTimeout: 30,
      interruptible: true
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
    if (isEdit) {
      fetchAgent();
    }
  }, [id, isEdit]);

  const fetchTemplates = async () => {
    try {
      const response = await agentAPI.getTemplates();
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates');
    }
  };

  const fetchAgent = async () => {
    try {
      const response = await agentAPI.get(id);
      setFormData(response.data.agent);
    } catch (error) {
      toast.error('Failed to load agent');
      navigate('/agents');
    }
  };

  const handleTemplateSelect = (templateKey) => {
    const template = templates[templateKey];
    if (template) {
      setFormData({
        ...formData,
        name: template.name,
        type: template.type,
        prompt: template.prompt
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await agentAPI.update(id, formData);
        toast.success('Agent updated successfully');
      } else {
        await agentAPI.create(formData);
        toast.success('Agent created successfully');
      }
      navigate('/agents');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update agent' : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const [testCallOpen, setTestCallOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  const handleTestCall = () => {
    toast.success(`Test call initiated to ${testPhone}`);
    setTestCallOpen(false);
    setTestPhone('');
  };

  const handleVoicePreview = async () => {
    const text = formData.welcomeMessage || (formData.language === 'hi' ? 'नमस्ते, यह आवाज़ का परीक्षण है।' : 'Hello, this is a voice preview test.');
    const provider = formData.providers?.tts || 'openai';
    
    try {
      if (provider === 'sarvam') {
        toast.loading('Generating Sarvam AI voice...');
        
        const response = await conversationAPI.voicePreview({
          text: text,
          voice: formData.voice,
          provider: provider,
          language: formData.language
        });
        
        const audioUrl = URL.createObjectURL(response.data);
        const audio = new Audio(audioUrl);
        
        audio.onloadeddata = () => {
          toast.dismiss();
          toast.success(`Playing ${formData.voice} voice (Sarvam AI)`);
          audio.play();
        };
        
        audio.onerror = () => {
          toast.dismiss();
          toast.error('Sarvam AI voice preview failed');
        };
        
      } else {
        // Use browser speech synthesis for other providers
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        if (formData.language === 'hi') {
          utterance.lang = 'hi-IN';
        }
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(formData.language === 'hi' ? 'hi' : 'en')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onstart = () => {
          toast.success(`Playing voice preview`);
        };
        
        utterance.onerror = () => {
          toast.error('Voice preview failed');
        };
        
        window.speechSynthesis.speak(utterance);
      }
      
    } catch (error) {
      toast.dismiss();
      toast.error('Voice preview failed: ' + error.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/agents')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Edit Agent' : 'Create New Agent'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEdit ? 'Update your agent configuration' : 'Configure your AI voice agent with advanced settings'}
            </p>
          </div>
        </div>
        {isEdit && (
          <Dialog open={testCallOpen} onOpenChange={setTestCallOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <PlayIcon className="h-4 w-4" />
                Test Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Test Your Agent</DialogTitle>
                <DialogDescription>
                  Enter a phone number to test your agent's performance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setTestCallOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleTestCall} disabled={!testPhone}>
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    Start Test Call
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="llm">LLM</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="general" className="space-y-6">
            {/* Templates (only for new agents) */}
            {!isEdit && Object.keys(templates).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Templates</CardTitle>
                  <CardDescription>Choose a template to get started quickly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(templates).map(([key, template]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleTemplateSelect(key)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors"
                      >
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1 capitalize">{template.type}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Configure your agent's basic settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name *</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="My Sales Assistant"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <Input
                      value={formData.phoneNumber || ''}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({...formData, language: e.target.value})}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      {AGENT_TYPES.map(type => (
                        <option key={type} value={type} className="capitalize">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    placeholder="Describe the agent's role, personality, and tone..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                  <Input
                    value={formData.welcomeMessage || ''}
                    onChange={(e) => setFormData({...formData, welcomeMessage: e.target.value})}
                    placeholder="Hello! How can I help you today?"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="llm" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Language Model Configuration</CardTitle>
                <CardDescription>Configure the AI model and conversation settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Provider</label>
                    <select
                      value={formData.providers?.llm || 'openai'}
                      onChange={(e) => {
                        const provider = e.target.value;
                        const defaultModel = LLM_MODELS[provider]?.[0] || 'gpt-3.5-turbo';
                        setFormData({
                          ...formData,
                          providers: { ...formData.providers, llm: provider },
                          model: defaultModel
                        });
                      }}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="openai">OpenAI GPT</option>
                      <option value="anthropic">Anthropic Claude</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="mistral">Mistral AI</option>
                      <option value="groq">Groq</option>
                      <option value="openrouter">OpenRouter (Multi-Model)</option>
                      <option value="meta">Meta Llama</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <select
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      {(LLM_MODELS[formData.providers?.llm] || LLM_MODELS.openai).map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData({...formData, prompt: e.target.value})}
                    rows={8}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    placeholder="You are a helpful AI assistant. Your role is to..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Knowledge Base</label>
                  <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select knowledge base (optional)</option>
                    <option value="kb1">Product Documentation</option>
                    <option value="kb2">Customer Support Scripts</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Voice & Speech Configuration</CardTitle>
                <CardDescription>Configure text-to-speech and speech recognition settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TTS Provider</label>
                    <select
                      value={formData.providers?.tts || 'openai'}
                      onChange={(e) => {
                        const provider = e.target.value;
                        const defaultVoice = VOICES[provider]?.[0] || 'alloy';
                        setFormData({
                          ...formData,
                          providers: { ...formData.providers, tts: provider },
                          voice: defaultVoice
                        });
                      }}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="openai">OpenAI TTS</option>
                      <option value="elevenlabs">ElevenLabs</option>
                      <option value="azure">Azure Speech</option>
                      <option value="sarvam">Sarvam AI (Indian)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
                    <select
                      value={formData.voice}
                      onChange={(e) => setFormData({...formData, voice: e.target.value})}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      {(VOICES[formData.providers?.tts] || VOICES.openai).map(voice => (
                        <option key={voice} value={voice} className="capitalize">
                          {voice}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ASR Provider</label>
                    <select
                      value={formData.providers?.asr || 'deepgram'}
                      onChange={(e) => setFormData({
                        ...formData,
                        providers: { ...formData.providers, asr: e.target.value }
                      })}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="deepgram">Deepgram</option>
                      <option value="whisper">OpenAI Whisper</option>
                      <option value="azure">Azure Speech</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latency Mode</label>
                    <select 
                      value={formData.settings?.latencyMode || 'balanced'}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, latencyMode: e.target.value }
                      })}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="low">Low Latency</option>
                      <option value="balanced">Balanced</option>
                      <option value="quality">High Quality</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voice Test</label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={handleVoicePreview}
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Preview Voice
                    </Button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
                    <select 
                      value={formData.settings?.speechSpeed || '1.0'}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, speechSpeed: e.target.value }
                      })}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="0.75">0.75x (Slow)</option>
                      <option value="1.0">1.0x (Normal)</option>
                      <option value="1.25">1.25x (Fast)</option>
                      <option value="1.5">1.5x (Very Fast)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.settings?.voiceCloning || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, voiceCloning: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable voice cloning</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.settings?.interruptible !== false}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, interruptible: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow interruptions</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.settings?.backgroundNoise || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings, backgroundNoise: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="ml-2 text-sm text-gray-700">Add background noise reduction</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Workflows</CardTitle>
                <CardDescription>Configure conversation flows and call handling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Call Duration (minutes)</label>
                    <Input
                      type="number"
                      value={Math.floor((formData.settings?.maxCallDuration || 300) / 60)}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          maxCallDuration: parseInt(e.target.value) * 60
                        }
                      })}
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Silence Timeout (seconds)</label>
                    <Input
                      type="number"
                      value={formData.settings?.silenceTimeout || 30}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: {
                          ...formData.settings,
                          silenceTimeout: parseInt(e.target.value)
                        }
                      })}
                      min="5"
                      max="120"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call Transfer Number</label>
                  <Input placeholder="+1234567890 (optional)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                  <Input placeholder="https://your-webhook-url.com (optional)" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Telephony & External Integrations</CardTitle>
                <CardDescription>Connect telephony providers and external services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telephony Provider</label>
                  <select
                    value={formData.providers?.telephony || 'twilio'}
                    onChange={(e) => setFormData({
                      ...formData,
                      providers: { ...formData.providers, telephony: e.target.value }
                    })}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="plivo">Plivo</option>
                    <option value="vonage">Vonage</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">External Integrations</h4>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Zapier webhook</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Make.com integration</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">CRM sync</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Your Agent</CardTitle>
                <CardDescription>Test your agent configuration before deployment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Call Simulator</h4>
                  <p className="text-sm text-gray-600 mb-4">Test your agent's responses in real-time</p>
                  <div className="space-y-3">
                    <Input placeholder="Enter test phone number" />
                    <Button className="w-full">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      Start Test Call
                    </Button>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Real-time Transcription</h4>
                  <div className="bg-white rounded border p-3 min-h-[100px] text-sm text-gray-600">
                    Transcription will appear here during test calls...
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Agent' : 'Create Agent')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/agents')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}

export default CreateAgent;
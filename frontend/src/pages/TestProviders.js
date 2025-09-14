import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { testAPI } from '../services/api';
import toast from 'react-hot-toast';

function TestProviders() {
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});

  const [llmTest, setLlmTest] = useState({
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    message: 'Hello, how are you?',
    language: 'en'
  });

  const [ttsTest, setTtsTest] = useState({
    provider: 'openai',
    voice: 'alloy',
    text: 'Hello, this is a test of the text to speech system.',
    language: 'en',
    speed: '1.0'
  });

  const [asrTest, setAsrTest] = useState({
    provider: 'deepgram',
    language: 'en'
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await testAPI.getProviders();
      setProviders(response.data.providers);
    } catch (error) {
      toast.error('Failed to load providers');
    }
  };

  const testLLM = async () => {
    setLoading(true);
    try {
      const response = await testAPI.testLLM(llmTest);
      setResults(prev => ({ ...prev, llm: response.data }));
      toast.success('LLM test completed');
    } catch (error) {
      toast.error(`LLM test failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testTTS = async () => {
    setLoading(true);
    try {
      const response = await testAPI.testTTS(ttsTest);
      setResults(prev => ({ ...prev, tts: response.data }));
      toast.success('TTS test completed');
    } catch (error) {
      toast.error(`TTS test failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testASR = async () => {
    setLoading(true);
    try {
      const response = await testAPI.testASR(asrTest);
      setResults(prev => ({ ...prev, asr: response.data }));
      toast.success('ASR test completed');
    } catch (error) {
      toast.error(`ASR test failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test Providers</h1>
        <p className="text-gray-600 mt-1">Test LLM, TTS, and ASR providers functionality</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LLM Test */}
        <Card>
          <CardHeader>
            <CardTitle>LLM Test</CardTitle>
            <CardDescription>Test language model providers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={llmTest.provider}
                onChange={(e) => {
                  const provider = e.target.value;
                  const defaultModel = providers.models?.[provider]?.[0] || 'gpt-3.5-turbo';
                  setLlmTest({ ...llmTest, provider, model: defaultModel });
                }}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {providers.llm?.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={llmTest.model}
                onChange={(e) => setLlmTest({ ...llmTest, model: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {providers.models?.[llmTest.provider]?.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <Input
                value={llmTest.message}
                onChange={(e) => setLlmTest({ ...llmTest, message: e.target.value })}
                placeholder="Test message"
              />
            </div>
            <Button onClick={testLLM} disabled={loading} className="w-full">
              Test LLM
            </Button>
            {results.llm && (
              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>Response:</strong> {results.llm.response}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TTS Test */}
        <Card>
          <CardHeader>
            <CardTitle>TTS Test</CardTitle>
            <CardDescription>Test text-to-speech providers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={ttsTest.provider}
                onChange={(e) => setTtsTest({ ...ttsTest, provider: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {providers.tts?.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
              <Input
                value={ttsTest.voice}
                onChange={(e) => setTtsTest({ ...ttsTest, voice: e.target.value })}
                placeholder="Voice ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
              <textarea
                value={ttsTest.text}
                onChange={(e) => setTtsTest({ ...ttsTest, text: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                rows={3}
                placeholder="Text to synthesize"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
              <select
                value={ttsTest.speed}
                onChange={(e) => setTtsTest({ ...ttsTest, speed: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="0.75">0.75x</option>
                <option value="1.0">1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
              </select>
            </div>
            <Button onClick={testTTS} disabled={loading} className="w-full">
              Test TTS
            </Button>
            {results.tts && (
              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>Duration:</strong> {results.tts.result.duration}s<br/>
                <strong>Format:</strong> {results.tts.result.format}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ASR Test */}
        <Card>
          <CardHeader>
            <CardTitle>ASR Test</CardTitle>
            <CardDescription>Test speech recognition providers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={asrTest.provider}
                onChange={(e) => setAsrTest({ ...asrTest, provider: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {providers.asr?.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={asrTest.language}
                onChange={(e) => setAsrTest({ ...asrTest, language: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <Button onClick={testASR} disabled={loading} className="w-full">
              Test ASR
            </Button>
            {results.asr && (
              <div className="bg-gray-50 p-3 rounded text-sm">
                <strong>Transcript:</strong> {results.asr.transcript}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Summary of all test results</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TestProviders;
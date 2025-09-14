import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { conversationAPI } from '../services/api';
import toast from 'react-hot-toast';

function LLMTest() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [language, setLanguage] = useState('en');

  const testLLM = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const result = await conversationAPI.chat({
        agentId: 'test',
        message: message,
        language: language,
        model: model
      });
      
      setResponse(result.data.response);
      toast.success('LLM working!');
    } catch (error) {
      setResponse(`Error: ${error.response?.data?.error || error.message}`);
      toast.error('LLM failed');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const result = await fetch('http://localhost:5001/api/conversation/test');
      const data = await result.json();
      
      if (data.success) {
        toast.success('OpenAI API working!');
        setResponse(`Test Response: ${data.testResponse}`);
      } else {
        toast.error(`API Error: ${data.error}`);
        setResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      toast.error('Connection failed');
      setResponse(`Connection Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">LLM Test</h1>
        <p className="text-gray-600 mt-1">Test OpenAI GPT models</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Message</label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your test message..."
                onKeyPress={(e) => e.key === 'Enter' && testLLM()}
              />
            </div>
            
            <div className="space-y-2">
              <Button onClick={testLLM} disabled={loading || !message.trim()} className="w-full">
                {loading ? 'Testing...' : 'Test LLM'}
              </Button>
              <Button onClick={testConnection} variant="outline" className="w-full">
                Test API Connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
              {response ? (
                <div className="whitespace-pre-wrap text-sm">
                  <strong>Model:</strong> {model}<br/>
                  <strong>Language:</strong> {language}<br/>
                  <strong>Response:</strong><br/>
                  {response}
                </div>
              ) : (
                <p className="text-gray-500">No response yet. Test the LLM above.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LLMTest;
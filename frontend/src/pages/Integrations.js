import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { CheckCircleIcon, XCircleIcon, CogIcon } from '@heroicons/react/24/outline';
import { integrationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [config, setConfig] = useState({});

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await integrationsAPI.list();
      const integrationsWithMeta = (response.data.integrations || []).map(int => ({
        ...int,
        description: getIntegrationDescription(int.id),
        logo: getIntegrationLogo(int.id)
      }));
      setIntegrations(integrationsWithMeta);
    } catch (error) {
      toast.error('Failed to fetch integrations');
    }
  };

  const getIntegrationDescription = (id) => {
    const descriptions = {
      openai: 'GPT models for natural language processing',
      twilio: 'Voice calls and SMS messaging',
      elevenlabs: 'High-quality text-to-speech synthesis',
      deepgram: 'Real-time speech recognition',
      anthropic: 'Claude AI models for conversations',
      plivo: 'Cloud communications platform',
      azure: 'Microsoft speech services'
    };
    return descriptions[id] || 'Integration service';
  };

  const getIntegrationLogo = (id) => {
    const logos = {
      openai: '🤖',
      twilio: '📞',
      elevenlabs: '🎤',
      deepgram: '🎧',
      anthropic: '🧠',
      plivo: '☁️',
      azure: '🔵'
    };
    return logos[id] || '⚙️';
  };



  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const categories = ['All', 'LLM', 'Telephony', 'TTS', 'ASR', 'TTS/ASR', 'Automation'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredIntegrations = selectedCategory === 'All' 
    ? integrations 
    : integrations.filter(int => int.category === selectedCategory);

  const handleConnect = (integration) => {
    setSelectedIntegration(integration);
    setIsConfigOpen(true);
  };

  const handleSaveConfig = async () => {
    try {
      await integrationsAPI.configure(selectedIntegration.id, config);
      toast.success('Integration configured successfully');
      setIsConfigOpen(false);
      setSelectedIntegration(null);
      setConfig({});
      fetchIntegrations();
    } catch (error) {
      toast.error('Failed to configure integration');
    }
  };

  const handleDisconnect = async (id) => {
    try {
      await integrationsAPI.disconnect(id);
      toast.success('Integration disconnected');
      fetchIntegrations();
    } catch (error) {
      toast.error('Failed to disconnect integration');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">Connect your favorite tools and services to enhance your voice agents</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{integration.logo}</div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {integration.category}
                      </span>
                      {integration.status === 'connected' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{integration.description}</CardDescription>
              <div className="flex gap-2">
                {integration.status === 'connected' ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleConnect(integration)}>
                      <CogIcon className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => handleConnect(integration)} className="w-full">
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Enter your API credentials to connect {selectedIntegration?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedIntegration && (
            <div className="space-y-4">
              {selectedIntegration.id === 'openai' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <Input placeholder="sk-..." />
                </div>
              )}
              {selectedIntegration.id === 'twilio' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
                    <Input placeholder="AC..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                    <Input type="password" placeholder="Your auth token" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <Input placeholder="+1234567890" />
                  </div>
                </>
              )}
              {selectedIntegration.id === 'elevenlabs' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <Input placeholder="el_..." />
                </div>
              )}
              {selectedIntegration.id === 'deepgram' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <Input placeholder="dg_..." />
                </div>
              )}
              {selectedIntegration.id === 'anthropic' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <Input placeholder="sk-ant-..." />
                </div>
              )}
              {selectedIntegration.id === 'plivo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auth ID</label>
                    <Input placeholder="Your auth ID" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                    <Input type="password" placeholder="Your auth token" />
                  </div>
                </>
              )}
              {selectedIntegration.id === 'azure' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Speech Key</label>
                    <Input placeholder="Your speech key" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <Input placeholder="eastus" />
                  </div>
                </>
              )}
              {selectedIntegration.id === 'zapier' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                  <Input placeholder="https://hooks.zapier.com/..." />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveConfig}>
                  Save Configuration
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Integration Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {integrations.filter(i => i.status === 'connected').length}
            </div>
            <p className="text-sm text-gray-600">Connected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {integrations.filter(i => i.category === 'LLM').length}
            </div>
            <p className="text-sm text-gray-600">LLM Providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {integrations.filter(i => i.category === 'Telephony').length}
            </div>
            <p className="text-sm text-gray-600">Telephony</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">
              {integrations.filter(i => i.category.includes('TTS')).length}
            </div>
            <p className="text-sm text-gray-600">Voice Services</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Integrations;
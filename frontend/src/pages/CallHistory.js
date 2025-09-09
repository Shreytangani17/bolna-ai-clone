import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PhoneIcon, ClockIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { callHistoryAPI } from '../services/api';
import toast from 'react-hot-toast';

const CallHistory = () => {
  const [callHistories, setCallHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);

  useEffect(() => {
    fetchCallHistories();
  }, []);

  const fetchCallHistories = async () => {
    try {
      const response = await callHistoryAPI.list();
      setCallHistories(response.data.callHistories || []);
    } catch (error) {
      toast.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistories = callHistories.filter(call =>
    call.agentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
        <p className="text-gray-600 mt-2">Review your web call sessions and transcripts</p>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by agent name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Call History Grid */}
      {filteredHistories.length === 0 ? (
        <div className="text-center py-12">
          <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No call history</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start a web call to see your conversation history here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistories.map((call) => (
            <Card key={call.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedCall(call)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{call.agentName}</CardTitle>
                    <CardDescription>
                      {new Date(call.startTime).toLocaleDateString()} at{' '}
                      {new Date(call.startTime).toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {call.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      Duration:
                    </span>
                    <span>{formatDuration(call.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      Messages:
                    </span>
                    <span>{call.transcript.length}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View Transcript
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Transcript Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Call Transcript - {selectedCall.agentName}</h2>
              <Button variant="ghost" onClick={() => setSelectedCall(null)}>×</Button>
            </div>
            
            <div className="mb-4 text-sm text-gray-600">
              <p>Date: {new Date(selectedCall.startTime).toLocaleString()}</p>
              <p>Duration: {formatDuration(selectedCall.duration)}</p>
            </div>

            <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
              {selectedCall.transcript.map((entry, index) => (
                <div key={index} className={`p-2 rounded mb-2 ${
                  entry.type === 'user' ? 'bg-blue-100 ml-8' : 'bg-white mr-8'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">
                      {entry.type === 'user' ? 'You' : selectedCall.agentName}
                    </span>
                    <span className="text-xs text-gray-500">{entry.timestamp}</span>
                  </div>
                  <p className="mt-1">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
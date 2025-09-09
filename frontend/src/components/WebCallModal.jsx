import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PhoneIcon, MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';
import { callHistoryAPI } from '../services/api';
import toast from 'react-hot-toast';

const WebCallModal = ({ isOpen, onClose, agent }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [welcomePlaying, setWelcomePlaying] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen && agent) {
      initializeWebSocket();
    }
    return () => {
      cleanup();
    };
  }, [isOpen, agent]);

  const initializeWebSocket = () => {
    const wsUrl = `ws://localhost:5001/webrtc?agentId=${agent.id}`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'transcript') {
        setTranscript(prev => [...prev, {
          type: data.speaker,
          text: data.text,
          timestamp: new Date().toLocaleTimeString()
        }]);
        
        // If it's AI speaking, stop recording to prevent echo
        if (data.speaker === 'ai' && isRecording) {
          try {
            mediaRecorderRef.current.stop();
          } catch (e) {
            console.log('MediaRecorder already stopped');
          }
          setIsRecording(false);
        }
      }
      
      if (data.type === 'audio') {
        // Stop recording during AI speech to prevent echo
        if (isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
        
        playAudioResponse(data.audio, () => {
          // Audio finished, user can speak again
          setWelcomePlaying(false);
        });
      }
      
      if (data.type === 'speak') {
        // Use browser TTS for AI responses
        speakText(data.text);
      }
    };
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      streamRef.current = stream;
      
      // Try different MIME types for better browser compatibility
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/wav';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Use default
          }
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, 
        mimeType ? { mimeType } : undefined
      );
      
      let audioChunks = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', audioChunks.length);
        setIsRecording(false);
        
        if (audioChunks.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const audioBlob = new Blob(audioChunks);
          const reader = new FileReader();
          reader.onload = () => {
            const audioData = Array.from(new Uint8Array(reader.result));
            console.log('Sending audio data, size:', audioData.length);
            wsRef.current.send(JSON.stringify({
              type: 'audio',
              data: audioData
            }));
          };
          reader.readAsArrayBuffer(audioBlob);
        }
        audioChunks = [];
      };
      
      setIsCallActive(true);
      setTranscript([]);
      setCallStartTime(new Date());
      console.log('Call started successfully');
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to access microphone: ' + error.message);
    }
  };

  const stopCall = async () => {
    const callEndTime = new Date();
    const duration = callStartTime ? Math.floor((callEndTime - callStartTime) / 1000) : 0;
    
    // Save call history
    if (transcript.length > 0 && agent) {
      try {
        await callHistoryAPI.save({
          agentId: agent.id,
          agentName: agent.name,
          transcript: transcript,
          duration: duration,
          startTime: callStartTime?.toISOString()
        });
        toast.success('Call saved to history');
      } catch (error) {
        console.error('Failed to save call history:', error);
      }
    }
    
    cleanup();
    setIsCallActive(false);
    setIsRecording(false);
    setCallStartTime(null);
  };

  const toggleRecording = () => {
    if (!mediaRecorderRef.current || welcomePlaying) return;
    
    if (isRecording) {
      console.log('Stopping recording');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      console.log('Starting recording');
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 5000);
    }
  };

  const playAudioResponse = async (audioData, onEnded) => {
    try {
      console.log('Playing TTS audio, data type:', typeof audioData);
      
      if (!audioData) {
        console.log('No audio data, playing beep');
        playBeep(onEnded);
        return;
      }
      
      let audioBuffer;
      if (typeof audioData === 'string') {
        const binaryString = atob(audioData);
        audioBuffer = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          audioBuffer[i] = binaryString.charCodeAt(i);
        }
      } else {
        audioBuffer = new Uint8Array(audioData);
      }
      
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio();
      
      audio.oncanplaythrough = () => {
        console.log('Audio ready to play');
        audio.play().catch(e => {
          console.error('Play failed:', e);
          playBeep(onEnded);
        });
      };
      
      audio.onended = () => {
        console.log('Audio ended');
        URL.revokeObjectURL(audioUrl);
        if (onEnded) onEnded();
      };
      
      audio.onerror = (e) => {
        console.error('Audio error:', e);
        URL.revokeObjectURL(audioUrl);
        playBeep(onEnded);
      };
      
      audio.src = audioUrl;
      audio.load();
      
    } catch (error) {
      console.error('Audio playback failed:', error);
      playBeep(onEnded);
    }
  };
  
  const speakText = (text) => {
    try {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.startsWith('en')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onstart = () => {
        console.log('Speech started');
        setWelcomePlaying(true);
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        setWelcomePlaying(false);
      };
      
      utterance.onerror = (error) => {
        console.error('Speech error:', error);
        setWelcomePlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS failed:', error);
      setWelcomePlaying(false);
    }
  };

  const sendTextMessage = (text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text: text
      }));
    }
  };

  const cleanup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  };

  useEffect(() => {
    let interval;
    if (isCallActive && callStartTime) {
      interval = setInterval(() => {
        // Force re-render to update duration
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, callStartTime]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Web Call with {agent?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Call Controls */}
          <div className="flex flex-col items-center space-y-4">
            {!isCallActive ? (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="testMode" 
                    checked={testMode} 
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="testMode" className="text-sm">Text Mode (for testing)</label>
                </div>
                <Button onClick={startCall} className="flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5" />
                  Start Call
                </Button>
              </>
            ) : (
              <>
                {testMode ? (
                  <div className="flex space-x-2 w-full max-w-md">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && textInput.trim()) {
                          sendTextMessage(textInput.trim());
                          setTextInput('');
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border rounded-md"
                      disabled={welcomePlaying}
                    />
                    <Button 
                      onClick={() => {
                        if (textInput.trim()) {
                          sendTextMessage(textInput.trim());
                          setTextInput('');
                        }
                      }}
                      disabled={!textInput.trim() || welcomePlaying}
                    >
                      Send
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className="flex items-center gap-2"
                    disabled={welcomePlaying}
                  >
                    {isRecording ? (
                      <StopIcon className="h-5 w-5" />
                    ) : (
                      <MicrophoneIcon className="h-5 w-5" />
                    )}
                    {welcomePlaying ? 'AI Speaking...' : (isRecording ? 'Listening...' : 'Click to Speak')}
                  </Button>
                )}
                <Button onClick={stopCall} variant="outline">
                  End Call
                </Button>
              </>
            )}
          </div>

          {/* Transcript */}
          <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
            <h3 className="font-medium mb-3">Live Transcript</h3>
            {transcript.length === 0 ? (
              <p className="text-gray-500 text-center">
                {isCallActive ? 
                  (welcomePlaying ? 'Playing welcome message...' : 
                   testMode ? 'Type a message to start the conversation...' : 
                   'Click the microphone button to start speaking...') : 
                  'Start a call to begin'}
              </p>
            ) : (
              <div className="space-y-2">
                {transcript.map((entry, index) => (
                  <div key={index} className={`p-2 rounded ${
                    entry.type === 'user' ? 'bg-blue-100 ml-8' : 'bg-white mr-8'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">
                        {entry.type === 'user' ? 'You' : agent?.name}
                      </span>
                      <span className="text-xs text-gray-500">{entry.timestamp}</span>
                    </div>
                    <p className="mt-1">{entry.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          {isCallActive && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                <span>{isRecording ? 'Recording...' : 'Ready to record'}</span>
              </div>
              {callStartTime && (
                <span>Duration: {Math.floor((new Date() - callStartTime) / 1000)}s</span>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebCallModal;
/**
 * Simple WebSocket Test Component
 * 
 * Basic WebSocket connection testing without complex features
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const WebSocketTest: React.FC = () => {
  const { getToken, isSignedIn } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('Hello WebSocket!');
  const [broadcastMessage, setBroadcastMessage] = useState('Broadcast to all clients!');
  const [channelMessage, setChannelMessage] = useState('Hello channel!');
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [receivedMessages, setReceivedMessages] = useState<Array<{type: string, data: any, timestamp: number}>>([]);

  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'wss://ws-dev.hac.heetvakharia.in';

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const connect = async () => {
    if (!isSignedIn) {
      setError('User not authenticated');
      return;
    }

    try {
      setConnectionStatus('connecting');
      setError(null);
      addMessage('Attempting to connect...');

      // Get JWT token from Clerk
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      addMessage('Got authentication token');

      // Construct WebSocket URL with token
      const url = new URL(wsUrl);
      url.searchParams.set('token', token);

      addMessage(`Connecting to: ${wsUrl}`);

      // Create WebSocket connection
      const websocket = new WebSocket(url.toString());
      
      websocket.onopen = () => {
        setConnectionStatus('connected');
        setWs(websocket);
        addMessage('✅ Connected successfully!');
      };

      websocket.onclose = (event) => {
        setConnectionStatus('disconnected');
        setWs(null);
        addMessage(`❌ Connection closed: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
        if (!event.wasClean) {
          setError(`Connection closed unexpectedly: ${event.code}`);
        }
      };

      websocket.onerror = (event) => {
        setConnectionStatus('error');
        setError('WebSocket connection error');
        addMessage('❌ WebSocket error occurred');
        console.error('WebSocket error:', event);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage(`📨 Received: ${JSON.stringify(data, null, 2)}`);
          
          // Add to received messages for better display
          setReceivedMessages(prev => [{
            type: data.type || 'unknown',
            data: data.data || data,
            timestamp: data.timestamp || Date.now()
          }, ...prev].slice(0, 50)); // Keep last 50 messages
          
        } catch (e) {
          addMessage(`📨 Received (raw): ${event.data}`);
          setReceivedMessages(prev => [{
            type: 'raw',
            data: event.data,
            timestamp: Date.now()
          }, ...prev].slice(0, 50));
        }
      };

    } catch (error) {
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'Connection failed');
      addMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const disconnect = () => {
    if (ws) {
      ws.close(1000, 'User disconnect');
      setWs(null);
      setConnectionStatus('disconnected');
      addMessage('🔌 Disconnected by user');
    }
  };

  const sendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'test-message',
        data: testMessage,
        timestamp: Date.now(),
      };
      
      ws.send(JSON.stringify(message));
      addMessage(`📤 Sent: ${JSON.stringify(message)}`);
    } else {
      addMessage('❌ Cannot send message - not connected');
    }
  };

  const sendBroadcast = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'broadcast',
        data: { content: broadcastMessage },
        timestamp: Date.now(),
      };
      
      ws.send(JSON.stringify(message));
      addMessage(`📢 Broadcast sent: ${broadcastMessage}`);
      setBroadcastMessage('');
    } else {
      addMessage('❌ Cannot send broadcast - not connected');
    }
  };

  const sendQuickBroadcast = (content: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'broadcast',
        data: { content },
        timestamp: Date.now(),
      };
      
      ws.send(JSON.stringify(message));
      addMessage(`📢 Quick broadcast: ${content}`);
    } else {
      addMessage('❌ Cannot send broadcast - not connected');
    }
  };

  const joinChannel = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'join-channel',
        data: { channel: selectedChannel },
        timestamp: Date.now(),
      };
      
      ws.send(JSON.stringify(message));
      addMessage(`🚪 Joined channel: ${selectedChannel}`);
    } else {
      addMessage('❌ Cannot join channel - not connected');
    }
  };

  const sendChannelMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'chat-message',
        data: { 
          channel: selectedChannel,
          content: channelMessage 
        },
        timestamp: Date.now(),
      };
      
      ws.send(JSON.stringify(message));
      addMessage(`💬 Sent to #${selectedChannel}: ${channelMessage}`);
      setChannelMessage('');
    } else {
      addMessage('❌ Cannot send channel message - not connected');
    }
  };

  const sendPing = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'ping',
        data: 'ping',
        timestamp: Date.now(),
      };
      
      ws.send(JSON.stringify(message));
      addMessage(`🏓 Ping sent`);
    } else {
      addMessage('❌ Cannot send ping - not connected');
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const clearReceivedMessages = () => {
    setReceivedMessages([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">WebSocket Test</h1>
        <p className="text-muted-foreground mt-2">
          Simple WebSocket connection testing
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()}`} />
            <span className="font-medium">{getStatusText()}</span>
            <span className="text-sm text-muted-foreground">
              URL: {wsUrl}
            </span>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={connect} 
              disabled={connectionStatus === 'connecting' || connectionStatus === 'connected' || !isSignedIn}
            >
              Connect
            </Button>
            <Button 
              onClick={disconnect} 
              variant="outline"
              disabled={connectionStatus !== 'connected'}
            >
              Disconnect
            </Button>
          </div>

          {!isSignedIn && (
            <p className="text-yellow-600 text-sm mt-2">
              ⚠️ You need to be signed in to test WebSocket connection
            </p>
          )}
        </CardContent>
      </Card>

      {/* Message Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Basic Test Message */}
            <div>
              <label className="block text-sm font-medium mb-2">Basic Test Message</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter test message"
                  className="flex-1 px-3 py-2 border rounded-md"
                  disabled={connectionStatus !== 'connected'}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={connectionStatus !== 'connected' || !testMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </div>

            {/* Broadcast Test */}
            <div>
              <label className="block text-sm font-medium mb-2">Broadcast to All Clients</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Enter broadcast message"
                  className="flex-1 px-3 py-2 border rounded-md"
                  disabled={connectionStatus !== 'connected'}
                />
                <Button 
                  onClick={sendBroadcast}
                  disabled={connectionStatus !== 'connected' || !broadcastMessage.trim()}
                  variant="secondary"
                >
                  Broadcast
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This will send a message to all connected clients
              </p>
            </div>

            {/* Channel Test */}
            <div>
              <label className="block text-sm font-medium mb-2">Channel Messages</label>
              <div className="flex space-x-2 mb-2">
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                  disabled={connectionStatus !== 'connected'}
                >
                  <option value="general">general</option>
                  <option value="random">random</option>
                  <option value="dev">dev</option>
                  <option value="test">test</option>
                </select>
                <Button 
                  onClick={joinChannel}
                  disabled={connectionStatus !== 'connected'}
                  variant="outline"
                  size="sm"
                >
                  Join Channel
                </Button>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={channelMessage}
                  onChange={(e) => setChannelMessage(e.target.value)}
                  placeholder="Enter channel message"
                  className="flex-1 px-3 py-2 border rounded-md"
                  disabled={connectionStatus !== 'connected'}
                />
                <Button 
                  onClick={sendChannelMessage}
                  disabled={connectionStatus !== 'connected' || !channelMessage.trim()}
                  variant="outline"
                >
                  Send to Channel
                </Button>
              </div>
            </div>

            {/* Quick Test Buttons */}
            <div>
              <label className="block text-sm font-medium mb-2">Quick Tests</label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={sendPing}
                  disabled={connectionStatus !== 'connected'}
                  variant="outline"
                  size="sm"
                >
                  Send Ping
                </Button>
                <Button 
                  onClick={() => sendQuickBroadcast('Hello from WebSocket Test!')}
                  disabled={connectionStatus !== 'connected'}
                  variant="outline"
                  size="sm"
                >
                  Quick Broadcast
                </Button>
                <Button 
                  onClick={() => sendQuickBroadcast('🎉 WebSocket is working!')}
                  disabled={connectionStatus !== 'connected'}
                  variant="outline"
                  size="sm"
                >
                  Celebration Message
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Message Log</span>
              <Button 
                onClick={clearMessages} 
                variant="outline" 
                size="sm"
                disabled={messages.length === 0}
              >
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-center">
                  No messages yet. Connect to start logging.
                </p>
              ) : (
                <div className="space-y-1">
                  {messages.map((message, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      {message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Received Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Received Messages</span>
              <Button 
                onClick={clearReceivedMessages} 
                variant="outline" 
                size="sm"
                disabled={receivedMessages.length === 0}
              >
                Clear
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 rounded-lg p-4 h-64 overflow-y-auto">
              {receivedMessages.length === 0 ? (
                <p className="text-muted-foreground text-center">
                  No messages received yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {receivedMessages.map((msg, index) => (
                    <div key={index} className="bg-white rounded p-2 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="font-medium">{msg.type}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm">
                        {typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>WebSocket URL:</strong>
              <br />
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {wsUrl}
              </code>
            </div>
            <div>
              <strong>Authentication:</strong>
              <br />
              <span className={isSignedIn ? 'text-green-600' : 'text-red-600'}>
                {isSignedIn ? '✅ Signed In' : '❌ Not Signed In'}
              </span>
            </div>
            <div>
              <strong>WebSocket State:</strong>
              <br />
              <span>
                {ws ? `ReadyState: ${ws.readyState}` : 'No WebSocket instance'}
              </span>
            </div>
            <div>
              <strong>Browser Support:</strong>
              <br />
              <span className="text-green-600">
                {typeof WebSocket !== 'undefined' ? '✅ WebSocket Supported' : '❌ Not Supported'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
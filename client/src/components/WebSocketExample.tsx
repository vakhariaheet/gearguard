/**
 * WebSocket Usage Example
 * 
 * Simple example showing how to use the WebSocket hooks
 */

import React, { useState } from 'react';
import { useWebSocket, useWebSocketChat, useWebSocketNotifications } from '../hooks/useWebSocket';

// Basic WebSocket Connection Example
export const BasicWebSocketExample: React.FC = () => {
  const [message, setMessage] = useState('');

  const { isConnected, isConnecting, error, sendMessage, lastMessage } = useWebSocket({
    onOpen: () => console.log('WebSocket connected!'),
    onClose: () => console.log('WebSocket disconnected'),
    onError: (event) => console.error('WebSocket error:', event),
    onMessage: (message) => console.log('Received message:', message),
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage('ping', { content: message });
      setMessage('');
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Basic WebSocket Connection</h3>
      
      <div className="mb-4">
        <div className={`inline-block px-2 py-1 rounded text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 
          isConnecting ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">
          Error: {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Enter message..."
          className="flex-1 px-3 py-2 border rounded"
          disabled={!isConnected}
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected || !message.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {lastMessage && (
        <div className="p-2 bg-gray-100 rounded">
          <strong>Last Message:</strong> {JSON.stringify(lastMessage, null, 2)}
        </div>
      )}
    </div>
  );
};

// Chat Example
export const ChatExample: React.FC = () => {
  const [message, setMessage] = useState('');
  const [currentChannel, setCurrentChannel] = useState('general');

  const {
    isConnected,
    messages,
    users,
    sendChatMessage,
    joinChannel,
  } = useWebSocketChat(currentChannel);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendChatMessage(message);
      setMessage('');
    }
  };

  const handleJoinChannel = (channel: string) => {
    setCurrentChannel(channel);
    joinChannel(channel);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Chat Example</h3>

      {/* Channel Selection */}
      <div className="flex gap-2 mb-4">
        {['general', 'random', 'dev'].map((channel) => (
          <button
            key={channel}
            onClick={() => handleJoinChannel(channel)}
            className={`px-3 py-1 rounded text-sm ${
              currentChannel === channel
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            #{channel}
          </button>
        ))}
      </div>

      {/* Connection Status */}
      <div className="mb-4">
        <span className={`inline-block px-2 py-1 rounded text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className="ml-2 text-sm text-gray-600">
          {users.filter(u => u.isOnline).length} users online
        </span>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto border rounded p-3 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{msg.username}</span>
                  <span className="text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm ml-2">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={`Message #${currentChannel}`}
          className="flex-1 px-3 py-2 border rounded"
          disabled={!isConnected}
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected || !message.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>

      {/* Online Users */}
      {users.filter(u => u.isOnline).length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Online Users</h4>
          <div className="flex flex-wrap gap-2">
            {users
              .filter(user => user.isOnline)
              .map((user) => (
                <span
                  key={user.userId}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                >
                  {user.username}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Notifications Example
export const NotificationsExample: React.FC = () => {
  const {
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
  } = useWebSocketNotifications();

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-sm ${
            isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notifications yet</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                notification.read 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-white border-blue-200 shadow-sm'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium text-sm">{notification.title}</h5>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        notification.type === 'error' ? 'bg-red-100 text-red-800' :
                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        notification.type === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {notification.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Combined Example Component
export const WebSocketExamples: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">WebSocket Examples</h1>
        <p className="text-gray-600 mt-2">
          Examples of using WebSocket hooks with your API
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicWebSocketExample />
        <NotificationsExample />
      </div>

      <ChatExample />
    </div>
  );
};
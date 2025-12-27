/**
 * WebSocket Demo Component
 * 
 * Demonstrates WebSocket functionality with chat and notifications
 */

import React, { useState } from 'react';
import { useWebSocketChat, useWebSocketNotifications } from '../hooks';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export const WebSocketDemo: React.FC = () => {
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('general');

  // Chat functionality
  const {
    isConnected: chatConnected,
    isConnecting: chatConnecting,
    error: chatError,
    messages,
    users,
    sendChatMessage,
    joinChannel,
  } = useWebSocketChat(channel);

  // Notifications functionality  
  const {
    isConnected: notifConnected,
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
  } = useWebSocketNotifications();

  const handleSendMessage = () => {
    if (message.trim()) {
      sendChatMessage(message);
      setMessage('');
    }
  };

  const handleJoinChannel = (newChannel: string) => {
    setChannel(newChannel);
    joinChannel(newChannel);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">WebSocket Demo</h1>
        <p className="text-muted-foreground mt-2">
          Real-time chat and notifications powered by WebSocket
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  chatConnected ? 'bg-green-500' : chatConnecting ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
              <span>
                Chat: {chatConnected ? 'Connected' : chatConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  notifConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span>
                Notifications: {notifConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          {chatError && (
            <p className="text-red-500 mt-2">Error: {chatError}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Section */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Chat</CardTitle>
            <CardDescription>
              Send messages to other connected users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Channel Selection */}
            <div className="flex space-x-2">
              <Button
                variant={channel === 'general' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleJoinChannel('general')}
              >
                #general
              </Button>
              <Button
                variant={channel === 'random' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleJoinChannel('random')}
              >
                #random
              </Button>
              <Button
                variant={channel === 'dev' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleJoinChannel('dev')}
              >
                #dev
              </Button>
            </div>

            {/* Messages */}
            <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-muted/50">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-center">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">{msg.username}</span>
                        <span className="text-muted-foreground">
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
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message #${channel}`}
                className="flex-1 px-3 py-2 border rounded-md"
                disabled={!chatConnected}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!chatConnected || !message.trim()}
              >
                Send
              </Button>
            </div>

            {/* Online Users */}
            <div>
              <h4 className="font-medium mb-2">Online Users ({users.filter(u => u.isOnline).length})</h4>
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
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Real-time system notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearNotifications}
                disabled={notifications.length === 0}
              >
                Clear All
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No notifications yet
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      notification.read 
                        ? 'bg-muted/50 border-muted' 
                        : 'bg-background border-primary/20'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Actions</CardTitle>
          <CardDescription>
            Test WebSocket functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Simulate sending a test notification
                // In a real app, this would be triggered by backend events
                console.log('Test notification would be sent from backend');
              }}
            >
              Test Notification
            </Button>
            <Button
              variant="outline"
              onClick={() => sendChatMessage('Hello from the demo! 👋')}
              disabled={!chatConnected}
            >
              Send Test Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  senderType: 'ADMIN' | 'USER';
  body: string;
  attachment: string | null;
  createdAt: string;
}

export default function Inbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('dating_access_token');
        const response = await fetch('/api/threads/me/messages', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages.reverse()); // Show oldest first
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem('dating_access_token');
      const response = await fetch('/api/threads/me/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          body: newMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Inbox</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Send a message to start the conversation!</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderType === 'USER'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.body}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderType === 'USER' ? 'text-red-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-6 py-2 rounded-lg font-medium"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-500 mt-0.5">ℹ️</div>
          <div>
            <h3 className="font-medium text-blue-900">Need Help?</h3>
            <p className="text-blue-700 text-sm">
              This is your direct line to our team. We're here to help with any questions about your matches, 
              dates, or account. Messages are typically responded to within a few hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

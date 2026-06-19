'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  Paperclip,
  Search,
  MoreVertical,
  Check,
  CheckCheck,
} from 'lucide-react';

const conversations = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    avatar: 'TC',
    lastMessage: 'The UI components look great! Let me review them.',
    timestamp: '2 min ago',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    name: 'StartupXYZ',
    avatar: 'SX',
    lastMessage: 'Can we schedule a call to discuss the API integration?',
    timestamp: '1 hour ago',
    unread: 0,
    online: true,
  },
  {
    id: '3',
    name: 'DeFi Protocol',
    avatar: 'DP',
    lastMessage: 'Audit report has been submitted. Please review.',
    timestamp: '3 hours ago',
    unread: 1,
    online: false,
  },
  {
    id: '4',
    name: 'CryptoVentures',
    avatar: 'CV',
    lastMessage: 'Thanks for your proposal! We will get back to you.',
    timestamp: '1 day ago',
    unread: 0,
    online: false,
  },
];

const messages = [
  {
    id: '1',
    sender: 'them',
    content: 'Hi Alex! How is the E-commerce platform redesign coming along?',
    timestamp: '10:30 AM',
    read: true,
  },
  {
    id: '2',
    sender: 'me',
    content: 'Going well! I have completed the UI components for the product catalog and cart. Working on the checkout flow now.',
    timestamp: '10:35 AM',
    read: true,
  },
  {
    id: '3',
    sender: 'them',
    content: 'That sounds great! Can you share a preview?',
    timestamp: '10:40 AM',
    read: true,
  },
  {
    id: '4',
    sender: 'me',
    content: 'Sure! I have pushed the latest changes to the staging branch. Here is the preview link: staging.techcorp.dev',
    timestamp: '10:45 AM',
    read: true,
  },
  {
    id: '5',
    sender: 'them',
    content: 'The UI components look great! Let me review them.',
    timestamp: '11:00 AM',
    read: false,
  },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState('1');
  const [newMessage, setNewMessage] = useState('');

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-border bg-card">
      {/* Conversations List */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-10" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                selectedConversation === conv.id
                  ? 'bg-primary/10 border-r-2 border-primary'
                  : 'hover:bg-secondary/50'
              }`}
            >
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="gradient-primary text-white text-sm">
                    {conv.avatar}
                  </AvatarFallback>
                </Avatar>
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{conv.name}</p>
                  <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread > 0 && (
                <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs gradient-primary text-white">
                  {conv.unread}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="gradient-primary text-white text-sm">TC</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">TechCorp Inc.</p>
              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-2xl ${
                  msg.sender === 'me'
                    ? 'gradient-primary text-white rounded-br-md'
                    : 'bg-secondary border border-border rounded-bl-md'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-end' : ''}`}>
                  <span className={`text-xs ${msg.sender === 'me' ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {msg.timestamp}
                  </span>
                  {msg.sender === 'me' && (
                    msg.read ? (
                      <CheckCheck className="w-3 h-3 text-white/70" />
                    ) : (
                      <Check className="w-3 h-3 text-white/70" />
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button className="gradient-primary text-white" size="icon">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2, Sparkles, Bot, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { credentialsApi } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(() => Math.random().toString(36).substring(7));

  const loadUserContext = async () => {
    setContextLoading(true);
    try {
      const credResult = await credentialsApi.getMyCredentials();
      if (credResult.success && credResult.data) {
        const allCredentials = credResult.data;
        
        // Only use verified credentials for context/stats
        const verifiedCredentials = allCredentials.filter((c: any) => c.status === 'verified');
        
        const skills = new Set<string>();
        const categories: string[] = [];
        
        verifiedCredentials.forEach((cred: any) => {
          if (cred.skills) cred.skills.forEach((s: string) => skills.add(s));
          if (cred.category) categories.push(cred.category);
        });
        
        setUserContext({
          skills: Array.from(skills),
          credentialsCount: verifiedCredentials.length,
          categories: [...new Set(categories)],
          verifiedCount: verifiedCredentials.length
        });
      }
    } catch (error) {
      console.error('Error loading context:', error);
    } finally {
      setContextLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadUserContext();
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your AI Career Counselor. I can see your credentials and skills to provide personalized advice.

Ask me about:
• Career paths matching your skills
• Skills you need for specific jobs
• Course recommendations
• Interview preparation

How can I help you today?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const contextToSend = userContext ? {
      skills: userContext.skills,
      credentials_count: userContext.credentialsCount,
      verified_credentials: userContext.verifiedCount,
      categories: userContext.categories
    } : {};

    try {
      const response = await fetch('http://localhost:5001/chat/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId.current,
          context: contextToSend
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'AI service is currently unavailable. Please make sure the service is running.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const parseMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .split('\n')
      .map((line, i) => {
        let processed = line
          // First remove leading asterisks that are list markers (not part of bold)
          .replace(/^\s*\*+\s+(?=\*\*)/, '')
          // Then handle bold/italic
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          // Handle numbered lists
          .replace(/^(\d+\)\s+)(.+)$/, '<span class="block"><strong>$1</strong>$2</span>')
          // Handle bullet points with indentation
          .replace(/^(\s*)(\-\s+)(.+)$/, '<span class="block ml-2">• $3</span>')
          .replace(/^(\s*)(\*\s+)(.+)$/, '<span class="block ml-2">• $3</span>');
        
        if (processed.trim() === '') {
          return <br key={i} />;
        }
        return <span key={i} className="block" dangerouslySetInnerHTML={{ __html: processed }} />;
      });
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer border-0"
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-white" />
        </span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[500px] max-w-[90vw]"
          >
            <Card className="shadow-2xl border-2 border-blue-100 dark:border-blue-900">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-white" />
                  <div>
                    <span className="font-semibold text-white block">AI Career Counselor</span>
                    {contextLoading ? (
                      <span className="text-xs text-white/70 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading context...
                      </span>
                    ) : userContext ? (
                      <span className="text-xs text-white/70">
                        {userContext.credentialsCount} credentials • {userContext.skills.length} skills
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-white hover:bg-white/20"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              {!isMinimized && (
                <>
                  <div className="h-[450px] overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-white dark:bg-gray-800 shadow-sm rounded-bl-none'
                          }`}
                        >
                          {parseMarkdown(msg.content)}
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-3 border-t bg-white dark:bg-gray-800 rounded-b-lg">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask about careers..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={loading}
                        className="flex-1"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        size="icon"
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

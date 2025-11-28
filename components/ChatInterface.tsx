import React, { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, ShieldCheck, RefreshCw } from 'lucide-react';
import { CrashAnalysisResult, UploadedFile, ChatMessage } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import { useLanguage } from '../contexts/LanguageContext';

interface ChatInterfaceProps {
  initialData: CrashAnalysisResult;
  file: UploadedFile | null;
  suggestedQuery?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialData, file, suggestedQuery }) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState<Chat | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef<string | null>(null);

  // Initialize Chat Session
  useEffect(() => {
    // Prevent re-initialization if data or language hasn't changed
    const dataId = initialData.title + (file?.name || '') + language;
    if (initializedRef.current === dataId) return;

    const initSession = async () => {
      setIsInitializing(true);
      try {
        const chatSession = await createChatSession(initialData, file, language);
        setSession(chatSession);
        setMessages([{ role: 'model', text: t.chatReady.replace("{title}", initialData.title) }]);
        initializedRef.current = dataId;
      } catch (error) {
        console.error("Failed to init chat", error);
        setMessages([{ role: 'model', text: t.chatError }]);
      } finally {
        setIsInitializing(false);
      }
    };

    initSession();
  }, [initialData, file, language, t]);

  // Handle Suggested Query from Timeline
  useEffect(() => {
    if (suggestedQuery) {
      setInput(suggestedQuery);
    }
  }, [suggestedQuery]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !session) return;

    const userText = input;
    setInput('');
    
    // Add User Message
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      // Add placeholder for model response
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      const result = await session.sendMessageStream({ message: userText });
      
      let fullText = '';
      
      for await (const chunk of result) {
        const text = (chunk as GenerateContentResponse).text;
        if (text) {
          fullText += text;
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: 'model', text: fullText };
            return newMsgs;
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'model', text: t.chatProcessingError };
        return newMsgs;
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="animate-spin" size={24} />
        <span className="text-sm font-medium">{t.initChat}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-white/80 backdrop-blur-sm z-10">
        <ShieldCheck size={18} className="text-red-600" />
        <span className="font-semibold text-slate-800 text-sm">{t.agendaAssistant}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 ${
              msg.role === 'user' ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-red-600'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-red-600 text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-center gap-2 ml-12">
             <div className="flex space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative">
          <textarea
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl py-3 px-4 pr-12 text-sm outline-none transition-all resize-none shadow-sm"
            placeholder={t.askPlaceholder}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          {t.footer}
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  FileText, 
  Send, 
  Loader2, 
  Sparkles, 
  Compass, 
  User, 
  HelpCircle,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';

interface Resume {
  id: number;
  filename: string;
  ats_score: number;
  created_at: string;
}

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const QUICK_PROMPTS = [
  { text: "Suggest experience bullet point improvements", label: "Rewrite Bullets", icon: Sparkles },
  { text: "What technical skills are missing for a senior role?", label: "Skill Gap Analysis", icon: Compass },
  { text: "Draft a dynamic summary for my resume", label: "Write Summary", icon: FileCheck },
  { text: "Generate 3 behavioral interview questions", label: "Prep Questions", icon: HelpCircle }
];

export default function ChatPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedResumeId) {
      fetchChatHistory(selectedResumeId);
    } else {
      setMessages([]);
    }
  }, [selectedResumeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await api.get('/resumes');
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResumeId(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const fetchChatHistory = async (resumeId: number) => {
    setLoadingHistory(true);
    try {
      const response = await api.get(`/chat/${resumeId}/history`);
      setMessages(response.data.map((m: any) => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at
      })));
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || !selectedResumeId || sending) return;

    setInput('');
    setSending(true);
    setStreamingText('');

    // Append user message locally
    const userMsg: ChatMessage = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Stream Response
      const token = localStorage.getItem('accessToken');
      // Axios doesn't support readable streams natively out of the box in standard configs,
      // so fetch is perfect here.
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(`${baseUrl}/chat/${selectedResumeId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: messageContent })
      });

      if (!response.ok) {
        throw new Error('Streaming failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let currentText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // SSE responses yield chunks in standard "data: {json}\n\n" formatting
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            try {
              const cleaned = line.trim().slice(6);
              const parsed = JSON.parse(cleaned);
              if (parsed.text) {
                currentText += parsed.text;
                setStreamingText(currentText);
              } else if (parsed.error) {
                console.error('Gemini stream error:', parsed.error);
                currentText += `\n\n*(Error: ${parsed.error})*`;
                setStreamingText(currentText);
              }
            } catch (jsonErr) {
              // ignore partial chunk json errors
            }
          }
        }
      }

      // Sync backend conversation database entries
      await fetchChatHistory(selectedResumeId);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I failed to generate a response. Please check your connection and Gemini configuration.'
      }]);
    } finally {
      setStreamingText('');
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Helper to format basic markdown to HTML react elements safely
  const formatMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      let formatted = line;

      // Bold: **text**
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Inline Code: `code`
      formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 py-0.5 rounded font-mono text-cyan-400">$1</code>');

      // Check for bullet lists
      if (line.trim().startsWith('- ')) {
        const item = formatted.trim().substring(2);
        return (
          <li key={idx} className="list-disc list-inside ml-4 my-1 text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: item }} />
        );
      }
      if (line.trim().startsWith('* ')) {
        const item = formatted.trim().substring(2);
        return (
          <li key={idx} className="list-disc list-inside ml-4 my-1 text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: item }} />
        );
      }

      // Headers
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-bold text-white mt-3 mb-1 uppercase font-mono tracking-wider" dangerouslySetInnerHTML={{ __html: formatted.substring(4) }} />
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-white mt-4 mb-2 uppercase font-mono tracking-wider" dangerouslySetInnerHTML={{ __html: formatted.substring(3) }} />
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-white mt-4 mb-2 uppercase font-mono tracking-wider" dangerouslySetInnerHTML={{ __html: formatted.substring(2) }} />
        );
      }

      // Empty Lines
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs text-gray-300 leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-red-500/10 border-red-500/20 text-red-400';
  };

  const activeResume = resumes.find(r => r.id === selectedResumeId);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
      {/* Title Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Resume Copilot</h1>
          <p className="text-xs text-gray-400">Context-aware conversational RAG assistant powered by Google Gemini.</p>
        </div>
        <button
          onClick={fetchResumes}
          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-gray-400 hover:text-white"
          title="Reload resumes"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        {/* Left Side: Resumes Selector */}
        <div className="lg:col-span-1 flex flex-col glass-card p-4 border-white/5 min-h-0 bg-[#080711]/40">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Select Context Resume</h3>
          
          {loadingResumes ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="text-xs text-gray-500">Loading documents...</span>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-xs text-gray-500">No resumes found.</p>
              <p className="text-[10px] text-gray-600">Please upload a resume in the Upload page first.</p>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[300px] lg:max-h-none">
              {resumes.map((r) => {
                const isSelected = selectedResumeId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResumeId(r.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                        : 'bg-white/3 border-transparent hover:bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold truncate">{r.filename}</p>
                        <span className="text-[9px] font-mono text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getScoreBg(r.ats_score)} shrink-0`}>
                      {Math.round(r.ats_score)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Chat Window */}
        <div className="lg:col-span-3 flex flex-col glass-card border-white/5 min-h-0 bg-[#080711]/20 overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-white/5 bg-[#090816]/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Apex Copilot</h4>
                <p className="text-[10px] text-gray-400">
                  {activeResume ? `Conversing with: ${activeResume.filename}` : 'Select a resume to begin'}
                </p>
              </div>
            </div>
            
            {activeResume && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getScoreBg(activeResume.ats_score)}`}>
                ATS Index: {Math.round(activeResume.ats_score)}
              </span>
            )}
          </div>

          {/* Chat Messages Body */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 && !streamingText && !loadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/3 flex items-center justify-center text-gray-500">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">RAG Conversational Agent</h4>
                  <p className="text-xs text-gray-500">
                    Ask anything about this resume. Copilot queries details from your technical profile to formulate optimization suggestions.
                  </p>
                </div>
              </div>
            ) : loadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <span className="text-xs text-gray-500">Loading conversation memory...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                        isUser 
                          ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' 
                          : 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                      }`}>
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </div>

                      {/* Content Bubble */}
                      <div className={`p-3.5 rounded-2xl text-left border ${
                        isUser 
                          ? 'bg-cyan-500/5 border-cyan-500/10 text-cyan-50 rounded-tr-none' 
                          : 'bg-purple-500/5 border-purple-500/10 text-purple-50 rounded-tl-none'
                      }`}>
                        {formatMarkdown(m.content)}
                      </div>
                    </div>
                  );
                })}

                {/* Streaming Assistant message */}
                {streamingText && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3.5 rounded-2xl text-left border bg-purple-500/5 border-purple-500/10 text-purple-50 rounded-tl-none">
                      {formatMarkdown(streamingText)}
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-purple-400 animate-pulse shrink-0" />
                    </div>
                  </div>
                )}

                {/* Sending loader */}
                {sending && !streamingText && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-purple-500/10 border border-purple-500/30 text-purple-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="p-3.5 rounded-2xl border bg-purple-500/5 border-purple-500/10 text-gray-500 text-xs italic">
                      Querying vector store & generating token streams...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Quick Prompts chips */}
          {activeResume && !sending && !loadingHistory && (
            <div className="px-4 py-2 border-t border-white/5 bg-black/10 shrink-0">
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {QUICK_PROMPTS.map((qp, idx) => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(qp.text)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/3 hover:bg-purple-500/10 hover:border-purple-500/20 text-[10px] text-gray-400 hover:text-purple-300 font-medium transition cursor-pointer"
                    >
                      <Icon className="w-3 h-3 text-cyan-400" />
                      <span>{qp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Box Bar */}
          <div className="p-4 border-t border-white/5 bg-[#090816]/40 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={!selectedResumeId || sending}
                placeholder={activeResume ? "Message your resume (e.g. 'How can I highlight my Cloud experience?')..." : "Select a resume to start..."}
                className="flex-grow bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleSend()}
                disabled={!selectedResumeId || sending || !input.trim()}
                className="p-3 bg-gradient-to-tr from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

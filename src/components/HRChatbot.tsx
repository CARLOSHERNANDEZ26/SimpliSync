"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Sparkles, Zap } from "lucide-react";

interface AttendanceLog {
  id: string;
  userId: string;
  timeIn: Date | null;  
  timeOut: Date | null; 
  status: string;
  fullName?: string;
  role?: string;
}

interface ChatMessage {
  role: "user" | "model" | "function";
  content: string;
}

// Quick suggestions for the user to click
const SUGGESTIONS = [
  "What is the Overtime Policy?",
  "Check my recent lates",
  "What are the core working hours?",
];

export default function HRChatbot({ logs }: { logs: AttendanceLog[] }) { 
  const [isOpen, setIsOpen] = useState(false); 
  const [input, setInput] = useState("");
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", content: "Hello! Kumusta? I'm your SimpliSync Assistant. Ask me about your attendance, hours, or company rules before I run out of coffee." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Helper to format basic markdown (bolding and line breaks)
  const formatText = (text: string) => {
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-teal-700 dark:text-teal-400">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\n/g, '<br />');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  // Extracted send logic so both the form and buttons can use it
  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    const recentLogs = logs.slice(0, 15);
    const optimizedLogs = recentLogs.map(log => ({ 
      name: log.fullName || "Unknown Employee", 
      date: log.timeIn ? log.timeIn.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : "N/A",
      timeIn: log.timeIn ? log.timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A",
      timeOut: log.timeOut ? log.timeOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Working...",
      status: log.status
    }));

    try {
      const response = await fetch("/api/chat", { 
        method: "POST",
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          messages: newMessages,
          logs: optimizedLogs, 
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: "model", content: data.text }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: "model", content: "Sorry, I'm having trouble connecting to the database right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 xl:bottom-8 left-6 xl:left-8 z-[60]">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-full shadow-2xl shadow-teal-500/30 flex items-center justify-center transition-all active:scale-95 group"
      >
        {isOpen ? <X /> : <MessageSquare className="group-hover:animate-pulse" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 left-0 w-[calc(100vw-3rem)] sm:w-[400px] h-[550px] max-h-[calc(100vh-8rem)] bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative z-10 backdrop-blur-sm">
              <Bot className="text-white w-5 h-5" />
            </div>
            <div className="relative z-10">
              <h3 className="text-white font-bold text-sm">SimpliSync HR Bot</h3>
              <p className="text-teal-100 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                AI Support Live
              </p>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/50 dark:bg-transparent">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                  msg.role === "user" 
                  ? "bg-teal-600 text-white rounded-br-sm" 
                  : "bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-white/5 rounded-bl-sm"
                }`}>
                  {msg.role === "user" ? msg.content : formatText(msg.content)}
                </div>

                {/* Show Suggestion Chips ONLY after the first welcome message */}
                {i === 0 && msg.role === "model" && messages.length === 1 && (
                  <div className="mt-3 flex flex-wrap gap-2 w-full max-w-[85%]">
                    {SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        className="flex items-center gap-1.5 text-xs font-medium bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 px-3 py-1.5 rounded-full border border-teal-200 dark:border-teal-500/20 transition-colors text-left"
                      >
                        <Zap className="w-3 h-3" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="bg-white dark:bg-[#1e1e1e] p-3 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
                  Analyzing policies...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
            className="p-4 bg-white dark:bg-[#151515] border-t border-gray-100 dark:border-white/5 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your hours or policies..."
              className="flex-1 bg-slate-100 dark:bg-white/5 border border-transparent focus:border-teal-500/30 rounded-xl px-4 py-2.5 text-sm outline-none text-gray-900 dark:text-white transition-all placeholder:text-gray-400"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
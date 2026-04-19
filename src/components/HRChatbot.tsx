"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot } from "lucide-react";

interface AttendanceLog {
  id: string;
  userId: string;
  timeIn: Date | null;  
  timeOut: Date | null; 
  status: string;
  fullName?: string;
  role?: string;
}

export default function HRChatbot({ logs }: { logs: AttendanceLog[] }) { 
  const [isOpen, setIsOpen] = useState(false); 
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "model", content: "Hi! I'm your SimpliSync Assistant. Ask me about your attendance, hours, or company rules!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.SubmitEvent) => {
    e.preventDefault(); 
    if (!input.trim()) return;

    const userMessage = input;
    const newMessages = [...messages, { role: "user", content: userMessage }];
    
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
      setMessages(prev => [...prev, { role: "model", content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 xl:bottom-8 left-6 xl:left-8 z-[60]">
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-teal-600 hover:bg-teal-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 group"
      >
        {isOpen ? <X /> : <MessageSquare className="group-hover:animate-pulse" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 left-0 w-[calc(100vw-3rem)] sm:w-[400px] h-[500px] max-h-[calc(100vh-8rem)] bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-teal-600 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">SimpliSync HR Bot</h3>
              <p className="text-teal-100 text-[10px] uppercase tracking-widest font-bold">AI Support Live</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-transparent">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === "user" 
                  ? "bg-teal-600 text-white rounded-tr-none" 
                  : "bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/5 rounded-tl-none"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-xs text-gray-400 animate-pulse">Assistant is thinking...</div>}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-white/5 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your hours..."
              className="flex-1 bg-gray-100 dark:bg-white/5 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none text-gray-900 dark:text-white"
            />
            <button type="submit" className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-500 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
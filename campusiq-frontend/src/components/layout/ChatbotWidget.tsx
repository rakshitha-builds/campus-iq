import { useState, useRef, useEffect } from 'react';
import API from '../../utils/api';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  time: string;
}

const quickQuestions = [
  'How many complaints are pending?',
  'How many rooms are booked today?',
  'What is the resolution rate?',
];

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm the CampusIQ Assistant. Ask me anything about complaints, rooms, employees, or campus operations.",
      sender: 'bot',
      time: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const fetchCampusData = async () => {
    try {
      const [dashRes, workerRes, bookingRes] = await Promise.all([
        API.get('/complaints/dashboard'),
        API.get('/workers/stats'),
        API.get('/bookings'),
      ]);
      const dash = dashRes.data;
      const workers = workerRes.data;
      const bookings = bookingRes.data;
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookings.filter((b: any) => b.booking_date?.startsWith(today));

      return {
        complaints: {
          total: dash.stats.total,
          pending: dash.stats.pending,
          assigned: dash.stats.assigned,
          in_progress: dash.stats.in_progress,
          completed: dash.stats.completed,
          resolution_rate: dash.stats.total > 0 ? Math.round((dash.stats.completed / dash.stats.total) * 100) : 0,
          top_category: dash.categoryStats[0]?.category || 'None',
          categories: dash.categoryStats.map((c: any) => `${c.category}: ${c.count}`).join(', '),
        },
        workers: {
          total: workers.length,
          active: workers.filter((w: any) => w.status === 'Active').length,
        },
        bookings: {
          total: bookings.length,
          today_count: todayBookings.length,
        },
      };
    } catch {
      return null;
    }
  };

  const getBotResponse = async (userMessage: string): Promise<string> => {
    const campusData = await fetchCampusData();
    if (!campusData) {
      return "I'm having trouble fetching live data right now. Please make sure you're logged in and try again.";
    }

    const systemPrompt = `You are CampusIQ Assistant, an AI chatbot for a smart campus management system.
Answer questions naturally using ONLY the live campus data below. Be concise and specific.
If asked something not in this data, say you don't have that information currently.

COMPLAINTS: Total ${campusData.complaints.total}, Pending ${campusData.complaints.pending}, Assigned ${campusData.complaints.assigned}, In Progress ${campusData.complaints.in_progress}, Completed ${campusData.complaints.completed}, Resolution rate ${campusData.complaints.resolution_rate}%, Top category: ${campusData.complaints.top_category}, All categories: ${campusData.complaints.categories}
EMPLOYEES: Total ${campusData.workers.total}, Active ${campusData.workers.active}
BOOKINGS: Total ${campusData.bookings.total}, Today ${campusData.bookings.today_count}`;

    try {
      const res = await API.post('/chatbot/ask', { systemPrompt, userMessage });
      return res.data.reply;
    } catch {
      return 'AI service is temporarily unavailable. Please try again.';
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    setMessages(prev => [...prev, { id: Date.now(), text: messageText, sender: 'user', time: new Date().toLocaleTimeString() }]);
    setInput('');
    setLoading(true);

    const response = await getBotResponse(messageText);
    setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: 'bot', time: new Date().toLocaleTimeString() }]);
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating bubble button — bottom-right corner of the viewport */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
          width: '52px', height: '52px', borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          color: 'white', fontSize: '22px', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Open CampusIQ Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '82px', right: '20px', zIndex: 999,
          width: '320px', height: '380px', background: 'white',
          borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
            <div>
              <p style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>CampusIQ Assistant</p>
              <p style={{ color: '#bfdbfe', fontSize: '11px' }}>Live campus data</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '9px 12px',
                  borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: msg.sender === 'user' ? '#2563eb' : '#f3f4f6',
                  color: msg.sender === 'user' ? 'white' : '#111827',
                }}>
                  <p style={{ fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '9px 12px', borderRadius: '14px 14px 14px 2px', background: '#f3f4f6' }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>Typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions — only before the conversation grows */}
          {messages.length === 1 && (
            <div style={{ padding: '0 14px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {quickQuestions.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  style={{
                    padding: '7px 10px', background: '#f8fafc', border: '1px solid #e5e7eb',
                    borderRadius: '8px', fontSize: '11px', color: '#374151', cursor: 'pointer', textAlign: 'left'
                  }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ask something..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '20px', fontSize: '13px', outline: 'none' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 14px', background: input.trim() ? '#2563eb' : '#e5e7eb',
                color: input.trim() ? 'white' : '#9ca3af', border: 'none', borderRadius: '20px',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
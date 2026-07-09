import { useState, useEffect, useRef } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const RaiseComplaint = () => {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [plainText, setPlainText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const recognitionRef = useRef<any>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    building_id: '',
    block_id: '',
    floor_id: '',
    raised_by: user?.id || 2,
    ai_category: '',
    ai_priority: '',
    ai_sentiment: '',
    ai_confidence: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [b, bl, f, c] = await Promise.all([
          API.get('/master/buildings'),
          API.get('/master/blocks'),
          API.get('/master/floors'),
          API.get('/master/categories'),
        ]);
        setBuildings(b.data);
        setBlocks(bl.data);
        setFloors(f.data);
        setCategories(c.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice not supported. Please use Chrome browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPlainText(transcript);
      setIsListening(false);
      toast.success('Voice captured! Click Analyze with AI.');
    };
    recognition.onerror = () => {
      toast.error('Voice error. Try again.');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo size must be less than 5MB');
      return;
    }
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    toast.success('Photo uploaded! AI will analyze damage.');
  };

  const analyzeWithAI = async () => {
    if (!plainText.trim()) {
      toast.error('Please describe your issue first');
      return;
    }
    setAiLoading(true);
    try {
      // Calls the REAL Python AI service directly — TF-IDF + Logistic
      // Regression models (trained via train_model.py) for category/priority,
      // RoBERTa transformer for sentiment. Uses the same host the page was
      // loaded from so this keeps working even if the machine's IP changes.
      const res = await fetch(`http://${window.location.hostname}:8000/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plainText }),
      });
      if (!res.ok) throw new Error('AI service returned an error');
      const data = await res.json();

      const result = {
        category: data.category,
        priority: data.priority,
        sentiment: data.sentiment,
        confidence: data.confidence,
        sentiment_confidence: data.sentiment_confidence,
        engine: data.engine,
        sentiment_engine: data.sentiment_engine,
      };
      setAiResult(result);
      setForm(prev => ({
        ...prev,
        category: data.category,
        priority: data.priority,
        title: plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText,
        description: plainText,
        ai_category: data.category,
        ai_priority: data.priority,
        ai_sentiment: data.sentiment,
        ai_confidence: String(data.confidence),
      }));
      toast.success('AI analysis complete!');
    } catch (err) {
      toast.error('AI service unavailable — make sure campusiq-ai is running on port 8000');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        formData.append(key, (form as any)[key]);
      });
      formData.append('raised_by', String(user?.id || 2));
      if (photo) formData.append('photo', photo);

      await API.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Complaint submitted successfully!');
      setForm({
        title: '', description: '', category: '', priority: 'Medium',
        building_id: '', block_id: '', floor_id: '', raised_by: user?.id || 2,
        ai_category: '', ai_priority: '', ai_sentiment: '', ai_confidence: '',
      });
      setAiResult(null);
      setPlainText('');
      setPhoto(null);
      setPhotoPreview('');
    } catch (err) {
      toast.error('Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Raise Complaint</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Type or speak your issue — AI will analyze and fill the form automatically
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Left — AI Input */}
        <div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
              Step 1 — Describe your issue
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
              Type in plain English OR click the mic button to speak
            </p>

            <textarea
              placeholder="Type your complaint OR click the mic button to speak..."
              value={plainText}
              onChange={e => setPlainText(e.target.value)}
              rows={4}
              style={{
                width: '100%', padding: '10px 12px',
                border: `1px solid ${isListening ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '8px', fontSize: '14px', outline: 'none',
                resize: 'vertical', color: '#111827', fontFamily: 'inherit',
                transition: 'border 0.2s'
              }}
            />

            {isListening && (
              <div style={{
                marginTop: '8px', padding: '8px 12px',
                background: '#fee2e2', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#dc2626', animation: 'pulse 1s infinite'
                }}/>
                <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '500' }}>
                  Listening... speak your complaint now
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={toggleVoice}
                style={{
                  padding: '10px 16px',
                  background: isListening ? '#dc2626' : '#f3f4f6',
                  color: isListening ? 'white' : '#374151',
                  border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                {isListening ? '⏹ Stop' : '🎤 Speak'}
              </button>
              <button
                onClick={analyzeWithAI}
                disabled={aiLoading}
                style={{
                  flex: 1, padding: '10px',
                  background: aiLoading ? '#93c5fd' : '#2563eb',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', fontWeight: '500' }}>
                Text input supported
              </span>
              <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', fontWeight: '500' }}>
                Voice input supported
              </span>
            </div>
          </div>

          {/* AI Result */}
          {aiResult && (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
              border: '1px solid #86efac',
              borderRadius: '14px', padding: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '18px' }}></span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#15803d' }}>
                  AI Analysis Result
                </h3>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                {[
                  { label: 'Category', value: aiResult.category, bg: '#eff6ff', color: '#1d4ed8' },
                  { label: 'Priority', value: aiResult.priority, bg: '#fee2e2', color: '#dc2626' },
                  { label: 'Sentiment', value: aiResult.sentiment, bg: '#f5f3ff', color: '#7c3aed' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'white', borderRadius: '9px', padding: '9px 14px',
                    border: '1px solid #d1fae5', flex: '1', minWidth: '110px'
                  }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '3px' }}>{item.label}</div>
                    <div style={{
                      fontSize: '14px', fontWeight: '700',
                      background: item.bg, color: item.color,
                      padding: '3px 10px', borderRadius: '10px', display: 'inline-block'
                    }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#374151', fontWeight: '500' }}>
                    {aiResult.engine || 'Classification Model'}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8' }}>
                    {aiResult.confidence}%
                  </span>
                </div>
                <div style={{ background: '#e5e7eb', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${aiResult.confidence}%`, height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', borderRadius: '6px'
                  }} />
                </div>
              </div>

              {aiResult.sentiment_confidence != null && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#374151', fontWeight: '500' }}>
                      {aiResult.sentiment_engine || 'Sentiment Model'}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed' }}>
                      {aiResult.sentiment_confidence}%
                    </span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${aiResult.sentiment_confidence}%`, height: '100%',
                      background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', borderRadius: '6px'
                    }} />
                  </div>
                </div>
              )}

              <p style={{ fontSize: '12px', color: '#15803d', marginTop: '12px' }}>
                ✓ Form auto-filled based on live AI analysis. Review and submit.
              </p>
            </div>
          )}
        </div>

        {/* Right — Form */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Step 2 — Review and submit
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
                Title <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Complaint title"
                required
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
                  Category <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  required
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                >
                  <option value="">Select</option>
                  {categories.map(c => <option key={c.id} value={c.category_name}>{c.category_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Block</label>
              <select
                value={form.block_id}
                onChange={e => setForm({ ...form, block_id: e.target.value, floor_id: '' })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
              >
                <option value="">Select block</option>
                {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Floor</label>
              <select
                value={form.floor_id}
                onChange={e => setForm({ ...form, floor_id: e.target.value })}
                disabled={!form.block_id}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', background: !form.block_id ? '#f9fafb' : 'white' }}
              >
                <option value="">{form.block_id ? 'Select floor' : 'Select a block first'}</option>
                {floors.filter(f => String(f.block_id) === String(form.block_id)).map(f => <option key={f.id} value={f.id}>{f.floor_name}</option>)}
              </select>
            </div>

            {/* Photo Upload */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>
                Upload Photo (optional)
              </label>
              <div
                style={{
                  border: `2px dashed ${photoPreview ? '#86efac' : '#d1d5db'}`,
                  borderRadius: '8px', padding: '14px',
                  textAlign: 'center', cursor: 'pointer',
                  background: photoPreview ? '#f0fdf4' : '#f9fafb'
                }}
                onClick={() => document.getElementById('photo-input')?.click()}
              >
                {photoPreview ? (
                  <div>
                    <img
                      src={photoPreview}
                      alt="preview"
                      style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '6px', marginBottom: '6px' }}
                    />
                    <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>Photo ready to upload</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '20px', marginBottom: '4px' }}>📷</p>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>Click to upload damage photo</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(''); }}
                  style={{
                    marginTop: '4px', fontSize: '12px', color: '#dc2626',
                    background: 'none', border: 'none', cursor: 'pointer'
                  }}
                >
                  Remove photo
                </button>
              )}
            </div>

            {aiResult && (
              <div style={{
                background: '#eff6ff', borderRadius: '8px', padding: '10px 12px',
                marginBottom: '14px', border: '1px solid #bfdbfe'
              }}>
                <p style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '500' }}>
                  AI filled: Category → {aiResult.category} | Priority → {aiResult.priority} | Sentiment → {aiResult.sentiment} | Confidence → {aiResult.confidence}%
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px',
                background: loading ? '#93c5fd' : '#2563eb',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RaiseComplaint;
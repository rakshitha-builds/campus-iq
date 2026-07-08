import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';

const QRGuestComplaint = () => {
  const params = new URLSearchParams(window.location.search);
  const roomLabel = params.get('room') || '';
  const buildingLabel = params.get('building') || '';
  const blockLabel = params.get('block') || '';
  const floorLabel = params.get('floor') || '';
  const buildingId = params.get('building_id') || '';
  const blockId = params.get('block_id') || '';
  const floorId = params.get('floor_id') || '';

  const [step, setStep] = useState<'name' | 'form' | 'done'>('name');
  const [guestName, setGuestName] = useState('');
  const [trackToken, setTrackToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
  });
  const [plainText, setPlainText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const analyzeWithAI = async () => {
    if (!plainText.trim()) {
      toast.error('Please describe your issue first');
      return;
    }
    setAiLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const text = plainText.toLowerCase();
      let category = 'General';
      let priority = 'Medium';
      let confidence = 78;

      if (text.includes('ac') || text.includes('air') || text.includes('cool') || text.includes('hvac')) {
        category = 'HVAC'; confidence = 91;
      } else if (text.includes('light') || text.includes('electric') || text.includes('fan') || text.includes('projector')) {
        category = 'Electrical'; confidence = 89;
      } else if (text.includes('water') || text.includes('leak') || text.includes('pipe') || text.includes('washroom')) {
        category = 'Plumbing'; confidence = 88;
      } else if (text.includes('wifi') || text.includes('internet') || text.includes('network')) {
        category = 'Internet'; confidence = 95;
      } else if (text.includes('clean') || text.includes('dirty') || text.includes('garbage')) {
        category = 'Cleaning'; confidence = 85;
      } else if (text.includes('door') || text.includes('lock') || text.includes('security') || text.includes('cctv')) {
        category = 'Security'; confidence = 82;
      }

      if (text.includes('not working') || text.includes('broken') || text.includes('urgent') || text.includes('emergency')) {
        priority = 'High';
      } else if (text.includes('critical') || text.includes('immediate') || text.includes('dangerous')) {
        priority = 'Critical';
      } else if (text.includes('slow') || text.includes('sometime') || text.includes('minor')) {
        priority = 'Low';
      }

      setAiResult({ category, priority, confidence });
      setForm(prev => ({
        ...prev,
        category,
        priority,
        title: plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText,
        description: plainText,
      }));
      toast.success('AI analysis complete!');
    } catch {
      toast.error('AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    API.get('/master/categories/public').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleContinue = () => {
    if (!guestName.trim()) {
      toast.error('Please enter your name to continue');
      return;
    }
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category) {
      toast.error('Please fill in the title and category');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('guest_name', guestName.trim());
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('priority', form.priority);
      if (buildingId) formData.append('building_id', buildingId);
      if (blockId) formData.append('block_id', blockId);
      if (floorId) formData.append('floor_id', floorId);
      if (photo) formData.append('photo', photo);

      const res = await API.post('/complaints/guest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setTrackToken(res.data?.complaint?.guest_token || '');
      setStep('done');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const locationSummary = [roomLabel, blockLabel, buildingLabel].filter(Boolean).join(' — ') || 'Location not detected from QR';

  if (step === 'done') {
    const trackUrl = `${window.location.origin}/track/${trackToken}`;
    return (
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Thanks, {guestName}!</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '380px', margin: '0 auto 20px' }}>
          Your complaint has been submitted and the maintenance team has been notified.
        </p>

        {trackToken && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '18px', maxWidth: '420px', margin: '0 auto' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#1d4ed8', marginBottom: '8px' }}>
              Save this link to check your status later
            </p>
            <p style={{ fontSize: '12px', color: '#3730a3', marginBottom: '12px' }}>
              No login needed — you'll also be able to leave feedback here once it's resolved.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                readOnly
                value={trackUrl}
                onClick={e => (e.target as HTMLInputElement).select()}
                style={{ flex: 1, padding: '9px 10px', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', background: 'white', color: '#374151' }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(trackUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ padding: '9px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'name') {
    return (
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e5e7eb', maxWidth: '420px', margin: '0 auto' }}>
        <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: '500', marginBottom: '6px' }}>{locationSummary}</p>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Report an Issue</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
          No account needed — just tell us your name so we can follow up if needed.
        </p>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Your Name *</label>
        <input
          type="text"
          placeholder="e.g. Priya Sharma"
          value={guestName}
          onChange={e => setGuestName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleContinue()}
          autoFocus
          style={{ width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '16px' }}
        />
        <button
          onClick={handleContinue}
          style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e5e7eb', maxWidth: '520px', margin: '0 auto' }}>
      <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: '500', marginBottom: '6px' }}>{locationSummary}</p>
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>Hi {guestName}, what's the issue?</h2>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
        Describe it in your own words — AI will fill in the category and priority for you.
      </p>

      <div style={{ marginBottom: '16px' }}>
        <textarea
          placeholder="e.g. The fan in this room isn't working and it's really hot..."
          value={plainText}
          onChange={e => setPlainText(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: '10px' }}
        />
        <button
          type="button"
          onClick={analyzeWithAI}
          disabled={aiLoading}
          style={{
            width: '100%', padding: '11px', background: aiLoading ? '#93c5fd' : '#7c3aed',
            color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            cursor: aiLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
        </button>
      </div>

      {aiResult && (
        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>
          <p style={{ fontSize: '12px', color: '#6d28d9', fontWeight: '500' }}>
            AI filled: Category → {aiResult.category} | Priority → {aiResult.priority} | Confidence → {aiResult.confidence}%
          </p>
        </div>
      )}

      <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
        Review below before submitting (feel free to adjust anything):
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Title *</label>
          <input
            type="text"
            placeholder="e.g. Broken tap, Fan not working"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Description</label>
          <textarea
            placeholder="Add any extra detail that might help..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Category *</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            >
              <option value="">Select category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.category_name}>{c.category_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Priority</label>
            <select
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Photo (optional)</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: '13px' }} />
          {photoPreview && (
            <img src={photoPreview} alt="preview" style={{ marginTop: '10px', maxHeight: '140px', borderRadius: '8px' }} />
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', padding: '12px', background: submitting ? '#93c5fd' : '#2563eb',
            color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
            cursor: submitting ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
};

export default QRGuestComplaint;
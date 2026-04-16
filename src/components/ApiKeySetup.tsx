import { useState } from 'react';
import { Key, Lock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Props {
  onSuccess: (key: string) => void;
  onBack: () => void;
}

export default function ApiKeySetup({ onSuccess, onBack }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = async () => {
    if (!apiKey || apiKey.length < 20) {
      setError('Please enter a valid Google Gemini API Key');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      // We'll call the backend to validate the key against a simple Gemini list models call
      const res = await fetch(`${API_BASE_URL}/api/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();
      
      if (data.success) {
        onSuccess(apiKey);
      } else {
        setError(data.error || 'Invalid API Key. Please check and try again.');
      }
    } catch (err) {
      setError('Connection failed. Make sure the backend server is running.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(3,3,5,0.4)', backdropFilter: 'blur(12px)'
    }}>
      <div className="card-3d fade-up" style={{
        maxWidth: 500, width: '90%', padding: '40px', textAlign: 'center',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: 'rgba(139,92,246,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          border: '1px solid rgba(139,92,246,0.2)'
        }}>
          <Key size={32} color="#8B5CF6" />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>AI Security Setup</h2>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32, lineHeight: 1.6 }}>
          To perform live site audits, we use **Gemini 2.0 Flash**. Your key is kept strictly in-memory and is never stored on a server.
        </p>

        <div style={{ textAlign: 'left', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Google Gemini API Key
            </label>
            <a 
              href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" 
              style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 8,
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                fontSize: 10, color: '#C084FC', textDecoration: 'none', fontWeight: 800,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                boxShadow: '0 0 10px rgba(139,92,246,0.1)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(139,92,246,0.2)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(139,92,246,0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(139,92,246,0.1)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(139,92,246,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C084FC', animation: 'pulse 1.5s infinite alternate', boxShadow: '0 0 8px #C084FC' }} />
              Get an API Key
            </a>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key here..."
              style={{
                width: '100%', padding: '14px 16px 14px 44px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
                fontFamily: 'monospace'
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(139,92,246,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EA4335', fontSize: 12, marginTop: 10, fontWeight: 500 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onBack} style={{
            flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)',
            color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer'
          }}>
            Back
          </button>
          <button onClick={validate} disabled={validating || !apiKey} style={{
            flex: 2, padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            color: '#fff', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: (validating || !apiKey) ? 0.6 : 1, transition: 'all 0.2s'
          }}>
            {validating ? <Loader2 size={18} className="spin" /> : <ShieldCheck size={18} />}
            {validating ? 'Verifying Key...' : 'Validate & Enter'}
          </button>
        </div>

        <div style={{ marginTop: 24, padding: '12px', borderRadius: 8, background: 'rgba(52,168,83,0.05)', border: '1px solid rgba(52,168,83,0.1)' }}>
          <p style={{ fontSize: 11, color: 'rgba(52,168,83,0.8)', margin: 0 }}>
            <b>Security Note</b>: This application runs locally. Your API key stays on your machine during the audit process.
          </p>
        </div>
      </div>
    </div>
  );
}

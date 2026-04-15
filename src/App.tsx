import React, { useState } from 'react';
import NetworkBackground from './components/NetworkBackground';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnalyzePage from './pages/AnalyzePage';
import DatasetsPage from './pages/DatasetsPage';
import ModelsPage from './pages/ModelsPage';
import ReportsPage from './pages/ReportsPage';
import WelcomeScreen from './components/WelcomeScreen';
import ApiKeySetup from './components/ApiKeySetup';

const pages: Record<string, React.FC<any>> = {
  dashboard: Dashboard,
  analyze:   AnalyzePage,
  datasets:  DatasetsPage,
  models:    ModelsPage,
  reports:   ReportsPage,
};

export default function App() {
  const [step, setStep] = useState<'welcome' | 'setup' | 'app'>('welcome');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [active, setActive] = useState('dashboard');

  // Reset on refresh behavior: strictly in-memory
  // Since step/apiKey are state, they reset naturally on reload.

  const handleStart = () => setStep('setup');
  const handleKeySuccess = (key: string) => {
    setApiKey(key);
    setStep('app');
  };
  const handleBack = () => setStep('welcome');

  const Page = pages[active] ?? Dashboard;

  return (
    <div style={{ minHeight:'100vh', position:'relative', overflow: 'hidden' }}>
      {/* Persistant 3D/4D Background */}
      <NetworkBackground />

      {step === 'welcome' && (
        <WelcomeScreen onStart={handleStart} />
      )}

      {step === 'setup' && (
        <ApiKeySetup onSuccess={handleKeySuccess} onBack={handleBack} />
      )}

      {step === 'app' && (
        <div className="fade-up" style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar active={active} onNav={setActive} apiKeyStatus={!!apiKey} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* We pass the apiKey to pages that need it, like AnalyzePage */}
            <Page apiKey={apiKey} />
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import NetworkBackground from './components/NetworkBackground';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AnalyzePage from './pages/AnalyzePage';
import DatasetsPage from './pages/DatasetsPage';
import ModelsPage from './pages/ModelsPage';
import ReportsPage from './pages/ReportsPage';
import WelcomeScreen from './components/WelcomeScreen';
import ApiKeySetup from './components/ApiKeySetup';
import UpcomingFeaturesPage from './pages/UpcomingFeaturesPage';
import ErrorBoundary from './components/ErrorBoundary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pages: Record<string, React.FC<any>> = {
  dashboard: Dashboard,
  analyze:   AnalyzePage,
  datasets:  DatasetsPage,
  models:    ModelsPage,
  reports:   ReportsPage,
  features:  UpcomingFeaturesPage,
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
    <ErrorBoundary>
      <div style={{ minHeight:'100vh', position:'relative', overflow: 'hidden' }}>
        {/* Persistant 3D/4D Background */}
        <NetworkBackground />

        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <WelcomeScreen key="welcome" onStart={handleStart} />
          )}

          {step === 'setup' && (
            <ApiKeySetup key="setup" onSuccess={handleKeySuccess} onBack={handleBack} />
          )}

          {step === 'app' && (
            <motion.div 
              key="app" 
              initial={{ opacity: 0, y: 30, scale: 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', minHeight: '100vh', width: '100%' }}
            >
              <Sidebar active={active} onNav={setActive} apiKeyStatus={!!apiKey} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* We pass the apiKey to pages that need it, like AnalyzePage */}
                <Page apiKey={apiKey} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

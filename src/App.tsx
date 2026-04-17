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

  const handleStart     = () => setStep('setup');
  const handleKeySuccess = (key: string) => { setApiKey(key); setStep('app'); };
  const handleBack      = () => setStep('welcome');
  // Allow sidebar "API Setup" button to go straight to the setup screen from the app
  const handleApiSetup  = () => setStep('setup');

  const Page = pages[active] ?? Dashboard;

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Persistent 3D background */}
        <NetworkBackground />

        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <WelcomeScreen
              key="welcome"
              onStart={handleStart}
              onSetupApi={handleStart}   // both buttons go to setup
            />
          )}

          {step === 'setup' && (
            <ApiKeySetup key="setup" onSuccess={handleKeySuccess} onBack={handleBack} />
          )}

          {step === 'app' && (
            <motion.div
              key="app"
              initial={{ opacity: 0, y: 24, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', minHeight: '100vh', width: '100%' }}
            >
              <Sidebar
                active={active}
                onNav={setActive}
                apiKeyStatus={!!apiKey}
                onApiSetup={handleApiSetup}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Page apiKey={apiKey} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

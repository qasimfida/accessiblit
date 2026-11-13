import React, { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { init, destroy } from '@qasimfida/accessiblit';
import { AccessiblitWidget } from '@qasimfida/accessiblit/react';

// The brief's effect pattern also works without the convenience component.
function EffectSnippet() {
  useEffect(() => {
    init();
    return () => destroy();
  }, []);
  return null;
}
function App() {
  const [mode, setMode] = useState('component');
  return (
    <main>
      <h1>Packed React integration</h1>
      <p>One widget owner per document. Switch examples to exercise cleanup.</p>
      <button onClick={() => setMode('component')}>Component example</button>
      <button onClick={() => setMode('effect')}>Effect snippet</button>
      <button onClick={() => setMode('off')}>Unmount widget</button>
      {mode === 'component' && <AccessiblitWidget persist={false} />}
      {mode === 'effect' && <EffectSnippet />}
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

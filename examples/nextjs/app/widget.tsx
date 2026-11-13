'use client';
import { useState } from 'react';
import { AccessiblitWidget } from '@qasimfida/accessiblit/react';
/** A client boundary owns browser effects; unmounting releases the singleton. */
export default function Widget() {
  const [enabled, setEnabled] = useState(true);
  return (
    <>
      <button onClick={() => setEnabled(!enabled)}>
        {enabled ? 'Unmount widget' : 'Mount widget'}
      </button>
      {enabled && <AccessiblitWidget persist={false} />}
    </>
  );
}

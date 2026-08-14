'use client';

import { useState } from 'react';
import { GoalPauseSheet } from '@/components/GoalPauseSheet';

/** Client preview harness for the pause sheet (Phase B). */
export function PausePreview() {
  const [open, setOpen] = useState(true);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)}>
        Open pause sheet
      </button>
    );
  return <GoalPauseSheet onConfirm={() => setOpen(false)} onDismiss={() => setOpen(false)} />;
}

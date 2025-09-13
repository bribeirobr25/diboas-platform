'use client';

import { useEffect, useState } from 'react';

/**
 * Live Region Component
 * 
 * Accessibility: Announces dynamic content changes to screen readers
 * Performance: Minimal DOM updates with state management
 */

interface Announcement {
  id: string;
  message: string;
  level: 'polite' | 'assertive';
  timestamp: number;
}

let announcements: Announcement[] = [];
let listeners: ((announcements: Announcement[]) => void)[] = [];

// Global announcement functions
export const announce = {
  polite: (message: string) => addAnnouncement(message, 'polite'),
  assertive: (message: string) => addAnnouncement(message, 'assertive'),
};

function addAnnouncement(message: string, level: 'polite' | 'assertive') {
  const announcement: Announcement = {
    id: Date.now().toString(),
    message,
    level,
    timestamp: Date.now(),
  };
  
  announcements = [announcement];
  
  // Notify all LiveRegion components
  listeners.forEach(listener => listener(announcements));
  
  // Clear after announcement
  setTimeout(() => {
    announcements = announcements.filter(a => a.id !== announcement.id);
    listeners.forEach(listener => listener(announcements));
  }, 1000);
}

export function LiveRegion() {
  const [currentAnnouncements, setCurrentAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const listener = (newAnnouncements: Announcement[]) => {
      setCurrentAnnouncements(newAnnouncements);
    };
    
    listeners.push(listener);
    
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const politeAnnouncements = currentAnnouncements.filter(a => a.level === 'polite');
  const assertiveAnnouncements = currentAnnouncements.filter(a => a.level === 'assertive');

  return (
    <>
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncements.map(announcement => (
          <div key={announcement.id}>
            {announcement.message}
          </div>
        ))}
      </div>
      
      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true" 
        className="sr-only"
      >
        {assertiveAnnouncements.map(announcement => (
          <div key={announcement.id}>
            {announcement.message}
          </div>
        ))}
      </div>
    </>
  );
}
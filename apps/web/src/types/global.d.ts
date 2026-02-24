interface PerformanceMemory {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface Performance {
  memory?: PerformanceMemory;
}

interface Window {
  gtag?: (
    command: 'config' | 'event' | 'js' | 'consent' | 'set',
    targetOrAction: string | Date,
    params?: Record<string, unknown>,
  ) => void;
}

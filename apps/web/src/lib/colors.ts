// diBoaS Brand Colors - Extracted from design-system.md
export const diBoasColors = {
  // Brand Identity Colors
  brand: {
    logo: '#02c3cf',      // Exact logo color
    primary: '#14b8a6',   // Primary brand color
    primaryDark: '#0d9488' // Darker variant
  },

  // Social Platform Colors (for share buttons)
  social: {
    whatsapp: '#25D366',
    twitter: '#000000',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
    facebook: '#1877F2',
    telegram: '#0088cc',
    copy: '#64748b',
    download: '#0d9488'
  },

  // Primary Brand Color (Turquoise/Aqua)
  primary: {
    50: '#f0fdfa',   // Very light aqua
    100: '#ccfbf1',  // Light aqua
    200: '#99f6e4',  // Lighter aqua
    300: '#5eead4',  // Medium aqua
    400: '#2dd4bf',  // Base aqua (from logo)
    500: '#14b8a6',  // Primary aqua
    600: '#0d9488',  // Darker aqua
    700: '#0f766e',  // Deep aqua
    800: '#115e59',  // Very deep aqua
    900: '#134e4a'   // Darkest aqua
  },

  // Secondary Colors (From Mascots)
  secondary: {
    // Mystic Purple (from purple mascot)
    purple: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',  // Base purple
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87'
    },

    // Coral (from coral mascot)
    coral: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',  // Base coral
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    }
  },

  // Neutral Colors (Professional Balance)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },

  // Semantic Colors (Status & Actions)
  semantic: {
    success: '#10b981',    // Green for success states
    warning: '#f59e0b',    // Amber for warnings
    error: '#ef4444',      // Red for errors (matches coral)
    info: '#3b82f6'        // Blue for information
  }
} as const;

// Color Usage Strategy
export const colorUsage = {
  // Primary Color Applications
  primary: {
    backgrounds: ['Hero sections', 'Primary buttons', 'Active states', 'Progress indicators'],
    accents: ['Links', 'Icons', 'Borders', 'Focus states'],
    text: ['Headings', 'Important labels', 'Brand text'],
    gradients: ['Hero backgrounds', 'Card overlays', 'Button variations']
  },

  // Secondary Color Applications
  secondary: {
    purple: {
      context: 'Investing & Strategy',
      usage: ['Investment cards', 'Portfolio elements', 'Strategy indicators', 'Premium features']
    },
    coral: {
      context: 'DeFi & Innovation',
      usage: ['DeFi elements', 'Warning states', 'Innovation badges', 'Advanced features']
    }
  },

  // Neutral Color Applications
  neutral: {
    text: {
      primary: 'neutral-900',    // Headings, important text
      secondary: 'neutral-600',  // Body text, descriptions
      muted: 'neutral-400'       // Captions, disabled text
    },
    backgrounds: {
      page: 'neutral-50',        // Page backgrounds
      card: 'white',             // Card backgrounds
      input: 'neutral-100'       // Input backgrounds
    },
    borders: {
      default: 'neutral-200',    // Default borders
      focus: 'primary-500',      // Focus borders
      error: 'semantic-error'    // Error borders
    }
  }
};
/**
 * SecurityOneFeature Configuration
 * 
 * Domain-Driven Design: Security features domain configuration
 * Service Agnostic Abstraction: Decoupled security content from presentation
 * Configuration Management: Centralized security content and feature definitions
 * No Hardcoded Values: All values configurable through interfaces
 */

import type { SecurityFeature, SecurityOneFeatureProps } from '@/components/Sections/SecurityOneFeature';

// Default security features configuration
export const DEFAULT_SECURITY_FEATURES: SecurityFeature[] = [
  {
    id: 'me-roubaram',
    title: 'Me Roubaram',
    isPrimary: true,
    href: '/security/fraud-report',
    target: '_self'
  },
  {
    id: 'canal-denuncias',
    title: 'Canal de Denúncias',
    href: '/security/reports',
    target: '_self'
  },
  {
    id: 'central-protecao',
    title: 'Central de Proteção',
    href: '/security/protection',
    target: '_self'
  },
  {
    id: 'canais-atendimento',
    title: 'Canais de Atendimento',
    href: '/security/support',
    target: '_self'
  }
] as const;

// Default CTA configuration
export const DEFAULT_SECURITY_CTA = {
  text: 'Conheça nossas soluções',
  href: '/security',
  target: '_self' as const
};

// Default SecurityOneFeature configuration
export const DEFAULT_SECURITY_ONE_FEATURE_CONFIG: SecurityOneFeatureProps = {
  title: 'Segurança é prioridade',
  subtitle: 'Estamos aqui para te dar suporte completo e garantir a proteção do seu dinheiro.',
  features: DEFAULT_SECURITY_FEATURES,
  cta: DEFAULT_SECURITY_CTA,
  enableAnimations: true
} as const;

// Page-specific security configurations
export const PAGE_SECURITY_CONFIGS = {
  // Homepage security section
  HOME: DEFAULT_SECURITY_ONE_FEATURE_CONFIG,
  
  // Dedicated security page
  SECURITY: {
    ...DEFAULT_SECURITY_ONE_FEATURE_CONFIG,
    title: 'Sua segurança em primeiro lugar',
    subtitle: 'Oferecemos as mais avançadas tecnologias de segurança para proteger seus dados e transações financeiras.',
    backgroundColor: '#ffffff'
  } as SecurityOneFeatureProps,
  
  // Business security section
  BUSINESS: {
    title: 'Segurança empresarial',
    subtitle: 'Soluções de segurança corporativa para proteger os ativos e dados da sua empresa.',
    features: [
      {
        id: 'enterprise-security',
        title: 'Segurança Empresarial',
        isPrimary: true,
        href: '/business/security',
        target: '_self'
      },
      {
        id: 'fraud-prevention',
        title: 'Prevenção de Fraudes',
        href: '/business/security/fraud',
        target: '_self'
      },
      {
        id: 'compliance',
        title: 'Conformidade',
        href: '/business/compliance',
        target: '_self'
      },
      {
        id: 'data-protection',
        title: 'Proteção de Dados',
        href: '/business/security/data',
        target: '_self'
      }
    ],
    cta: {
      text: 'Soluções Empresariais',
      href: '/business/security',
      target: '_self'
    },
    enableAnimations: true
  } as SecurityOneFeatureProps
} as const;

// Legacy compatibility
export const DEFAULT_SECURITY_CONFIG = DEFAULT_SECURITY_ONE_FEATURE_CONFIG;
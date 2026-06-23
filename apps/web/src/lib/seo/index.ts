/**
 * SEO Module Exports
 * File Decoupling: Clean module interface
 */

export * from './types';
export * from './constants';
export { seoService } from './service';
export { SEOMetadataFactory } from './metadata-factory';

// Convenience exports for common use cases
export {
  generateStaticPageMetadata,
  generateDynamicPageMetadata,
  generateLocaleStaticParams,
} from './helpers';
export { getTwitterMeta } from './twitter';
export { socialCardMetadata } from './socialCard';

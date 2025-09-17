/**
 * SEO Module Exports
 * File Decoupling: Clean module interface
 */

export * from './types';
export * from './constants';
export { seoService } from './service';
export { MetadataFactory } from './metadata-factory';

// Convenience exports for common use cases
export { generateStaticPageMetadata, generateDynamicPageMetadata } from './helpers';
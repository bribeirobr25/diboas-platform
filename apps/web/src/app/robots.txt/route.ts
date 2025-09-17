/**
 * Robots.txt Route Handler
 * 
 * Performance Optimization: Cached robots.txt generation
 * Security Standards: Safe robots.txt generation
 * Error Handling: Graceful fallback
 */

import { NextResponse } from 'next/server';
import { seoService } from '@/lib/seo/services/SEOService';

// Performance: Cache robots.txt for 24 hours
const CACHE_DURATION = 86400;

export async function GET(): Promise<NextResponse> {
  try {
    // Generate robots.txt using domain service
    const robotsTxt = seoService.generateRobotsTxt();
    
    // Performance Optimization: Set appropriate cache headers
    const headers = new Headers({
      'Content-Type': 'text/plain',
      'Cache-Control': `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`,
      'X-Generated-At': new Date().toISOString(),
    });

    return new NextResponse(robotsTxt, {
      status: 200,
      headers,
    });
  } catch (error) {
    // Error Handling: Log error and return basic fallback
    console.error('Robots.txt generation failed:', error);
    
    // Error Recovery: Return basic robots.txt fallback
    const fallbackRobots = [
      'User-agent: *',
      'Allow: /',
      '',
      'Sitemap: https://diboas.com/sitemap.xml'
    ].join('\\n');

    return new NextResponse(fallbackRobots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=300', // Shorter cache for fallback
        'X-Fallback': 'true',
      },
    });
  }
}
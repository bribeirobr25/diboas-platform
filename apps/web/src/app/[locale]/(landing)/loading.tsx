/**
 * Landing Route Group Loading State
 *
 * Thin wrapper around the shared RouteGroupLoading component.
 */

import { RouteGroupLoading } from '@/components/ErrorBoundary/RouteGroupLoading';

export default function LandingLoading() {
  return <RouteGroupLoading />;
}

/**
 * VideoFacadeFactory — variant selector for the click-to-load YouTube facade
 * (Phase 3 Slice B, decision D-1: YouTube-nocookie).
 *
 * The facade is the performance AND consent story in one: no iframe exists
 * in the DOM until the user clicks (LCP untouched, nothing loads from
 * YouTube), and the click itself is the disclosure moment (the privacy note
 * sits under the play button). Ships dark: no talk has a video id yet; the
 * registry lights it up per talk per locale.
 */

import { VideoFacadeDefault, type VideoFacadeProps } from './variants/VideoFacadeDefault';

interface VideoFacadeFactoryProps extends VideoFacadeProps {
  variant?: 'default';
}

export function VideoFacadeFactory({ variant = 'default', ...props }: VideoFacadeFactoryProps) {
  switch (variant) {
    case 'default':
    default:
      return <VideoFacadeDefault {...props} />;
  }
}

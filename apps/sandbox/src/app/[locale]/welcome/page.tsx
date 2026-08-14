import { AuthWelcome } from '@/components/AuthWelcome';

/**
 * The public front door (A2; W-17c). Lives OUTSIDE the `(app)` group, so it is
 * ungated — the real R1 entry that replaces the MVP-0 password gate at go-live.
 * The AuthWelcome method buttons call the IAuthProvider seam; the real sign-in
 * is wired at the end (Auth.js). Until then the screen renders its honest UI
 * with a no-op handler.
 */
export default function WelcomePage() {
  return <AuthWelcome />;
}

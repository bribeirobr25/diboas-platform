import Link from 'next/link';
import { Button } from '@diboas/ui';

export default function NotFound() {
  return (
    <div className="error-page-container">
      <div className="error-page-content">
        <h1 className="error-page-title">404</h1>
        <h2 className="error-page-subtitle">Page Not Found</h2>
        <p className="error-page-description">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="error-page-actions">
          <Link href="/">
            <Button variant="primary" size="default">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
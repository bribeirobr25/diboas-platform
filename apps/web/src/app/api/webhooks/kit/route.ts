/**
 * Kit.com (ConvertKit) Webhook Handler
 *
 * Handles webhook events from Kit.com for:
 * - Subscriber creation (subscriber.created)
 * - Subscriber updates (subscriber.updated)
 * - Form submissions (form.subscribe)
 * - Tag additions (subscriber.tag_added)
 *
 * Security:
 * - Validates webhook signature using HMAC-SHA256
 * - Rate limiting to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getByEmail,
  updateEntry,
  updateKitSubscriberId,
  addTags,
} from '@/lib/waitingList/store';
import {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
  RateLimitPresets,
} from '@/lib/security';
import { Logger } from '@/lib/monitoring/Logger';

/**
 * Kit.com Webhook Event Types
 */
type KitWebhookEvent =
  | 'subscriber.created'
  | 'subscriber.updated'
  | 'subscriber.unsubscribed'
  | 'form.subscribe'
  | 'subscriber.tag_added'
  | 'subscriber.tag_removed';

/**
 * Kit.com Subscriber Data (from webhook payload)
 */
interface KitSubscriberData {
  id: number;
  email_address: string;
  first_name?: string;
  state: 'active' | 'inactive' | 'cancelled' | 'complained' | 'bounced';
  created_at: string;
  fields?: Record<string, string | number | boolean>;
}

/**
 * Kit.com Webhook Payload
 */
interface KitWebhookPayload {
  event: KitWebhookEvent;
  subscriber: KitSubscriberData;
  tag?: {
    id: number;
    name: string;
  };
  form?: {
    id: number;
    name: string;
  };
}

/**
 * Response type
 */
interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Verify Kit.com webhook signature
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/webhooks/kit
 * Handle Kit.com webhook events
 */
export async function POST(request: NextRequest): Promise<NextResponse<WebhookResponse>> {
  // Rate limiting for webhook endpoint
  const clientIP = getClientIP(request);
  const rateLimitResult = await checkRateLimit(
    `webhook-kit:${clientIP}`,
    RateLimitPresets.standard.limit,
    RateLimitPresets.standard.windowMs
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.KIT_WEBHOOK_SECRET;

    if (!webhookSecret) {
      Logger.warn('[Kit Webhook] KIT_WEBHOOK_SECRET not configured');
      // In development, allow webhooks without signature verification
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Webhook secret not configured' },
          { status: 500 }
        );
      }
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-kit-signature') || request.headers.get('x-convertkit-signature');

    // Verify signature in production
    if (webhookSecret && signature) {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        Logger.error('[Kit Webhook] Invalid signature');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const payload: KitWebhookPayload = JSON.parse(rawBody);

    Logger.info('[Kit Webhook] Received event', { event: payload.event });

    // Process based on event type
    switch (payload.event) {
      case 'subscriber.created':
      case 'form.subscribe':
        await handleSubscriberCreated(payload);
        break;

      case 'subscriber.updated':
        await handleSubscriberUpdated(payload);
        break;

      case 'subscriber.tag_added':
        await handleTagAdded(payload);
        break;

      case 'subscriber.unsubscribed':
        await handleUnsubscribed(payload);
        break;

      case 'subscriber.tag_removed':
        // Log but don't remove tags from our store
        Logger.info('[Kit Webhook] Tag removed', { tag: payload.tag?.name, email: payload.subscriber.email_address });
        break;

      default:
        Logger.info('[Kit Webhook] Unhandled event', { event: payload.event });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${payload.event}`,
    });
  } catch (error) {
    Logger.error('[Kit Webhook] Error', {}, error instanceof Error ? error : undefined);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle new subscriber creation
 */
async function handleSubscriberCreated(payload: KitWebhookPayload): Promise<void> {
  const { subscriber } = payload;
  const email = subscriber.email_address.toLowerCase();

  // Check if user exists in our store
  const existingEntry = getByEmail(email);

  if (existingEntry) {
    // Update with Kit subscriber ID
    updateKitSubscriberId(email, String(subscriber.id));
    Logger.info('[Kit Webhook] Updated subscriber ID', { email, subscriberId: subscriber.id });
  } else {
    // User signed up directly on Kit.com (not through our form)
    Logger.info('[Kit Webhook] New subscriber from Kit.com', { email });
    // We don't create entries for external signups - they need to go through our waitlist
  }
}

/**
 * Handle subscriber updates
 */
async function handleSubscriberUpdated(payload: KitWebhookPayload): Promise<void> {
  const { subscriber } = payload;
  const email = subscriber.email_address.toLowerCase();

  const existingEntry = getByEmail(email);

  if (existingEntry) {
    // Sync custom fields from Kit.com if available
    if (subscriber.fields) {
      const updates: Record<string, unknown> = {};

      // Map Kit.com custom fields to our fields
      if (subscriber.fields.waitlist_position) {
        updates.position = Number(subscriber.fields.waitlist_position);
      }
      if (subscriber.fields.referral_count) {
        updates.referralCount = Number(subscriber.fields.referral_count);
      }

      if (Object.keys(updates).length > 0) {
        updateEntry(email, updates as any);
        Logger.info('[Kit Webhook] Updated fields', { email, updates });
      }
    }
  }
}

/**
 * Handle tag additions
 */
async function handleTagAdded(payload: KitWebhookPayload): Promise<void> {
  const { subscriber, tag } = payload;

  if (!tag) return;

  const email = subscriber.email_address.toLowerCase();
  const existingEntry = getByEmail(email);

  if (existingEntry) {
    addTags(email, [tag.name]);
    Logger.info('[Kit Webhook] Added tag', { tag: tag.name, email });
  }
}

/**
 * Handle unsubscribe events
 */
async function handleUnsubscribed(payload: KitWebhookPayload): Promise<void> {
  const { subscriber } = payload;
  const email = subscriber.email_address.toLowerCase();

  const existingEntry = getByEmail(email);

  if (existingEntry) {
    // Add "unsubscribed" tag but don't remove from waitlist
    // They may still want early access, just no emails
    addTags(email, ['unsubscribed']);
    Logger.info('[Kit Webhook] Marked as unsubscribed', { email });
  }
}

/**
 * GET /api/webhooks/kit
 * Health check endpoint (does not reveal configuration status)
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Kit.com Webhook Handler',
  });
}

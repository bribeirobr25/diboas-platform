/**
 * Alert Delivery
 *
 * Channel-specific alert delivery handlers
 */

import { AlertCategory, type Alert } from './alertTypes';
import { MONITORING_CONFIG } from '@/config/monitoring';
import { getSlackColor, getSlackEmoji, formatDuration, EMAIL_SEVERITY_COLORS } from './alertUtils';

type SlackConfig = NonNullable<typeof MONITORING_CONFIG.alerts.channels.slack>;
type EmailConfig = NonNullable<typeof MONITORING_CONFIG.alerts.channels.email>;

/**
 * Deliver alert to all configured channels
 */
export async function deliverAlert(alert: Alert): Promise<void> {
  const promises: Promise<void>[] = [];

  // Slack delivery
  if (MONITORING_CONFIG.alerts.channels.slack) {
    const { slack } = MONITORING_CONFIG.alerts.channels;
    if ((alert.category === AlertCategory.PERFORMANCE && slack.enablePerformanceAlerts) ||
        (alert.category === AlertCategory.ERROR && slack.enableErrorAlerts)) {
      promises.push(sendToSlack(alert, slack));
    }
  }

  // Email delivery
  if (MONITORING_CONFIG.alerts.channels.email) {
    const { email } = MONITORING_CONFIG.alerts.channels;
    if ((alert.category === AlertCategory.PERFORMANCE && email.enablePerformanceAlerts) ||
        (alert.category === AlertCategory.ERROR && email.enableErrorAlerts)) {
      promises.push(sendToEmail(alert, email));
    }
  }

  // Wait for all deliveries
  await Promise.allSettled(promises);
}

/**
 * Send alert to Slack
 */
export async function sendToSlack(alert: Alert, config: SlackConfig): Promise<void> {
  const color = getSlackColor(alert.severity);
  const emoji = getSlackEmoji(alert.severity);

  const payload = {
    channel: config.channel,
    username: 'diBoaS Monitoring',
    icon_emoji: ':warning:',
    attachments: [{
      color,
      title: `${emoji} ${alert.title}`,
      text: alert.message,
      fields: [
        { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
        { title: 'Category', value: alert.category, short: true },
        { title: 'Source', value: alert.source, short: true },
        { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
      ],
      actions: alert.actionUrl ? [{
        type: 'button',
        text: 'View Details',
        url: alert.actionUrl
      }] : undefined,
      footer: 'diBoaS Monitoring',
      ts: Math.floor(alert.timestamp / 1000)
    }]
  };

  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Send alert to email
 */
export async function sendToEmail(alert: Alert, config: EmailConfig): Promise<void> {
  const payload = {
    to: config.recipients,
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    html: generateEmailHTML(alert),
    from: 'alerts@diboas.com'
  };

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Email API error: ${response.status} ${response.statusText}`);
  }
}

/**
 * Generate email HTML content
 */
export function generateEmailHTML(alert: Alert): string {
  const severityColor = EMAIL_SEVERITY_COLORS[alert.severity];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>diBoaS Alert</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; }
          .metadata { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .button { display: inline-block; background-color: ${severityColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${alert.title}</h1>
            <p>Severity: ${alert.severity.toUpperCase()}</p>
          </div>
          <div class="content">
            <p><strong>Message:</strong> ${alert.message}</p>
            <p><strong>Source:</strong> ${alert.source}</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>

            ${alert.actionUrl ? `<a href="${alert.actionUrl}" class="button">View Details</a>` : ''}

            <div class="metadata">
              <strong>Additional Information:</strong>
              <pre>${JSON.stringify(alert.metadata, null, 2)}</pre>
            </div>
          </div>
          <div class="footer">
            This alert was generated by diBoaS Monitoring System
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send resolution notification to Slack
 */
export async function sendResolutionNotification(
  alert: Alert,
  resolvedBy?: string
): Promise<void> {
  const config = MONITORING_CONFIG.alerts.channels.slack;
  if (!config) return;

  const payload = {
    channel: config.channel,
    username: 'diBoaS Monitoring',
    icon_emoji: ':white_check_mark:',
    text: `Alert resolved: ${alert.title}`,
    attachments: [{
      color: 'good',
      fields: [
        { title: 'Alert ID', value: alert.id, short: true },
        { title: 'Resolved By', value: resolvedBy || 'System', short: true },
        { title: 'Duration', value: formatDuration(Date.now() - alert.timestamp), short: true }
      ]
    }]
  };

  await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

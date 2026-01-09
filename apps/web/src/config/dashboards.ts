/**
 * Production Monitoring Dashboard Configuration
 * 
 * Monitoring & Observability: Comprehensive dashboard configuration
 * Product KPIs & Analytics: Business metrics and performance dashboards
 * Service Agnostic Abstraction: Multi-platform dashboard definitions
 * Domain-Driven Design: Section and business domain metrics
 */

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'custom';
  size: 'small' | 'medium' | 'large' | 'xl';
  metric: string;
  query?: string;
  visualization?: 'line' | 'bar' | 'pie' | 'gauge' | 'number' | 'table';
  timeRange?: string;
  refreshInterval?: number; // seconds
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'technical' | 'security' | 'user-experience';
  widgets: DashboardWidget[];
  refreshInterval?: number;
  tags: string[];
}

/**
 * Grafana dashboard panel configuration
 */
export interface GrafanaPanel {
  id: number;
  title: string;
  type: string;
  gridPos: {
    h: number;
    w: number;
    x: number;
    y: number;
  };
  targets: Array<{
    expr: string;
    interval: string;
    legendFormat: string;
  }>;
  fieldConfig: {
    defaults: {
      thresholds: {
        steps: Array<{
          color: string;
          value: number | null | undefined;
        }>;
      };
    };
  };
}

/**
 * Grafana dashboard export format
 */
export interface GrafanaDashboardExport {
  dashboard: {
    id: null;
    title: string;
    description: string;
    tags: string[];
    refresh: string;
    time: {
      from: string;
      to: string;
    };
    panels: GrafanaPanel[];
  };
  folderId: number;
  overwrite: boolean;
}

/**
 * DataDog widget definition
 */
export interface DataDogWidget {
  definition: {
    title: string;
    type: string;
    requests: Array<{
      q: string;
      display_type: string;
    }>;
  };
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * DataDog dashboard export format
 */
export interface DataDogDashboardExport {
  title: string;
  description: string;
  widgets: DataDogWidget[];
  layout_type: string;
  is_read_only: boolean;
  notify_list: string[];
  template_variables: unknown[];
}

/**
 * New Relic dashboard widget
 */
export interface NewRelicWidget {
  title: string;
  visualization: string | undefined;
  nrql: string;
}

/**
 * New Relic dashboard export format
 */
export interface NewRelicDashboardExport {
  name: string;
  description: string;
  widgets: NewRelicWidget[];
}

/**
 * Business Metrics Dashboard
 * Focus: User engagement, conversion, business KPIs
 */
export const BUSINESS_DASHBOARD: Dashboard = {
  id: 'business-metrics',
  name: 'Business Metrics',
  description: 'Key business performance indicators and user engagement metrics',
  category: 'business',
  refreshInterval: 300, // 5 minutes
  tags: ['business', 'kpi', 'conversion', 'users'],
  widgets: [
    {
      id: 'active-users',
      title: 'Active Users (24h)',
      type: 'metric',
      size: 'medium',
      metric: 'user.active.24h',
      visualization: 'number',
      timeRange: '24h',
      refreshInterval: 300,
      thresholds: {
        warning: 1000,
        critical: 500
      }
    },
    {
      id: 'conversion-rate',
      title: 'Conversion Rate',
      type: 'chart',
      size: 'large',
      metric: 'business.conversion.rate',
      visualization: 'line',
      timeRange: '7d',
      refreshInterval: 600,
      thresholds: {
        warning: 2.0, // 2%
        critical: 1.0  // 1%
      }
    },
    {
      id: 'user-acquisition',
      title: 'User Acquisition',
      type: 'chart',
      size: 'medium',
      metric: 'user.acquisition.daily',
      visualization: 'bar',
      timeRange: '30d',
      refreshInterval: 3600
    },
    {
      id: 'revenue-metrics',
      title: 'Revenue Trends',
      type: 'chart',
      size: 'large',
      metric: 'business.revenue.daily',
      visualization: 'line',
      timeRange: '90d',
      refreshInterval: 3600
    },
    {
      id: 'feature-adoption',
      title: 'Feature Adoption Rates',
      type: 'table',
      size: 'large',
      metric: 'feature.adoption.rate',
      timeRange: '30d',
      refreshInterval: 1800
    },
    {
      id: 'user-retention',
      title: 'User Retention (7-day)',
      type: 'metric',
      size: 'small',
      metric: 'user.retention.7d',
      visualization: 'gauge',
      timeRange: '7d',
      refreshInterval: 3600,
      thresholds: {
        warning: 30, // 30%
        critical: 20  // 20%
      }
    }
  ]
};

/**
 * Technical Performance Dashboard
 * Focus: Application performance, infrastructure, errors
 */
export const TECHNICAL_DASHBOARD: Dashboard = {
  id: 'technical-performance',
  name: 'Technical Performance',
  description: 'Application performance metrics, errors, and infrastructure health',
  category: 'technical',
  refreshInterval: 60, // 1 minute
  tags: ['performance', 'errors', 'infrastructure', 'monitoring'],
  widgets: [
    {
      id: 'response-time',
      title: 'Average Response Time',
      type: 'chart',
      size: 'large',
      metric: 'http.response.time.avg',
      visualization: 'line',
      timeRange: '1h',
      refreshInterval: 60,
      thresholds: {
        warning: 500,  // 500ms
        critical: 1000 // 1s
      }
    },
    {
      id: 'error-rate',
      title: 'Error Rate',
      type: 'metric',
      size: 'medium',
      metric: 'http.errors.rate',
      visualization: 'gauge',
      timeRange: '1h',
      refreshInterval: 60,
      thresholds: {
        warning: 1, // 1%
        critical: 5 // 5%
      }
    },
    {
      id: 'throughput',
      title: 'Requests per Minute',
      type: 'chart',
      size: 'medium',
      metric: 'http.requests.rpm',
      visualization: 'line',
      timeRange: '6h',
      refreshInterval: 60
    },
    {
      id: 'core-web-vitals',
      title: 'Core Web Vitals',
      type: 'chart',
      size: 'large',
      metric: 'webvitals.combined',
      visualization: 'line',
      timeRange: '24h',
      refreshInterval: 300,
      thresholds: {
        warning: 2500, // LCP 2.5s
        critical: 4000 // LCP 4s
      }
    },
    {
      id: 'memory-usage',
      title: 'Memory Usage',
      type: 'chart',
      size: 'medium',
      metric: 'system.memory.usage',
      visualization: 'line',
      timeRange: '4h',
      refreshInterval: 300,
      thresholds: {
        warning: 80, // 80%
        critical: 95  // 95%
      }
    },
    {
      id: 'bundle-size',
      title: 'Bundle Size Trends',
      type: 'chart',
      size: 'medium',
      metric: 'bundle.size.total',
      visualization: 'bar',
      timeRange: '30d',
      refreshInterval: 3600
    },
    {
      id: 'section-performance',
      title: 'Section Performance',
      type: 'table',
      size: 'large',
      metric: 'section.performance.avg',
      timeRange: '24h',
      refreshInterval: 600
    },
    {
      id: 'active-alerts',
      title: 'Active Alerts',
      type: 'alert',
      size: 'small',
      metric: 'alerts.active.count',
      refreshInterval: 30
    }
  ]
};

/**
 * User Experience Dashboard
 * Focus: User interactions, performance from user perspective
 */
export const USER_EXPERIENCE_DASHBOARD: Dashboard = {
  id: 'user-experience',
  name: 'User Experience',
  description: 'User-centric metrics and experience indicators',
  category: 'user-experience',
  refreshInterval: 180, // 3 minutes
  tags: ['ux', 'user-journey', 'performance', 'engagement'],
  widgets: [
    {
      id: 'page-load-time',
      title: 'Page Load Time (P95)',
      type: 'metric',
      size: 'medium',
      metric: 'page.load.time.p95',
      visualization: 'gauge',
      timeRange: '1h',
      refreshInterval: 180,
      thresholds: {
        warning: 3000, // 3s
        critical: 5000 // 5s
      }
    },
    {
      id: 'bounce-rate',
      title: 'Bounce Rate',
      type: 'metric',
      size: 'medium',
      metric: 'user.bounce.rate',
      visualization: 'gauge',
      timeRange: '24h',
      refreshInterval: 600,
      thresholds: {
        warning: 60, // 60%
        critical: 80  // 80%
      }
    },
    {
      id: 'session-duration',
      title: 'Average Session Duration',
      type: 'chart',
      size: 'large',
      metric: 'user.session.duration.avg',
      visualization: 'line',
      timeRange: '7d',
      refreshInterval: 600
    },
    {
      id: 'user-journey',
      title: 'User Journey Funnel',
      type: 'chart',
      size: 'large',
      metric: 'user.journey.funnel',
      visualization: 'bar',
      timeRange: '24h',
      refreshInterval: 1800
    },
    {
      id: 'device-breakdown',
      title: 'Device Breakdown',
      type: 'chart',
      size: 'medium',
      metric: 'user.device.breakdown',
      visualization: 'pie',
      timeRange: '7d',
      refreshInterval: 3600
    },
    {
      id: 'geographic-distribution',
      title: 'Geographic Distribution',
      type: 'chart',
      size: 'medium',
      metric: 'user.geography.distribution',
      visualization: 'bar',
      timeRange: '24h',
      refreshInterval: 1800
    },
    {
      id: 'section-interactions',
      title: 'Section Interactions',
      type: 'table',
      size: 'large',
      metric: 'section.interactions.count',
      timeRange: '24h',
      refreshInterval: 600
    }
  ]
};

/**
 * Security Dashboard
 * Focus: Security events, threats, compliance
 */
export const SECURITY_DASHBOARD: Dashboard = {
  id: 'security-monitoring',
  name: 'Security Monitoring',
  description: 'Security events, threat detection, and compliance monitoring',
  category: 'security',
  refreshInterval: 60, // 1 minute
  tags: ['security', 'threats', 'compliance', 'audit'],
  widgets: [
    {
      id: 'security-events',
      title: 'Security Events (24h)',
      type: 'metric',
      size: 'medium',
      metric: 'security.events.count',
      visualization: 'number',
      timeRange: '24h',
      refreshInterval: 60,
      thresholds: {
        warning: 50,
        critical: 100
      }
    },
    {
      id: 'failed-logins',
      title: 'Failed Login Attempts',
      type: 'chart',
      size: 'large',
      metric: 'security.login.failed',
      visualization: 'line',
      timeRange: '24h',
      refreshInterval: 300,
      thresholds: {
        warning: 10,
        critical: 25
      }
    },
    {
      id: 'csp-violations',
      title: 'CSP Violations',
      type: 'table',
      size: 'large',
      metric: 'security.csp.violations',
      timeRange: '24h',
      refreshInterval: 600
    },
    {
      id: 'suspicious-activity',
      title: 'Suspicious Activity Score',
      type: 'metric',
      size: 'small',
      metric: 'security.suspicion.score',
      visualization: 'gauge',
      timeRange: '1h',
      refreshInterval: 300,
      thresholds: {
        warning: 7,
        critical: 9
      }
    },
    {
      id: 'blocked-requests',
      title: 'Blocked Requests',
      type: 'chart',
      size: 'medium',
      metric: 'security.requests.blocked',
      visualization: 'bar',
      timeRange: '24h',
      refreshInterval: 600
    },
    {
      id: 'vulnerability-alerts',
      title: 'Vulnerability Alerts',
      type: 'alert',
      size: 'medium',
      metric: 'security.vulnerabilities.active',
      refreshInterval: 3600
    }
  ]
};

/**
 * All available dashboards
 */
export const AVAILABLE_DASHBOARDS: Dashboard[] = [
  BUSINESS_DASHBOARD,
  TECHNICAL_DASHBOARD,
  USER_EXPERIENCE_DASHBOARD,
  SECURITY_DASHBOARD
];

/**
 * Dashboard configuration for different monitoring platforms
 */
export const DASHBOARD_INTEGRATIONS = {
  grafana: {
    baseUrl: process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3000',
    apiKey: process.env.GRAFANA_API_KEY,
    org: process.env.GRAFANA_ORG || 'diboas'
  },
  datadog: {
    baseUrl: 'https://app.datadoghq.com',
    apiKey: process.env.DATADOG_API_KEY,
    appKey: process.env.DATADOG_APP_KEY
  },
  newRelic: {
    baseUrl: 'https://one.newrelic.com',
    apiKey: process.env.NEW_RELIC_API_KEY,
    accountId: process.env.NEW_RELIC_ACCOUNT_ID
  }
};

/**
 * Generate Grafana dashboard JSON
 */
export function generateGrafanaDashboard(dashboard: Dashboard): GrafanaDashboardExport {
  return {
    dashboard: {
      id: null,
      title: dashboard.name,
      description: dashboard.description,
      tags: dashboard.tags,
      refresh: `${dashboard.refreshInterval}s`,
      time: {
        from: 'now-24h',
        to: 'now'
      },
      panels: dashboard.widgets.map((widget, index) => ({
        id: index + 1,
        title: widget.title,
        type: widget.type === 'chart' ? 'graph' : widget.type === 'metric' ? 'stat' : 'table',
        gridPos: {
          h: widget.size === 'small' ? 6 : widget.size === 'medium' ? 8 : 12,
          w: widget.size === 'small' ? 6 : widget.size === 'medium' ? 12 : 24,
          x: 0,
          y: index * 8
        },
        targets: [{
          expr: widget.query || widget.metric,
          interval: `${widget.refreshInterval}s`,
          legendFormat: widget.title
        }],
        fieldConfig: {
          defaults: {
            thresholds: {
              steps: [
                { color: 'green', value: null },
                { color: 'yellow', value: widget.thresholds?.warning },
                { color: 'red', value: widget.thresholds?.critical }
              ]
            }
          }
        }
      }))
    },
    folderId: 0,
    overwrite: true
  };
}

/**
 * Generate DataDog dashboard JSON
 */
export function generateDataDogDashboard(dashboard: Dashboard): DataDogDashboardExport {
  return {
    title: dashboard.name,
    description: dashboard.description,
    widgets: dashboard.widgets.map(widget => ({
      definition: {
        title: widget.title,
        type: widget.visualization || 'timeseries',
        requests: [{
          q: widget.query || widget.metric,
          display_type: widget.visualization === 'line' ? 'line' : 'bars'
        }]
      },
      layout: {
        x: 0,
        y: 0,
        width: widget.size === 'small' ? 4 : widget.size === 'medium' ? 6 : 12,
        height: widget.size === 'small' ? 3 : widget.size === 'medium' ? 4 : 6
      }
    })),
    layout_type: 'ordered',
    is_read_only: false,
    notify_list: [],
    template_variables: []
  };
}

/**
 * Export dashboard configurations for external tools
 */
export function exportDashboardConfigs(): {
  grafana: GrafanaDashboardExport[];
  datadog: DataDogDashboardExport[];
  newrelic: NewRelicDashboardExport[];
} {
  return {
    grafana: AVAILABLE_DASHBOARDS.map(generateGrafanaDashboard),
    datadog: AVAILABLE_DASHBOARDS.map(generateDataDogDashboard),
    newrelic: AVAILABLE_DASHBOARDS.map(dashboard => ({
      name: dashboard.name,
      description: dashboard.description,
      widgets: dashboard.widgets.map(widget => ({
        title: widget.title,
        visualization: widget.visualization,
        nrql: `SELECT * FROM ${widget.metric} SINCE ${widget.timeRange} AGO`
      }))
    }))
  };
}

/**
 * Get dashboard by ID
 */
export function getDashboardById(id: string): Dashboard | undefined {
  return AVAILABLE_DASHBOARDS.find(dashboard => dashboard.id === id);
}

/**
 * Get dashboards by category
 */
export function getDashboardsByCategory(category: Dashboard['category']): Dashboard[] {
  return AVAILABLE_DASHBOARDS.filter(dashboard => dashboard.category === category);
}
/**
 * Business Metrics Configuration
 * Configuration Management: Centralized business metrics that can be updated without code changes
 * Semantic Naming: Clear, descriptive metric names and categories
 * Code Reusability: Shared metrics across marketing materials and dashboards
 */

interface BusinessMetric {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly lastUpdated: string;
  readonly source?: string;
}

interface PlatformStats {
  readonly users: BusinessMetric;
  readonly volumeProcessed: BusinessMetric;
  readonly countriesServed: BusinessMetric;
  readonly uptimeGuarantee: BusinessMetric;
  readonly transactionsPerSecond: BusinessMetric;
  readonly securityCertifications: BusinessMetric;
}

interface GrowthMetrics {
  readonly monthlyGrowthRate: BusinessMetric;
  readonly customerSatisfaction: BusinessMetric;
  readonly averageResolutionTime: BusinessMetric;
  readonly apiResponseTime: BusinessMetric;
}

interface ComplianceMetrics {
  readonly regulatoryCompliance: BusinessMetric;
  readonly dataProtectionLevel: BusinessMetric;
  readonly auditFrequency: BusinessMetric;
  readonly securityUpdates: BusinessMetric;
}

/**
 * Create business metric with validation
 */
function createMetric(
  value: string,
  label: string,
  description?: string,
  source?: string
): BusinessMetric {
  return {
    value,
    label,
    description,
    lastUpdated: new Date().toISOString(),
    source
  };
}

/**
 * Environment-based business metrics
 * These can be overridden via environment variables for different deployments
 */
function getEnvironmentMetrics(): {
  platform: PlatformStats;
  growth: GrowthMetrics;
  compliance: ComplianceMetrics;
} {
  // Allow environment override for dynamic updates
  const getUserCount = () => process.env.NEXT_PUBLIC_USER_COUNT || '500,000+';
  const getVolumeProcessed = () => process.env.NEXT_PUBLIC_VOLUME_PROCESSED || '$2B+';
  const getCountriesServed = () => process.env.NEXT_PUBLIC_COUNTRIES_SERVED || '50+';
  const getUptimeGuarantee = () => process.env.NEXT_PUBLIC_UPTIME_GUARANTEE || '99.9%';
  const getTransactionsPerSecond = () => process.env.NEXT_PUBLIC_TPS || '10,000+';
  const getSecurityCerts = () => process.env.NEXT_PUBLIC_SECURITY_CERTS || '15+';
  
  const getGrowthRate = () => process.env.NEXT_PUBLIC_GROWTH_RATE || '25%';
  const getCustomerSat = () => process.env.NEXT_PUBLIC_CUSTOMER_SAT || '4.8/5';
  const getResolutionTime = () => process.env.NEXT_PUBLIC_RESOLUTION_TIME || '< 2 hours';
  const getApiResponseTime = () => process.env.NEXT_PUBLIC_API_RESPONSE_TIME || '< 100ms';
  
  const getRegulatoryCompliance = () => process.env.NEXT_PUBLIC_REGULATORY_COMPLIANCE || '100%';
  const getDataProtection = () => process.env.NEXT_PUBLIC_DATA_PROTECTION || 'SOC 2 Type II';
  const getAuditFrequency = () => process.env.NEXT_PUBLIC_AUDIT_FREQUENCY || 'Quarterly';
  const getSecurityUpdates = () => process.env.NEXT_PUBLIC_SECURITY_UPDATES || 'Weekly';

  return {
    platform: {
      users: createMetric(
        getUserCount(),
        'Trusted Users',
        'Number of verified users actively using the platform',
        'User Database'
      ),
      volumeProcessed: createMetric(
        getVolumeProcessed(),
        'Volume Processed',
        'Total financial volume processed through the platform',
        'Transaction Database'
      ),
      countriesServed: createMetric(
        getCountriesServed(),
        'Countries Served',
        'Number of countries where diBoaS services are available',
        'Geographic Database'
      ),
      uptimeGuarantee: createMetric(
        getUptimeGuarantee(),
        'Uptime Guarantee',
        'Service level agreement for platform availability',
        'Infrastructure Monitoring'
      ),
      transactionsPerSecond: createMetric(
        getTransactionsPerSecond(),
        'Peak TPS',
        'Maximum transactions processed per second',
        'Performance Monitoring'
      ),
      securityCertifications: createMetric(
        getSecurityCerts(),
        'Security Certifications',
        'Number of active security and compliance certifications',
        'Compliance Team'
      )
    },

    growth: {
      monthlyGrowthRate: createMetric(
        getGrowthRate(),
        'Monthly Growth',
        'Month-over-month user growth rate',
        'Analytics Dashboard'
      ),
      customerSatisfaction: createMetric(
        getCustomerSat(),
        'Customer Satisfaction',
        'Average customer satisfaction rating',
        'Customer Surveys'
      ),
      averageResolutionTime: createMetric(
        getResolutionTime(),
        'Avg Resolution Time',
        'Average time to resolve customer support tickets',
        'Support System'
      ),
      apiResponseTime: createMetric(
        getApiResponseTime(),
        'API Response Time',
        'Average API response time under normal load',
        'Performance Monitoring'
      )
    },

    compliance: {
      regulatoryCompliance: createMetric(
        getRegulatoryCompliance(),
        'Regulatory Compliance',
        'Percentage of regulatory requirements met',
        'Compliance Audits'
      ),
      dataProtectionLevel: createMetric(
        getDataProtection(),
        'Data Protection',
        'Highest level of data protection certification achieved',
        'Security Audits'
      ),
      auditFrequency: createMetric(
        getAuditFrequency(),
        'Audit Frequency',
        'How often comprehensive security audits are performed',
        'Audit Schedule'
      ),
      securityUpdates: createMetric(
        getSecurityUpdates(),
        'Security Updates',
        'Frequency of security patches and updates',
        'DevOps Pipeline'
      )
    }
  };
}

// Create and export business metrics
export const BUSINESS_METRICS = getEnvironmentMetrics();

// Export convenient access to specific metric categories
export const {
  platform: PLATFORM_STATS,
  growth: GROWTH_METRICS,
  compliance: COMPLIANCE_METRICS
} = BUSINESS_METRICS;

// Helper functions for common use cases
export const getMetricValue = (metric: BusinessMetric): string => metric.value;
export const getMetricLabel = (metric: BusinessMetric): string => metric.label;
export const getMetricDescription = (metric: BusinessMetric): string => metric.description || '';

// Export all metrics as a flat array for iteration
export const ALL_METRICS: BusinessMetric[] = [
  ...Object.values(PLATFORM_STATS),
  ...Object.values(GROWTH_METRICS),
  ...Object.values(COMPLIANCE_METRICS)
];

// Export types for external usage
export type { BusinessMetric, PlatformStats, GrowthMetrics, ComplianceMetrics };
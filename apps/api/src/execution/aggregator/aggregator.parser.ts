import { logger } from '../../utils/logger';

export interface AggregatorConfig {
  arrayPath: string;
  nameField: string;
  statusField: string;
  statusCodeField?: string;
  responseTimeField?: string;
  errorField?: string;
  successValues: string[];
}

export interface SubMonitorResult {
  name: string;
  success: boolean;
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  rawData: any;
}

export class AggregatorParser {
  /**
   * Parse aggregator response and extract sub-monitor results
   */
  parseResponse(
    responseData: any,
    config: AggregatorConfig
  ): SubMonitorResult[] {
    try {
      // Extract array from response using arrayPath
      const array = this.getNestedValue(responseData, config.arrayPath);

      if (!Array.isArray(array)) {
        logger.error(`Aggregator arrayPath "${config.arrayPath}" did not resolve to an array`);
        return [];
      }

      // Parse each item in the array
      return array.map((item) => this.parseSubMonitor(item, config));
    } catch (error) {
      logger.error('Failed to parse aggregator response:', error);
      return [];
    }
  }

  /**
   * Parse individual sub-monitor from array item
   */
  private parseSubMonitor(
    item: any,
    config: AggregatorConfig
  ): SubMonitorResult {
    const name = this.getNestedValue(item, config.nameField) || 'Unknown';
    const status = this.getNestedValue(item, config.statusField);
    const statusCode = config.statusCodeField
      ? this.getNestedValue(item, config.statusCodeField)
      : null;
    const responseTimeMs = config.responseTimeField
      ? this.getNestedValue(item, config.responseTimeField)
      : null;
    const errorMessage = config.errorField
      ? this.getNestedValue(item, config.errorField)
      : null;

    // Determine success based on status field and successValues
    const success = status
      ? config.successValues.includes(String(status).toLowerCase())
      : false;

    return {
      name,
      success,
      statusCode: statusCode ? Number(statusCode) : null,
      responseTimeMs: responseTimeMs ? Number(responseTimeMs) : null,
      errorMessage: errorMessage ? String(errorMessage) : null,
      rawData: item,
    };
  }

  /**
   * Get nested value from object using dot notation
   * e.g., "data.items" -> obj.data.items
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * Calculate overall status for aggregator monitor
   * Returns: UP if all sub-monitors are up, DOWN if all are down, DEGRADED if mixed
   */
  calculateOverallStatus(results: SubMonitorResult[]): 'UP' | 'DOWN' | 'DEGRADED' {
    if (results.length === 0) {
      return 'DOWN';
    }

    const upCount = results.filter((r) => r.success).length;
    const downCount = results.length - upCount;

    if (upCount === results.length) {
      return 'UP';
    } else if (downCount === results.length) {
      return 'DOWN';
    } else {
      return 'DEGRADED';
    }
  }
}

export const aggregatorParser = new AggregatorParser();

import axios from 'axios';
import { RCADetails, RCACategory } from '@pulse/shared';
import { logger } from '../../utils/logger';
import * as dns from 'dns/promises';
import * as tls from 'tls';
import * as net from 'net';

export interface CheckResult {
  success: boolean;
  responseTimeMs: number;
  statusCode?: number;
  errorCategory?: RCACategory;
  errorMessage?: string;
  rcaDetails: RCADetails;
}

export class HttpChecker {
  /**
   * Execute a complete HTTP check with RCA
   */
  async check(
    url: string,
    method: string = 'GET',
    timeoutMs: number = 30000,
    expectedStatus: number = 200,
    keyword?: string,
    headers?: Record<string, string>
  ): Promise<CheckResult> {
    const startTime = Date.now();
    const urlObj = new URL(url);

    const rcaDetails: RCADetails = {
      category: RCACategory.UNKNOWN_ERROR,
      message: '',
      timestamp: new Date().toISOString(),
      phases: {},
      totalDurationMs: 0,
    };

    try {
      // Phase 1: DNS Resolution
      const dnsStart = Date.now();
      try {
        const addresses = await dns.resolve4(urlObj.hostname);
        rcaDetails.phases.dns = {
          durationMs: Date.now() - dnsStart,
          resolvedIp: addresses[0],
          success: true,
        };
      } catch (dnsError: any) {
        rcaDetails.phases.dns = {
          durationMs: Date.now() - dnsStart,
          success: false,
          error: dnsError.message,
        };
        rcaDetails.category = RCACategory.DNS_FAILURE;
        rcaDetails.message = `DNS resolution failed: ${dnsError.message}`;
        rcaDetails.totalDurationMs = Date.now() - startTime;

        return {
          success: false,
          responseTimeMs: Date.now() - startTime,
          errorCategory: rcaDetails.category,
          errorMessage: rcaDetails.message,
          rcaDetails,
        };
      }

      // Phase 2: TCP Connection (if HTTPS)
      if (urlObj.protocol === 'https:') {
        const tcpStart = Date.now();
        try {
          await this.checkTcpConnection(urlObj.hostname, 443);
          rcaDetails.phases.tcp = {
            durationMs: Date.now() - tcpStart,
            success: true,
          };
        } catch (tcpError: any) {
          rcaDetails.phases.tcp = {
            durationMs: Date.now() - tcpStart,
            success: false,
            error: tcpError.message,
          };
          rcaDetails.category = RCACategory.CONNECTION_REFUSED;
          rcaDetails.message = `TCP connection failed: ${tcpError.message}`;
          rcaDetails.totalDurationMs = Date.now() - startTime;

          return {
            success: false,
            responseTimeMs: Date.now() - startTime,
            errorCategory: rcaDetails.category,
            errorMessage: rcaDetails.message,
            rcaDetails,
          };
        }

        // Phase 3: TLS/SSL Check
        const tlsStart = Date.now();
        try {
          const tlsInfo = await this.checkTls(urlObj.hostname, 443);
          rcaDetails.phases.tls = {
            durationMs: Date.now() - tlsStart,
            success: true,
            ...tlsInfo,
          };
        } catch (tlsError: any) {
          rcaDetails.phases.tls = {
            durationMs: Date.now() - tlsStart,
            success: false,
            error: tlsError.message,
          };
          rcaDetails.category = RCACategory.SSL_HANDSHAKE_FAILED;
          rcaDetails.message = `TLS handshake failed: ${tlsError.message}`;
          rcaDetails.totalDurationMs = Date.now() - startTime;

          return {
            success: false,
            responseTimeMs: Date.now() - startTime,
            errorCategory: rcaDetails.category,
            errorMessage: rcaDetails.message,
            rcaDetails,
          };
        }
      }

      // Phase 4: HTTP Request
      const httpStart = Date.now();
      try {
        const response = await axios({
          method: method as any,
          url,
          headers: {
            'User-Agent': 'Pulse-Monitor/1.0',
            ...headers,
          },
          timeout: timeoutMs,
          validateStatus: () => true, // Don't throw on any status code
          maxRedirects: 5,
        });

        const httpDuration = Date.now() - httpStart;
        const responseBodyPreview = typeof response.data === 'string'
          ? response.data.substring(0, 200)
          : JSON.stringify(response.data).substring(0, 200);

        rcaDetails.phases.http = {
          durationMs: httpDuration,
          statusCode: response.status,
          statusText: response.statusText,
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length'] ? parseInt(response.headers['content-length']) : undefined,
          server: response.headers['server'],
          responseBodyPreview,
          success: true,
        };

        // Check status code
        if (response.status !== expectedStatus) {
          if (response.status >= 500) {
            rcaDetails.category = RCACategory.HTTP_5XX;
            rcaDetails.message = `Server returned ${response.status} ${response.statusText}`;
          } else if (response.status >= 400) {
            rcaDetails.category = RCACategory.HTTP_4XX;
            rcaDetails.message = `Client error ${response.status} ${response.statusText}`;
          } else {
            rcaDetails.category = RCACategory.HTTP_UNEXPECTED_STATUS;
            rcaDetails.message = `Unexpected status ${response.status}, expected ${expectedStatus}`;
          }
          rcaDetails.totalDurationMs = Date.now() - startTime;

          return {
            success: false,
            responseTimeMs: Date.now() - startTime,
            statusCode: response.status,
            errorCategory: rcaDetails.category,
            errorMessage: rcaDetails.message,
            rcaDetails,
          };
        }

        // Phase 5: Keyword Check (if specified)
        if (keyword) {
          const body = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          const found = body.includes(keyword);

          rcaDetails.phases.keyword = {
            expected: keyword,
            found,
            success: found,
          };

          if (!found) {
            rcaDetails.category = RCACategory.KEYWORD_MISSING;
            rcaDetails.message = `Expected keyword "${keyword}" not found in response`;
            rcaDetails.totalDurationMs = Date.now() - startTime;

            return {
              success: false,
              responseTimeMs: Date.now() - startTime,
              statusCode: response.status,
              errorCategory: rcaDetails.category,
              errorMessage: rcaDetails.message,
              rcaDetails,
            };
          }
        }

        // Success!
        rcaDetails.category = RCACategory.UNKNOWN_ERROR; // This will be ignored
        rcaDetails.message = 'Check passed successfully';
        rcaDetails.totalDurationMs = Date.now() - startTime;

        return {
          success: true,
          responseTimeMs: Date.now() - startTime,
          statusCode: response.status,
          rcaDetails,
        };

      } catch (httpError: any) {
        const httpDuration = Date.now() - httpStart;

        rcaDetails.phases.http = {
          durationMs: httpDuration,
          success: false,
          error: httpError.message,
        };

        // Categorize HTTP errors
        if (httpError.code === 'ECONNABORTED' || httpError.code === 'ETIMEDOUT') {
          rcaDetails.category = RCACategory.TIMEOUT;
          rcaDetails.message = `Request timed out after ${timeoutMs}ms`;
        } else if (httpError.code === 'ECONNREFUSED') {
          rcaDetails.category = RCACategory.CONNECTION_REFUSED;
          rcaDetails.message = 'Connection refused';
        } else if (httpError.code === 'ECONNRESET') {
          rcaDetails.category = RCACategory.CONNECTION_RESET;
          rcaDetails.message = 'Connection reset';
        } else {
          rcaDetails.category = RCACategory.NETWORK_ERROR;
          rcaDetails.message = `Network error: ${httpError.message}`;
        }

        rcaDetails.totalDurationMs = Date.now() - startTime;

        return {
          success: false,
          responseTimeMs: Date.now() - startTime,
          errorCategory: rcaDetails.category,
          errorMessage: rcaDetails.message,
          rcaDetails,
        };
      }

    } catch (error: any) {
      logger.error('Unexpected error in HTTP checker:', error);
      rcaDetails.category = RCACategory.UNKNOWN_ERROR;
      rcaDetails.message = `Unexpected error: ${error.message}`;
      rcaDetails.totalDurationMs = Date.now() - startTime;

      return {
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorCategory: rcaDetails.category,
        errorMessage: rcaDetails.message,
        rcaDetails,
      };
    }
  }

  /**
   * Check TCP connection
   */
  private checkTcpConnection(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = 10000;

      socket.setTimeout(timeout);
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('timeout', () => {
        socket.destroy();
        reject(new Error('TCP connection timeout'));
      });
      socket.once('error', (err) => {
        socket.destroy();
        reject(err);
      });

      socket.connect(port, host);
    });
  }

  /**
   * Check TLS/SSL certificate
   */
  private checkTls(host: string, port: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = tls.connect(port, host, {
        servername: host,
        rejectUnauthorized: false, // We'll check manually
      });

      socket.once('secureConnect', () => {
        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol();
        const cipher = socket.getCipher();

        const tlsInfo = {
          protocol,
          cipher: cipher?.name,
          certValid: socket.authorized,
          certExpires: cert.valid_to,
          certIssuer: cert.issuer?.O,
        };

        socket.destroy();
        resolve(tlsInfo);
      });

      socket.once('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
  }
}

export const httpChecker = new HttpChecker();

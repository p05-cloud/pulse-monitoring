export enum RCACategory {
  DNS_FAILURE = 'DNS_FAILURE',
  DNS_TIMEOUT = 'DNS_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_RESET = 'CONNECTION_RESET',
  SSL_CERTIFICATE_EXPIRED = 'SSL_CERTIFICATE_EXPIRED',
  SSL_CERTIFICATE_INVALID = 'SSL_CERTIFICATE_INVALID',
  SSL_HOSTNAME_MISMATCH = 'SSL_HOSTNAME_MISMATCH',
  SSL_HANDSHAKE_FAILED = 'SSL_HANDSHAKE_FAILED',
  HTTP_4XX = 'HTTP_4XX',
  HTTP_5XX = 'HTTP_5XX',
  HTTP_UNEXPECTED_STATUS = 'HTTP_UNEXPECTED_STATUS',
  TIMEOUT = 'TIMEOUT',
  KEYWORD_MISSING = 'KEYWORD_MISSING',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface DNSPhase {
  durationMs: number;
  resolvedIp?: string;
  success: boolean;
  error?: string;
}

export interface TCPPhase {
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface TLSPhase {
  durationMs: number;
  protocol?: string;
  cipher?: string;
  certValid?: boolean;
  certExpires?: string;
  certIssuer?: string;
  success: boolean;
  error?: string;
}

export interface HTTPPhase {
  durationMs: number;
  statusCode?: number;
  statusText?: string;
  contentType?: string;
  contentLength?: number;
  server?: string;
  responseBodyPreview?: string;
  success: boolean;
  error?: string;
}

export interface KeywordPhase {
  expected: string;
  found: boolean;
  success: boolean;
}

export interface RCADetails {
  category: RCACategory;
  message: string;
  timestamp: string;
  phases: {
    dns?: DNSPhase;
    tcp?: TCPPhase;
    tls?: TLSPhase;
    http?: HTTPPhase;
    keyword?: KeywordPhase;
  };
  totalDurationMs: number;
}

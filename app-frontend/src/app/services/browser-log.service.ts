import { Injectable } from '@angular/core';

export type BrowserLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface BrowserLogEntry {
  level: BrowserLogLevel;
  message: string;
  data?: unknown;
  url: string;
  userAgent: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class BrowserLogService {
  private readonly endpoint = 'http://127.0.0.1:3333/log';

  debug(message: string, data?: unknown): void {
    this.send('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.send('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.send('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.send('error', message, data);
  }

  private send(level: BrowserLogLevel, message: string, data?: unknown): void {
    const entry: BrowserLogEntry = {
      level,
      message,
      data: this.serializeData(data),
      url: window.location.href,
      userAgent: window.navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(entry),
      keepalive: true,
    }).catch(() => {
      // Logging must never break the app.
    });
  }

  private serializeData(data: unknown): unknown {
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    }

    try {
      JSON.stringify(data);
      return data;
    } catch {
      return String(data);
    }
  }
}

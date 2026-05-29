import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { defineCustomElements as defineJeepSqliteElements } from 'jeep-sqlite/loader';

defineJeepSqliteElements(window);

const logBrowserEvent = (message: string, data?: unknown) => {
  fetch('http://127.0.0.1:3333/log', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      level: 'error',
      message,
      data,
      url: window.location.href,
      userAgent: window.navigator.userAgent,
      timestamp: new Date().toISOString(),
    }),
    keepalive: true,
  }).catch(() => {
    // Logging must not block app startup.
  });
};

window.addEventListener('error', event => {
  logBrowserEvent('window.error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error instanceof Error ? {
      name: event.error.name,
      message: event.error.message,
      stack: event.error.stack,
    } : String(event.error),
  });
});

window.addEventListener('unhandledrejection', event => {
  const reason = event.reason;
  logBrowserEvent('window.unhandledrejection', reason instanceof Error ? {
    name: reason.name,
    message: reason.message,
    stack: reason.stack,
  } : String(reason));
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    logBrowserEvent('bootstrapApplication failed', err instanceof Error ? {
      name: err.name,
      message: err.message,
      stack: err.stack,
    } : String(err));
    console.error(err);
  });

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PATH_TRACKER_LOG_PORT || 3333);
const logFile = path.join(__dirname, 'browser-log.txt');

fs.writeFileSync(logFile, `Path Tracker browser log\nStarted: ${new Date().toISOString()}\n\n`);

const server = http.createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'content-type');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== 'POST' || request.url !== '/log') {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  let body = '';
  request.setEncoding('utf8');
  request.on('data', chunk => {
    body += chunk;
  });
  request.on('end', () => {
    fs.appendFileSync(logFile, `${new Date().toISOString()} ${body}\n`);
    response.writeHead(204);
    response.end();
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Browser log server listening on http://127.0.0.1:${port}/log`);
  console.log(`Writing to ${logFile}`);
});

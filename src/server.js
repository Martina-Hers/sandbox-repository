import http from 'node:http';
import { validatePurchaseOrder } from './services/purchaseOrderService.js';

const port = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/purchase-orders') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const order = JSON.parse(body || '{}');
        const result = validatePurchaseOrder(order);
        const status = result.ok ? 201 : 400;
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, reason: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`Sandbox API listening on http://localhost:${port}`);
});

#!/usr/bin/env node
import http from 'node:http';
import process from 'node:process';

const port = Number(process.env.PORT) || 3100;
const start = Date.now();
const server = http.createServer((req,res)=>{
  if (req.url === '/api/health') {
    const body = JSON.stringify({ status: 'healthy', mock: true, uptime: Math.floor((Date.now()-start)/1000) });
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
    res.end(body);
  } else {
    res.writeHead(404); res.end();
  }
});
server.listen(port, ()=>{
  console.log(`[mock-server] listening on ${port}`);
});

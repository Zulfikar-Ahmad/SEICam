const WebSocket = require('ws');
const express = require('express');

const PORT = process.env.PORT || 3000;
const app = express();

// Simple HTTP endpoint to verify server is running
app.get('/', (req, res) => {
  res.send('ESP32-CAM Relay Server is running!');
});

const server = app.listen(PORT, () => {
  console.log(`Relay server listening on port ${PORT}`);
});

// Create WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

let esp32Client = null;

wss.on('connection', (ws, req) => {
  console.log('New client connected');

  ws.on('message', (data, isBinary) => {
    // If it's a string, it might be the ESP32 identifying itself
    if (!isBinary) {
      const msg = data.toString();
      if (msg === 'ESP32_CAM') {
        esp32Client = ws;
        console.log('ESP32 Camera registered');
        return;
      }
    }
    
    // Broadcast binary frames to all clients EXCEPT the sender
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (ws === esp32Client) {
      console.log('ESP32 Camera disconnected');
      esp32Client = null;
    }
  });
});

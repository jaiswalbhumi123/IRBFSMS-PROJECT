// Native Real-time Event Broadcaster (Zero external dependencies)
let sseClients = [];

const addClient = (res) => {
  sseClients.push(res);
  res.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
};

const broadcastEvent = (eventType, data = {}) => {
  const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
  sseClients.forEach(res => {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch (e) {
      // client connection closed
    }
  });
};

module.exports = {
  addClient,
  broadcastEvent
};


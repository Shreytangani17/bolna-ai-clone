const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { router: agentRoutes } = require('./routes/agents');
const callRoutes = require('./routes/calls');
const analyticsRoutes = require('./routes/analytics');
const webhookRoutes = require('./routes/webhooks');
const knowledgeRoutes = require('./routes/knowledge');
const integrationRoutes = require('./routes/integrations');
const callHistoryRoutes = require('./routes/callHistory');
const testRoutes = require('./routes/test');
const conversationRoutes = require('./routes/conversation');
const { setupWebRTC } = require('./routes/webrtc');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Routes
app.use('/api/agent', agentRoutes);
app.use('/api/call', callRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/call-history', callHistoryRoutes);
app.use('/api/test', testRoutes);
app.use('/api/conversation', conversationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
setupWebRTC(server);

const { checkProviderStatus } = require('./utils/providerStatus');

server.listen(PORT, () => {
  console.log(`Bolna Backend running on port ${PORT}`);
  checkProviderStatus();
});

module.exports = app;
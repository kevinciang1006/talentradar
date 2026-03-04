import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import connectDB from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { authLimiter, apiLimiter } from './middleware/rateLimiter';
import { swaggerSpec } from './config/swagger';

// Import routes
import authRoutes from './routes/auth.routes';
import adminAuthRoutes from './routes/admin.auth.routes';
import talentRoutes from './routes/talent.routes';
import jobRoutes from './routes/job.routes';
import pipelineRoutes from './routes/pipeline.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';
import adminDealsRoutes from './routes/admin.deals.routes';

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Apply global middleware
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP to allow Swagger UI inline scripts/styles
}));
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Logging in development
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Apply general API rate limiter
app.use('/api', apiLimiter);

// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'TalentRadar API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,  // Keeps the JWT token between page refreshes
    docExpansion: 'none',        // Collapse all by default (cleaner view)
    filter: true,                // Adds a search bar to filter endpoints
    tagsSorter: 'alpha',         // Sort tag groups alphabetically
  },
}));

// Serve raw spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve uploaded files statically
app.use('/api/v1/files', express.static(path.join(__dirname, '../uploads/deals')));

// Mount routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/admin/auth', authLimiter, adminAuthRoutes);
app.use('/api/v1/talent', talentRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/pipeline', pipelineRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin/deals', adminDealsRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Apply error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} in ${config.NODE_ENV} mode`);
  console.log(`📚 API Docs available at http://localhost:${PORT}/api-docs`);
});

export default app;

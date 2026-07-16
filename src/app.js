import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import serviceRoutes from './routes/service.routes.js';
import contactRoutes from './routes/contact.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import adminRoutes from './routes/admin.routes.js';

import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

// API Error Handling (Catch all unhandled API routes)
app.use('/api', notFound);

// Serve Frontend in Production
// Health check route for the root URL
app.get('/', (req, res) => {
  res.json({ message: 'Nova Growth Backend API is running successfully!' });
});

// General Error Handling
app.use(errorHandler);

export default app;

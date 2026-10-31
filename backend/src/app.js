const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const invoiceRoutes = require('./modules/invoices/routes/invoiceRoutes');
const taxRoutes = require('./modules/invoices/routes/taxRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-mock-role', 'x-mock-user-id', 'x-mock-user-email']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    module: 'M10 - Invoice & Tax Management',
    system: 'Brightloop Subscription Management System',
    timestamp: new Date().toISOString()
  });
});

// Mount module routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tax-configurations', taxRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
    errors: ['Endpoint does not exist']
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Server Error] ${err.message}`, err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: process.env.NODE_ENV === 'development' ? [err.message] : ['An unexpected error occurred']
  });
});

module.exports = app;

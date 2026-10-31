const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./modules/customers/routes/customerRoutes');
const customerPortalRoutes = require('./modules/customers/routes/customerPortalRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const planRoutes = require('./modules/plans/routes/planRoutes');
const productRoutes = require('./modules/products/routes/productRoutes');
const productCategoryRoutes = require('./modules/products/routes/productCategoryRoutes');
const productVariantRoutes = require('./modules/products/routes/productVariantRoutes');

const app = express();

// Allowed origins
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// CORS configuration supporting credentials (cookies)
app.use(
  cors({
    origin: [clientUrl, 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser for HttpOnly JWT
app.use(cookieParser());

// Health Check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Brightloop API is healthy and operational',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer-portal', customerPortalRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/products/:productId/variants', productVariantRoutes);
app.use('/api/plans', planRoutes);

app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

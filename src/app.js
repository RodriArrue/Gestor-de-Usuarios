const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');

// Importar middlewares
const { globalLimiter } = require('./middlewares/rateLimiter');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
app.use('/api', globalLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ruta base
app.get('/', (req, res) => {
    res.json({
        message: 'Gestor de Usuarios RBAC API',
        version: '1.0.0'
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);

module.exports = app;

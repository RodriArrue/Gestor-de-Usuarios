const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

module.exports = app;

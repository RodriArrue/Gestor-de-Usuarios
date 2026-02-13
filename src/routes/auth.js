const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');

// Rutas públicas (con rate limiting estricto)
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);

// Rutas protegidas
router.get('/me', authMiddleware, AuthController.getProfile);

module.exports = router;

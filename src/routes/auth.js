const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validations/auth.schema');

// Rutas públicas (con rate limiting estricto y validación)
router.post('/register', authLimiter, validate({ body: registerSchema }), AuthController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), AuthController.login);

// Rutas protegidas
router.get('/me', authMiddleware, AuthController.getProfile);

module.exports = router;

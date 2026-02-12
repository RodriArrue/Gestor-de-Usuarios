const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validations/auth.schema');

// Rutas públicas
router.post('/register', validate({ body: registerSchema }), AuthController.register);
router.post('/login', validate({ body: loginSchema }), AuthController.login);

// Rutas protegidas
router.get('/me', authMiddleware, AuthController.getProfile);

module.exports = router;

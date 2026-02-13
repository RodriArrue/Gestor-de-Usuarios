const app = require('./app');
const { sequelize } = require('./models');
const { testConnection } = require('./config');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        await testConnection();

        // En producción las migraciones se ejecutan con: npm run db:migrate
        // En desarrollo se pueden ejecutar manualmente o al iniciar
        if (process.env.NODE_ENV !== 'production') {
            console.log('💡 Ejecuta "npm run db:migrate" para aplicar migraciones pendientes.');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();

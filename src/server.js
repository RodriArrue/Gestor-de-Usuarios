const app = require('./app');
const { sequelize } = require('./models');
const { testConnection } = require('./config');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        await testConnection();

        // Sincronizar modelos (solo en desarrollo)
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: true });
            console.log('✅ Modelos sincronizados con la base de datos.');
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

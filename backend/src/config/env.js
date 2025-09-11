// Configuration des variables d'environnement
module.exports = {
    // Serveur
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3001,

    // Base de données
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://batmodule:batmodule123@localhost:5432/batmodule',

    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Frontend
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Upload
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '10mb',

    // Email (pour plus tard)
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',

    // PDF
    PDF_TEMPLATES_DIR: process.env.PDF_TEMPLATES_DIR || './templates',

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100
}

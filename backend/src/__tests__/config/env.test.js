const env = require("../../config/env");

describe("Environment Configuration", () => {
  let originalEnv;

  beforeEach(() => {
    // Sauvegarder l'environnement original
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restaurer l'environnement original
    process.env = originalEnv;
  });

  describe("Default values", () => {
    it("should have correct default values when no env vars are set", () => {
      // Nettoyer les variables d'environnement
      delete process.env.PORT;
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      delete process.env.JWT_SECRET;
      delete process.env.JWT_EXPIRES_IN;
      delete process.env.FRONTEND_URL;
      delete process.env.UPLOAD_DIR;
      delete process.env.MAX_FILE_SIZE;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.PDF_TEMPLATES_DIR;
      delete process.env.RATE_LIMIT_WINDOW_MS;
      delete process.env.RATE_LIMIT_MAX;

      // Recharger le module pour utiliser les valeurs par défaut
      delete require.cache[require.resolve("../../config/env")];
      const envConfig = require("../../config/env");

      expect(envConfig.NODE_ENV).toBe("test"); // Jest définit NODE_ENV à 'test'
      expect(envConfig.PORT).toBe(3001);
      expect(envConfig.DATABASE_URL).toBe(
        "postgresql://batmodule:batmodule123@localhost:5432/batmodule",
      );
      expect(envConfig.REDIS_URL).toBe("redis://localhost:6379");
      expect(envConfig.JWT_SECRET).toBe("dev-jwt-secret-change-in-production");
      expect(envConfig.JWT_EXPIRES_IN).toBe("7d");
      expect(envConfig.FRONTEND_URL).toBe("http://localhost:3000");
      expect(envConfig.UPLOAD_DIR).toBe("./uploads");
      expect(envConfig.MAX_FILE_SIZE).toBe("10mb");
      expect(envConfig.SMTP_HOST).toBe("");
      expect(envConfig.SMTP_PORT).toBe(587);
      expect(envConfig.SMTP_USER).toBe("");
      expect(envConfig.SMTP_PASS).toBe("");
      expect(envConfig.PDF_TEMPLATES_DIR).toBe("./templates");
      expect(envConfig.RATE_LIMIT_WINDOW_MS).toBe(15 * 60 * 1000);
      expect(envConfig.RATE_LIMIT_MAX).toBe(100);
    });
  });

  describe("Environment variable override", () => {
    it("should use environment variables when set", () => {
      process.env.NODE_ENV = "production";
      process.env.PORT = "8080";
      process.env.DATABASE_URL = "postgresql://prod:prod@prod:5432/prod";
      process.env.REDIS_URL = "redis://prod:6379";
      process.env.JWT_SECRET = "prod-secret";
      process.env.JWT_EXPIRES_IN = "1d";
      process.env.FRONTEND_URL = "https://prod.example.com";
      process.env.UPLOAD_DIR = "/var/uploads";
      process.env.MAX_FILE_SIZE = "20mb";
      process.env.SMTP_HOST = "smtp.example.com";
      process.env.SMTP_PORT = "465";
      process.env.SMTP_USER = "user@example.com";
      process.env.SMTP_PASS = "password";
      process.env.PDF_TEMPLATES_DIR = "/var/templates";
      process.env.RATE_LIMIT_WINDOW_MS = "30000";
      process.env.RATE_LIMIT_MAX = "50";

      // Recharger le module pour utiliser les nouvelles variables
      delete require.cache[require.resolve("../../config/env")];
      const envConfig = require("../../config/env");

      expect(envConfig.NODE_ENV).toBe("production");
      expect(envConfig.PORT).toBe("8080");
      expect(envConfig.DATABASE_URL).toBe(
        "postgresql://prod:prod@prod:5432/prod",
      );
      expect(envConfig.REDIS_URL).toBe("redis://prod:6379");
      expect(envConfig.JWT_SECRET).toBe("prod-secret");
      expect(envConfig.JWT_EXPIRES_IN).toBe("1d");
      expect(envConfig.FRONTEND_URL).toBe("https://prod.example.com");
      expect(envConfig.UPLOAD_DIR).toBe("/var/uploads");
      expect(envConfig.MAX_FILE_SIZE).toBe("20mb");
      expect(envConfig.SMTP_HOST).toBe("smtp.example.com");
      expect(envConfig.SMTP_PORT).toBe("465");
      expect(envConfig.SMTP_USER).toBe("user@example.com");
      expect(envConfig.SMTP_PASS).toBe("password");
      expect(envConfig.PDF_TEMPLATES_DIR).toBe("/var/templates");
      expect(envConfig.RATE_LIMIT_WINDOW_MS).toBe("30000");
      expect(envConfig.RATE_LIMIT_MAX).toBe("50");
    });
  });

  describe("Type conversion", () => {
    it("should handle numeric environment variables correctly", () => {
      process.env.PORT = "4000";
      process.env.SMTP_PORT = "2525";
      process.env.RATE_LIMIT_WINDOW_MS = "60000";
      process.env.RATE_LIMIT_MAX = "200";

      // Recharger le module
      delete require.cache[require.resolve("../../config/env")];
      const envConfig = require("../../config/env");

      expect(envConfig.PORT).toBe("4000");
      expect(envConfig.SMTP_PORT).toBe("2525");
      expect(envConfig.RATE_LIMIT_WINDOW_MS).toBe("60000");
      expect(envConfig.RATE_LIMIT_MAX).toBe("200");
    });
  });

  describe("Configuration structure", () => {
    it("should export all required configuration keys", () => {
      const requiredKeys = [
        "NODE_ENV",
        "PORT",
        "DATABASE_URL",
        "REDIS_URL",
        "JWT_SECRET",
        "JWT_EXPIRES_IN",
        "FRONTEND_URL",
        "UPLOAD_DIR",
        "MAX_FILE_SIZE",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASS",
        "PDF_TEMPLATES_DIR",
        "RATE_LIMIT_WINDOW_MS",
        "RATE_LIMIT_MAX",
      ];

      requiredKeys.forEach((key) => {
        expect(env).toHaveProperty(key);
        expect(env[key]).toBeDefined();
      });
    });
  });
});

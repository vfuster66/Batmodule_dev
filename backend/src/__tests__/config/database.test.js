const { Pool } = require("pg");
const database = require("../../config/database");

// Mock pg
jest.mock("pg", () => ({
  Pool: jest.fn(),
}));

describe("Database Configuration", () => {
  let mockPool;
  let mockClient;
  let originalEnv;

  beforeEach(() => {
    // Sauvegarder l'environnement original
    originalEnv = { ...process.env };

    // Reset mocks
    jest.clearAllMocks();

    // Mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Mock pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
    };

    Pool.mockImplementation(() => mockPool);
  });

  afterEach(() => {
    // Restaurer l'environnement original
    process.env = originalEnv;
    jest.resetModules();
  });

  describe("Pool configuration", () => {
    it("should create pool with correct configuration in development", () => {
      process.env.NODE_ENV = "development";
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

      // Recharger le module
      delete require.cache[require.resolve("../../config/database")];
      require("../../config/database");

      expect(Pool).toHaveBeenCalledWith({
        connectionString: "postgresql://test:test@localhost:5432/test",
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it("should create pool with SSL in production", () => {
      process.env.NODE_ENV = "production";
      process.env.DATABASE_URL = "postgresql://prod:prod@prod:5432/prod";

      // Recharger le module
      delete require.cache[require.resolve("../../config/database")];
      require("../../config/database");

      expect(Pool).toHaveBeenCalledWith({
        connectionString: "postgresql://prod:prod@prod:5432/prod",
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it("should use default connection string when DATABASE_URL is not set", () => {
      delete process.env.DATABASE_URL;

      // Recharger le module
      delete require.cache[require.resolve("../../config/database")];
      require("../../config/database");

      expect(Pool).toHaveBeenCalledWith({
        connectionString:
          "postgresql://batmodule:batmodule123@localhost:5432/batmodule",
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });
  });

  describe("connectDB", () => {
    it("should connect successfully and log success message", async () => {
      const mockResult = {
        rows: [{ now: "2023-01-01 12:00:00" }],
      };
      mockClient.query.mockResolvedValueOnce(mockResult);

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await database.connectDB();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith("SELECT NOW()");
      expect(mockClient.release).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "✅ Connexion PostgreSQL réussie",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "📅 Heure de la base de données:",
        "2023-01-01 12:00:00",
      );

      consoleSpy.mockRestore();
    });

    it("should handle connection errors", async () => {
      const error = new Error("Connection failed");
      mockPool.connect.mockRejectedValueOnce(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(database.connectDB()).rejects.toThrow("Connection failed");
      expect(consoleSpy).toHaveBeenCalledWith(
        "❌ Erreur de connexion à PostgreSQL:",
        "Connection failed",
      );

      consoleSpy.mockRestore();
    });
  });

  describe("query function", () => {
    it("should execute query without user context", async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockClient.query.mockResolvedValueOnce(mockResult);

      const result = await database.query("SELECT * FROM test");

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        "SELECT * FROM test",
        undefined,
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it("should execute query with user context", async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockClient.query
        .mockResolvedValueOnce({}) // set_user_context
        .mockResolvedValueOnce(mockResult) // actual query
        .mockResolvedValueOnce({}); // clear_user_context

      const result = await database.query("SELECT * FROM test", [], "user123");

      expect(mockClient.query).toHaveBeenCalledWith(
        "SELECT set_user_context($1)",
        ["user123"],
      );
      expect(mockClient.query).toHaveBeenCalledWith("SELECT * FROM test", []);
      expect(mockClient.query).toHaveBeenCalledWith(
        "SELECT clear_user_context()",
      );
      expect(result).toEqual(mockResult);
    });

    it("should log slow queries", async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
      mockClient.query.mockResolvedValueOnce(mockResult);

      // Mock Date.now pour simuler une requête lente
      const originalNow = Date.now;
      Date.now = jest
        .fn()
        .mockReturnValueOnce(0) // start time
        .mockReturnValueOnce(150); // end time (150ms > 100ms)

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      await database.query("SELECT * FROM test");

      expect(consoleSpy).toHaveBeenCalledWith(
        "⚠️ Requête lente:",
        expect.objectContaining({
          text: "SELECT * FROM test...",
          duration: 150,
          rows: 1,
          userId: "none",
        }),
      );

      Date.now = originalNow;
      consoleSpy.mockRestore();
    });

    it("should handle query errors", async () => {
      const error = new Error("Query failed");
      mockClient.query.mockRejectedValueOnce(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(database.query("SELECT * FROM test")).rejects.toThrow(
        "Query failed",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "❌ Erreur de requête:",
        expect.objectContaining({
          text: "SELECT * FROM test...",
          error: "Query failed",
          userId: "none",
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should clear user context on error", async () => {
      const error = new Error("Query failed");
      mockClient.query
        .mockResolvedValueOnce({}) // set_user_context
        .mockRejectedValueOnce(error); // actual query

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(
        database.query("SELECT * FROM test", [], "user123"),
      ).rejects.toThrow("Query failed");

      expect(mockClient.query).toHaveBeenCalledWith(
        "SELECT clear_user_context()",
      );
      expect(mockClient.release).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("transaction function", () => {
    it("should execute transaction successfully", async () => {
      const mockCallback = jest.fn().mockResolvedValue("result");
      mockClient.query
        .mockResolvedValueOnce({}) // set_user_context
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // COMMIT
        .mockResolvedValueOnce({}); // clear_user_context

      const result = await database.transaction(mockCallback, "user123");

      expect(mockClient.query).toHaveBeenCalledWith(
        "SELECT set_user_context($1)",
        ["user123"],
      );
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockCallback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.query).toHaveBeenCalledWith(
        "SELECT clear_user_context()",
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe("result");
    });

    it("should rollback on error", async () => {
      const error = new Error("Transaction failed");
      const mockCallback = jest.fn().mockRejectedValue(error);
      mockClient.query
        .mockResolvedValueOnce({}) // set_user_context
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // ROLLBACK
        .mockResolvedValueOnce({}); // clear_user_context

      await expect(
        database.transaction(mockCallback, "user123"),
      ).rejects.toThrow("Transaction failed");

      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.query).toHaveBeenCalledWith(
        "SELECT clear_user_context()",
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should execute transaction without user context", async () => {
      const mockCallback = jest.fn().mockResolvedValue("result");
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}); // COMMIT

      const result = await database.transaction(mockCallback);

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockCallback).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe("result");
    });
  });

  describe("module exports", () => {
    it("should export all required functions", () => {
      expect(database).toHaveProperty("pool");
      expect(database).toHaveProperty("connectDB");
      expect(database).toHaveProperty("query");
      expect(database).toHaveProperty("transaction");
      expect(typeof database.connectDB).toBe("function");
      expect(typeof database.query).toBe("function");
      expect(typeof database.transaction).toBe("function");
    });
  });
});

const { Pool } = require('pg')

// Configuration de la base de données
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://batmodule:batmodule123@localhost:5432/batmodule',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  max: 20, // Nombre maximum de connexions dans le pool
  idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30s
  connectionTimeoutMillis: 2000, // Timeout de connexion de 2s
})

// Test de connexion
async function connectDB() {
  try {
    const client = await pool.connect()
    console.log('✅ Connexion PostgreSQL réussie')

    // Test de la base de données
    const result = await client.query('SELECT NOW()')
    console.log('📅 Heure de la base de données:', result.rows[0].now)

    client.release()
  } catch (error) {
    console.error('❌ Erreur de connexion à PostgreSQL:', error.message)
    throw error
  }
}

// Fonction utilitaire pour exécuter des requêtes avec contexte utilisateur
async function query(text, params, userId = null) {
  const start = Date.now()
  const client = await pool.connect()

  try {
    // Définir le contexte utilisateur pour RLS
    if (userId) {
      await client.query('SELECT set_user_context($1)', [userId])
    }

    const result = await client.query(text, params)
    const duration = Date.now() - start

    // Log seulement les requêtes lentes (> 100ms) ou en cas d'erreur
    if (duration > 100) {
      console.log('⚠️ Requête lente:', {
        text: text.substring(0, 100) + '...',
        duration,
        rows: result.rowCount,
        userId: userId ? 'set' : 'none',
      })
    }

    return result
  } catch (error) {
    console.error('❌ Erreur de requête:', {
      text: text.substring(0, 100) + '...',
      error: error.message,
      userId: userId ? 'set' : 'none',
    })
    throw error
  } finally {
    // Nettoyer le contexte utilisateur
    if (userId) {
      await client.query('SELECT clear_user_context()')
    }
    client.release()
  }
}

// Fonction pour les transactions avec contexte utilisateur
async function transaction(callback, userId = null) {
  const client = await pool.connect()
  try {
    // Définir le contexte utilisateur pour RLS
    if (userId) {
      await client.query('SELECT set_user_context($1)', [userId])
    }

    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    // Nettoyer le contexte utilisateur
    if (userId) {
      await client.query('SELECT clear_user_context()')
    }
    client.release()
  }
}

module.exports = {
  pool,
  connectDB,
  query,
  transaction,
}

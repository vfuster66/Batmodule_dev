#!/usr/bin/env node

/**
 * Script pour lister les utilisateurs de la base de données
 * Utile pour obtenir l'UUID d'un utilisateur avant d'insérer le catalogue
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://batmodule:batmodule123@localhost:5432/batmodule",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function listUsers() {
  const client = await pool.connect();

  try {
    console.log("👥 Liste des utilisateurs BatModule");
    console.log("=".repeat(60));

    const result = await client.query(`
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        company_name,
        created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log("ℹ️  Aucun utilisateur trouvé dans la base de données");
      console.log("");
      console.log("💡 Pour créer un utilisateur, vous pouvez :");
      console.log("   1. Utiliser l'interface web de BatModule");
      console.log("   2. Insérer directement en base avec un script SQL");
      return;
    }

    console.log(`📊 ${result.rows.length} utilisateur(s) trouvé(s) :`);
    console.log("");

    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏢 Entreprise: ${user.company_name || "Non renseignée"}`);
      console.log(`   🆔 UUID: ${user.id}`);
      console.log(
        `   📅 Créé le: ${new Date(user.created_at).toLocaleDateString("fr-FR")}`,
      );
      console.log("");
    });

    console.log("💡 Pour insérer le catalogue pour un utilisateur :");
    console.log("node scripts/insert-catalogue-services.js <UUID_UTILISATEUR>");
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des utilisateurs :",
      error.message,
    );
    process.exit(1);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    // Vérifier la connexion
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    await listUsers();
  } catch (error) {
    console.error(
      "❌ Erreur de connexion à la base de données :",
      error.message,
    );
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { listUsers };

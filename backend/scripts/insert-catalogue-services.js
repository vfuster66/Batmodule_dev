#!/usr/bin/env node

/**
 * Script pour insérer le catalogue de services dans la base de données
 * Grille tarifaire cohérente – Perpignan (2025, HT)
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
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

async function insertCatalogueServices(userId) {
  const client = await pool.connect();

  try {
    console.log("🎨 Insertion du catalogue de services...");
    console.log(`👤 Utilisateur cible: ${userId}`);

    // Commencer une transaction
    await client.query("BEGIN");

    // 1. Créer les catégories de services
    console.log("📁 Création des catégories de services...");

    const categories = [
      {
        name: "Préparation des supports",
        description: "Travaux de préparation avant peinture",
        color: "#FF6B35",
      },
      {
        name: "Peinture intérieure",
        description: "Peinture des murs, plafonds et menuiseries intérieures",
        color: "#004AAD",
      },
      {
        name: "Revêtements muraux",
        description: "Pose de papier peint et toiles",
        color: "#8B5A3C",
      },
      {
        name: "Peinture extérieure",
        description: "Peinture de façades et éléments extérieurs",
        color: "#2ECC71",
      },
      {
        name: "Revêtements sols",
        description: "Peinture et pose de revêtements de sol",
        color: "#9B59B6",
      },
      {
        name: "Travaux complémentaires",
        description: "Services annexes et frais divers",
        color: "#E74C3C",
      },
    ];

    const categoryIds = {};

    for (const category of categories) {
      const result = await client.query(
        `
        INSERT INTO service_categories (id, user_id, name, description, color)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4)
        RETURNING id, name
      `,
        [userId, category.name, category.description, category.color],
      );

      categoryIds[category.name] = result.rows[0].id;
      console.log(`   ✅ ${category.name}`);
    }

    // 2. Insérer tous les services
    console.log("🛠️  Insertion des services...");

    const services = [
      // PRÉPARATION DES SUPPORTS
      {
        category: "Préparation des supports",
        name: "Protection chantier",
        description: "Bâches, ruban, scotch de protection",
        unit: "forfait",
        price_ht: 66.5,
      },
      {
        category: "Préparation des supports",
        name: "Dépose papier peint",
        description: "Dépose et évacuation du papier peint existant",
        unit: "m²",
        price_ht: 10.0,
      },
      {
        category: "Préparation des supports",
        name: "Décapage peinture ancienne",
        description: "Décapage mécanique ou chimique de la peinture",
        unit: "m²",
        price_ht: 17.0,
      },
      {
        category: "Préparation des supports",
        name: "Lessivage murs/plafonds",
        description: "Nettoyage et dégraissage des surfaces",
        unit: "m²",
        price_ht: 5.0,
      },
      {
        category: "Préparation des supports",
        name: "Rebouchage trous/fissures",
        description: "Rebouchage et ponçage des imperfections",
        unit: "m²",
        price_ht: 13.0,
      },
      {
        category: "Préparation des supports",
        name: "Ratissage ou enduit complet",
        description: "Application d'enduit de lissage complet",
        unit: "m²",
        price_ht: 23.0,
      },
      {
        category: "Préparation des supports",
        name: "Application sous-couche",
        description: "Application de primaire d'accrochage",
        unit: "m²",
        price_ht: 5.0,
      },

      // PEINTURE INTÉRIEURE - Murs et plafonds
      {
        category: "Peinture intérieure",
        name: "Peinture murs état normal",
        description: "Peinture acrylique 2 couches sur murs en bon état",
        unit: "m²",
        price_ht: 22.0,
      },
      {
        category: "Peinture intérieure",
        name: "Peinture murs mauvais état",
        description: "Peinture 2 couches avec préparation enduit",
        unit: "m²",
        price_ht: 30.0,
      },
      {
        category: "Peinture intérieure",
        name: "Peinture plafond standard",
        description: "Peinture acrylique mate 2 couches",
        unit: "m²",
        price_ht: 21.0,
      },
      {
        category: "Peinture intérieure",
        name: "Plafond grande hauteur",
        description: "Peinture plafond complexe ou haute hauteur",
        unit: "m²",
        price_ht: 27.0,
      },
      {
        category: "Peinture intérieure",
        name: "Peinture décorative",
        description: "Effets décoratifs, finitions spéciales",
        unit: "m²",
        price_ht: 42.0,
      },

      // PEINTURE INTÉRIEURE - Boiseries et menuiseries
      {
        category: "Peinture intérieure",
        name: "Peinture porte",
        description: "Peinture porte 2 faces avec encadrement",
        unit: "unité",
        price_ht: 92.0,
      },
      {
        category: "Peinture intérieure",
        name: "Fenêtre intérieur",
        description: "Peinture fenêtre bois ou PVC côté intérieur",
        unit: "unité",
        price_ht: 50.0,
      },
      {
        category: "Peinture intérieure",
        name: "Fenêtre extérieur",
        description: "Peinture fenêtre bois ou PVC côté extérieur",
        unit: "unité",
        price_ht: 75.0,
      },
      {
        category: "Peinture intérieure",
        name: "Plinthes/moulures",
        description: "Peinture plinthes et moulures décoratives",
        unit: "ml",
        price_ht: 7.0,
      },
      {
        category: "Peinture intérieure",
        name: "Escalier marche",
        description: "Peinture marche + contremarche d'escalier",
        unit: "marche",
        price_ht: 21.0,
      },
      {
        category: "Peinture intérieure",
        name: "Peinture radiateur",
        description: "Peinture radiateur avec préparation",
        unit: "unité",
        price_ht: 50.0,
      },

      // REVÊTEMENTS MURAUX
      {
        category: "Revêtements muraux",
        name: "Papier peint classique",
        description: "Pose papier peint traditionnel avec colle",
        unit: "m²",
        price_ht: 21.0,
      },
      {
        category: "Revêtements muraux",
        name: "Papier peint vinyle/intissé",
        description: "Pose papier peint vinyle ou intissé",
        unit: "m²",
        price_ht: 29.0,
      },
      {
        category: "Revêtements muraux",
        name: "Toile de verre seule",
        description: "Pose toile de verre sans peinture",
        unit: "m²",
        price_ht: 10.0,
      },
      {
        category: "Revêtements muraux",
        name: "Toile de verre + peinture",
        description: "Pose toile de verre avec finition peinture",
        unit: "m²",
        price_ht: 25.0,
      },

      // PEINTURE EXTÉRIEURE
      {
        category: "Peinture extérieure",
        name: "Nettoyage façade",
        description: "Nettoyage ou démoussage de façade",
        unit: "m²",
        price_ht: 7.0,
      },
      {
        category: "Peinture extérieure",
        name: "Peinture façade",
        description: "Peinture façade extérieure 2 couches",
        unit: "m²",
        price_ht: 27.0,
      },
      {
        category: "Peinture extérieure",
        name: "Crépi/enduit finition",
        description: "Application crépi ou enduit de finition",
        unit: "m²",
        price_ht: 42.0,
      },
      {
        category: "Peinture extérieure",
        name: "Peinture volets bois",
        description: "Peinture volets bois par face",
        unit: "unité",
        price_ht: 58.0,
      },
      {
        category: "Peinture extérieure",
        name: "Peinture portail/ferronnerie",
        description: "Peinture portail ou éléments de ferronnerie",
        unit: "m²",
        price_ht: 38.0,
      },
      {
        category: "Peinture extérieure",
        name: "Peinture bardage",
        description: "Peinture bardage bois ou métallique",
        unit: "m²",
        price_ht: 29.0,
      },

      // REVÊTEMENTS SOLS
      {
        category: "Revêtements sols",
        name: "Peinture sol béton",
        description: "Peinture sol béton garage, cave",
        unit: "m²",
        price_ht: 21.0,
      },
      {
        category: "Revêtements sols",
        name: "Peinture sol époxy",
        description: "Peinture sol époxy usage industriel",
        unit: "m²",
        price_ht: 33.0,
      },
      {
        category: "Revêtements sols",
        name: "Résine décorative",
        description: "Pose résine décorative au sol",
        unit: "m²",
        price_ht: 54.0,
      },
      {
        category: "Revêtements sols",
        name: "Parquet flottant",
        description: "Pose parquet flottant avec sous-couche",
        unit: "m²",
        price_ht: 25.0,
      },
      {
        category: "Revêtements sols",
        name: "Parquet massif",
        description: "Pose parquet massif collé ou cloué",
        unit: "m²",
        price_ht: 40.0,
      },
      {
        category: "Revêtements sols",
        name: "Lino/PVC rouleau",
        description: "Pose linoléum ou sol PVC en rouleau",
        unit: "m²",
        price_ht: 18.0,
      },
      {
        category: "Revêtements sols",
        name: "Sol PVC lames/dalles",
        description: "Pose sol PVC en lames ou dalles clipsables",
        unit: "m²",
        price_ht: 22.0,
      },

      // TRAVAUX COMPLÉMENTAIRES
      {
        category: "Travaux complémentaires",
        name: "Déplacement Perpignan",
        description: "Frais de déplacement zone Perpignan",
        unit: "forfait",
        price_ht: 33.0,
      },
      {
        category: "Travaux complémentaires",
        name: "Nettoyage fin chantier",
        description: "Nettoyage complet en fin d'intervention",
        unit: "forfait",
        price_ht: 67.0,
      },
      {
        category: "Travaux complémentaires",
        name: "Location échafaudage/nacelle",
        description: "Location matériel de hauteur par jour",
        unit: "jour",
        price_ht: 100.0,
      },
    ];

    let insertedCount = 0;

    for (const service of services) {
      const categoryId = categoryIds[service.category];
      const vatRate = 20.0;
      const priceTtc =
        Math.round(service.price_ht * (1 + vatRate / 100) * 100) / 100;

      await client.query(
        `
        INSERT INTO services (id, user_id, category_id, name, description, unit, price_ht, price_ttc, vat_rate, is_active)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, true)
      `,
        [
          userId,
          categoryId,
          service.name,
          service.description,
          service.unit,
          service.price_ht,
          priceTtc,
          vatRate,
        ],
      );

      insertedCount++;
    }

    // Valider la transaction
    await client.query("COMMIT");

    console.log(`✅ Catalogue inséré avec succès !`);
    console.log(`📊 Statistiques :`);
    console.log(`   - ${categories.length} catégories créées`);
    console.log(`   - ${insertedCount} services insérés`);
    console.log(
      `💰 Règle importante : Minimum de facturation 250 € HT (≈ 300 € TTC)`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log("🎨 Script d'insertion du catalogue de services BatModule");
    console.log("=".repeat(60));

    // Vérifier la connexion
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    console.log("✅ Connexion à la base de données réussie");

    // Récupérer l'argument utilisateur ou demander l'UUID
    const userId = process.argv[2];

    if (!userId) {
      console.log("❌ Erreur : UUID utilisateur requis");
      console.log(
        "Usage: node scripts/insert-catalogue-services.js <USER_UUID>",
      );
      console.log("");
      console.log(
        "Pour obtenir l'UUID d'un utilisateur, vous pouvez exécuter :",
      );
      console.log("SELECT id, email FROM users;");
      process.exit(1);
    }

    // Valider que l'utilisateur existe
    const testClient = await pool.connect();
    const userResult = await testClient.query(
      "SELECT id, email FROM users WHERE id = $1",
      [userId],
    );
    testClient.release();

    if (userResult.rows.length === 0) {
      console.log(`❌ Erreur : Aucun utilisateur trouvé avec l'UUID ${userId}`);
      process.exit(1);
    }

    console.log(`👤 Utilisateur trouvé : ${userResult.rows[0].email}`);
    console.log("");

    // Insérer le catalogue
    await insertCatalogueServices(userId);

    console.log("");
    console.log("🎉 Insertion terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'insertion :", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { insertCatalogueServices };

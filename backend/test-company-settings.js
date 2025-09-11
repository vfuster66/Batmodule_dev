#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testCompanySettings() {
    console.log('🧪 Test de l\'accès à la configuration d\'entreprise...\n');

    try {
        // 1. Test de connexion
        console.log('1️⃣ Test de connexion...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'test@test.com',
            password: 'test'
        });
        
        if (loginResponse.data.token) {
            console.log('✅ Connexion réussie');
            const token = loginResponse.data.token;
            
            // 2. Test d'accès aux paramètres d'entreprise
            console.log('\n2️⃣ Test d\'accès aux paramètres d\'entreprise...');
            try {
                const settingsResponse = await axios.get(`${API_BASE}/company-settings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Accès aux paramètres d\'entreprise réussi');
                console.log(`📊 Données reçues: ${JSON.stringify(settingsResponse.data).substring(0, 100)}...`);
            } catch (error) {
                console.log('❌ Erreur d\'accès aux paramètres:', error.response?.data?.message || error.message);
            }
            
            // 3. Test du rapport de conformité
            console.log('\n3️⃣ Test du rapport de conformité...');
            try {
                const complianceResponse = await axios.get(`${API_BASE}/company-settings/compliance-report`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Rapport de conformité accessible');
                console.log(`📊 Score de conformité: ${complianceResponse.data.complianceScore || 'N/A'}`);
            } catch (error) {
                console.log('❌ Erreur du rapport de conformité:', error.response?.data?.message || error.message);
            }
            
        } else {
            console.log('❌ Échec de la connexion');
        }
        
    } catch (error) {
        console.log('❌ Erreur générale:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Test terminé !');
}

// Exécuter le test
testCompanySettings().catch(console.error);

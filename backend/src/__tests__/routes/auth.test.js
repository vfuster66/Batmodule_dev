const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRoutes = require('../../routes/auth');
const { query } = require('../../config/database');
const { errorHandler } = require('../../middleware/errorHandler');

// Mock de la base de données
jest.mock('../../config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        // Mock du middleware d'authentification
        if (req.headers.authorization && req.headers.authorization.includes('Bearer valid-token')) {
            req.user = { userId: 1, email: 'test@example.com' };
            next();
        } else {
            res.status(401).json({ error: 'Token manquant' });
        }
    }
}));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        const validUserData = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            companyName: 'Test Company',
            phone: '0123456789',
            address: '123 Test Street'
        };

        it('should register a new user successfully', async () => {
            // Mock: user doesn't exist
            query.mockResolvedValueOnce({ rows: [] });

            // Mock: bcrypt hash
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');

            // Mock: database insert
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                company_name: 'Test Company',
                phone: '0123456789',
                address: '123 Test Street',
                created_at: new Date()
            };
            query.mockResolvedValueOnce({ rows: [mockUser] });

            // Mock: JWT sign
            jwt.sign.mockReturnValueOnce('mock-jwt-token');

            const response = await request(app)
                .post('/auth/register')
                .send(validUserData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Compte créé avec succès');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.token).toBe('mock-jwt-token');
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
        });

        it('should return 409 if user already exists', async () => {
            // Mock: user exists
            query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const response = await request(app)
                .post('/auth/register')
                .send(validUserData);

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Utilisateur existant');
        });

        it('should return 400 for invalid data', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: '123', // too short
                firstName: 'J', // too short
                lastName: 'D'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Données invalides');
        });
    });

    describe('POST /auth/login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'password123'
        };

        it('should login successfully with valid credentials', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password_hash: 'hashedPassword',
                first_name: 'John',
                last_name: 'Doe',
                company_name: 'Test Company',
                phone: '0123456789',
                address: '123 Test Street',
                created_at: new Date()
            };

            // Mock: user exists
            query.mockResolvedValueOnce({ rows: [mockUser] });

            // Mock: bcrypt compare
            bcrypt.compare.mockResolvedValueOnce(true);

            // Mock: JWT sign
            jwt.sign.mockReturnValueOnce('mock-jwt-token');

            const response = await request(app)
                .post('/auth/login')
                .send(validLoginData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Connexion réussie');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.token).toBe('mock-jwt-token');
            expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
        });

        it('should return 401 for non-existent user', async () => {
            // Mock: user doesn't exist
            query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/auth/login')
                .send(validLoginData);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Identifiants invalides');
        });

        it('should return 401 for invalid password', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password_hash: 'hashedPassword',
                first_name: 'John',
                last_name: 'Doe',
                company_name: 'Test Company',
                phone: '0123456789',
                address: '123 Test Street',
                created_at: new Date()
            };

            // Mock: user exists
            query.mockResolvedValueOnce({ rows: [mockUser] });

            // Mock: bcrypt compare returns false
            bcrypt.compare.mockResolvedValueOnce(false);

            const response = await request(app)
                .post('/auth/login')
                .send(validLoginData);

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Identifiants invalides');
        });

        it('should return 400 for invalid data', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: ''
            };

            const response = await request(app)
                .post('/auth/login')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Données invalides');
        });
    });

    describe('GET /auth/profile', () => {
        it('should return user profile with valid token', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe',
                company_name: 'Test Company',
                phone: '0123456789',
                address: '123 Test Street',
                created_at: new Date(),
                updated_at: new Date()
            };

            // Mock: database query
            query.mockResolvedValueOnce({ rows: [mockUser] });

            const response = await request(app)
                .get('/auth/profile')
                .set('Authorization', 'Bearer valid-token');

            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe('test@example.com');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/auth/profile');

            expect(response.status).toBe(401);
        });
    });

    describe('PUT /auth/profile', () => {
        it('should update user profile successfully', async () => {
            const updateData = {
                firstName: 'Jane',
                lastName: 'Smith',
                companyName: 'New Company'
            };

            const mockUpdatedUser = {
                id: 1,
                email: 'test@example.com',
                first_name: 'Jane',
                last_name: 'Smith',
                company_name: 'New Company',
                phone: '0123456789',
                address: '123 Test Street',
                created_at: new Date(),
                updated_at: new Date()
            };

            // Mock: database update
            query.mockResolvedValueOnce({ rows: [mockUpdatedUser] });

            const response = await request(app)
                .put('/auth/profile')
                .set('Authorization', 'Bearer valid-token')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Profil mis à jour avec succès');
            expect(response.body.user.firstName).toBe('Jane');
        });

        it('should return 400 for invalid update data', async () => {
            const invalidData = {
                firstName: 'J', // too short
                lastName: 'S'
            };

            const response = await request(app)
                .put('/auth/profile')
                .set('Authorization', 'Bearer valid-token')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Données invalides');
        });
    });
});

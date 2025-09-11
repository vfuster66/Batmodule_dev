const { errorHandler } = require('../../middleware/errorHandler');

describe('Error Handler Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            url: '/test',
            method: 'GET',
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('test-agent')
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should handle Joi validation errors', () => {
        const joiError = {
            isJoi: true,
            details: [
                {
                    path: ['email'],
                    message: 'Email is required'
                },
                {
                    path: ['password'],
                    message: 'Password must be at least 6 characters'
                }
            ]
        };

        errorHandler(joiError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Données invalides',
            details: [
                {
                    field: 'email',
                    message: 'Email is required'
                },
                {
                    field: 'password',
                    message: 'Password must be at least 6 characters'
                }
            ]
        });
    });

    it('should handle unique constraint violation (23505)', () => {
        const dbError = {
            code: '23505',
            message: 'duplicate key value violates unique constraint'
        };

        errorHandler(dbError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Conflit de données',
            message: 'Cette ressource existe déjà'
        });
    });

    it('should handle foreign key violation (23503)', () => {
        const dbError = {
            code: '23503',
            message: 'foreign key constraint fails'
        };

        errorHandler(dbError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Référence invalide',
            message: 'La ressource référencée n\'existe pas'
        });
    });

    it('should handle NOT NULL constraint violation (23502)', () => {
        const dbError = {
            code: '23502',
            message: 'null value in column violates not-null constraint'
        };

        errorHandler(dbError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Données manquantes',
            message: 'Certains champs obligatoires sont manquants'
        });
    });

    it('should handle other database errors', () => {
        const dbError = {
            code: '42P01',
            message: 'relation does not exist'
        };

        errorHandler(dbError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Erreur de base de données',
            message: 'Une erreur est survenue lors de l\'accès aux données'
        });
    });

    it('should handle JWT errors', () => {
        const jwtError = {
            name: 'JsonWebTokenError',
            message: 'invalid token'
        };

        errorHandler(jwtError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Token invalide',
            message: 'Le token d\'authentification est invalide'
        });
    });

    it('should handle expired token errors', () => {
        const expiredError = {
            name: 'TokenExpiredError',
            message: 'jwt expired'
        };

        errorHandler(expiredError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Token expiré',
            message: 'Le token d\'authentification a expiré'
        });
    });

    it('should handle generic errors', () => {
        const genericError = {
            message: 'Something went wrong',
            stack: 'Error stack trace'
        };

        errorHandler(genericError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Erreur serveur',
            message: 'Something went wrong',
            stack: 'Error stack trace'
        });
    });

    it('should log error details', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const genericError = {
            message: 'Test error',
            stack: 'Error stack'
        };

        errorHandler(genericError, req, res, next);

        expect(consoleSpy).toHaveBeenCalledWith('❌ Erreur:', {
            message: 'Test error',
            stack: 'Error stack',
            url: '/test',
            method: 'GET',
            ip: '127.0.0.1',
            userAgent: 'test-agent'
        });

        consoleSpy.mockRestore();
    });
});

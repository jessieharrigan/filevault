const request = require('supertest');
const app = require('../index');

jest.mock('@azure/storage-blob', () => ({
    BlobServiceClient: jest.fn().mockImplementation(() => ({
        getContainerClient: jest.fn().mockReturnValue({
            getBlockBlobClient: jest.fn().mockReturnValue({
                uploadFile: jest.fn().mockResolvedValue(true),
                delete: jest.fn().mockResolvedValue(true)
            })
        })
    })),
    StorageSharedKeyCredential: jest.fn()
}));

describe('FileVault API Basic Tests', () => {
    
    test('GET / should return 200 OK', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('<title>FileVault</title>');
    });

    test('GET /files should return an array', async () => {
        const response = await request(app).get('/files');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /upload without file should return 400', async () => {
        const response = await request(app)
            .post('/upload')
            .send({ note: 'test' });
        expect(response.statusCode).toBe(400);
    });
});
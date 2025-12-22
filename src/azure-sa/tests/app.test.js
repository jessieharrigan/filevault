const request = require('supertest');
const fs = require('fs');

const mockUploadFile = jest.fn().mockResolvedValue(true);
const mockDelete = jest.fn().mockResolvedValue(true);

jest.mock('@azure/storage-blob', () => {
    return {
        BlobServiceClient: jest.fn().mockImplementation(() => ({
            getContainerClient: jest.fn().mockReturnValue({
                getBlockBlobClient: jest.fn().mockReturnValue({
                    uploadFile: mockUploadFile,
                    delete: mockDelete 
                })
            })
        })),
        StorageSharedKeyCredential: jest.fn()
    };
});

const app = require('../index');

describe('FileVault API Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET Routes', () => {
        test('GET / should return 200 OK', async () => {
            const response = await request(app).get('/');
            expect(response.statusCode).toBe(200);
            expect(response.text).toMatch(/FileVault is Active 🚀|<title>FileVault<\/title>/);
        });

        test('GET /files should return an array', async () => {
            const response = await request(app).get('/files');
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /files - should handle case where data file exists', async () => {
            const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            const readSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify([{ fileName: 'test' }]));
            
            await request(app).get('/files');
            
            expect(existsSpy).toHaveBeenCalled();
            existsSpy.mockRestore();
            readSpy.mockRestore();
        });
    });

    describe('POST /upload', () => {
        test('Successful upload should return 200', async () => {
            const fakeFile = Buffer.from('this is a test file');
            const response = await request(app)
                .post('/upload')
                .field('note', 'My Test File')
                .attach('file', fakeFile, 'test.txt');

            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('File uploaded successfully.');
        });

        test('POST without file should return 400', async () => {
            const response = await request(app)
                .post('/upload')
                .send({ note: 'test' });
            expect(response.statusCode).toBe(400);
        });

        test('POST without fileName should return 400', async () => {
            const response = await request(app)
                .post('/upload')
                .attach('file', Buffer.from('test'), 'test.txt');

            expect(response.statusCode).toBe(400);
            expect(response.text).toBe('File name is required.');
        });

        test('Should return 500 if Azure upload fails', async () => {
            mockUploadFile.mockRejectedValueOnce(new Error('Upload failed'));
            const response = await request(app)
                .post('/upload')
                .field('note', 'test')
                .attach('file', Buffer.from('test'), 'test.txt');

            expect(response.statusCode).toBe(500);
            expect(response.text).toBe('Failed to upload file.');
        });
    });

    describe('DELETE /files/:key', () => {
        test('Successful delete should return 200', async () => {
            const response = await request(app).delete('/files/some-key');
            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('File deleted successfully.');
        });

        test('Should return 500 if Azure delete fails', async () => {
            mockDelete.mockRejectedValueOnce(new Error('Azure Storage is down'));
            const response = await request(app).delete('/files/any-key');
            expect(response.statusCode).toBe(500);
            expect(response.text).toBe('Failed to delete file.');
        });
    });
});
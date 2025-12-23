process.env.AZURE_STORAGE_ACCOUNT_NAME = 'mockaccount';
process.env.AZURE_CONTAINER_NAME = 'mockcontainer';

const request = require('supertest');

const mockUploadFile = jest.fn().mockResolvedValue(true);
const mockDelete = jest.fn().mockResolvedValue(true);

const mockListBlobs = {
    [Symbol.asyncIterator]: async function* () {
        yield { 
            name: 'test-blob-key', 
            metadata: { fileName: 'Test File' } 
        };
    }
};

jest.mock('@azure/storage-blob', () => {
    return {
        BlobServiceClient: jest.fn().mockImplementation(() => ({
            getContainerClient: jest.fn().mockReturnValue({
                listBlobsFlat: jest.fn().mockReturnValue(mockListBlobs),
                getBlockBlobClient: jest.fn().mockReturnValue({
                    uploadFile: mockUploadFile,
                    delete: mockDelete 
                })
            })
        })),
        StorageSharedKeyCredential: jest.fn()
    };
});

// Mocking @azure/identity to prevent it from trying to reach out to Azure during tests
jest.mock('@azure/identity', () => ({
    DefaultAzureCredential: jest.fn().mockImplementation(() => ({}))
}));

const app = require('../index');

describe('FileVault API Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(async () => {
        console.error.mockRestore();
        // Small delay to allow any pending async handles to close
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    describe('GET Routes', () => {
        test('GET / should return 200 OK (from static public/index.html)', async () => {
            const response = await request(app).get('/');
            expect(response.statusCode).toBe(200);
            // Since we serve index.html, we check for HTML content
            expect(response.headers['content-type']).toMatch(/html/);
        });

        test('GET /files should return an array from Azure Metadata', async () => {
            const response = await request(app).get('/files');
            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0]).toHaveProperty('name', 'Test File');
            expect(response.body[0]).toHaveProperty('key', 'test-blob-key');
        });
    });

    describe('POST /upload', () => {
        test('Successful upload should return 200', async () => {
            const fakeFile = Buffer.from('this is a test file');
            const response = await request(app)
                .post('/upload')
                .field('note', 'Test File')
                .attach('file', fakeFile, 'test.txt');

            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('File uploaded successfully.');
            expect(mockUploadFile).toHaveBeenCalled();
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
            expect(mockDelete).toHaveBeenCalled();
        });

        test('Should return 500 if Azure delete fails', async () => {
            mockDelete.mockRejectedValueOnce(new Error('Azure Storage is down'));
            const response = await request(app).delete('/files/any-key');
            expect(response.statusCode).toBe(500);
            expect(response.text).toBe('Failed to delete file.');
        });
    });
});
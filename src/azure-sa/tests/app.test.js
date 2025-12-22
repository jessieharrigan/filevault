const request = require('supertest');

const mockUploadFile = jest.fn().mockResolvedValue(true);
const mockDelete = jest.fn().mockResolvedValue(true);

jest.mock('@azure/storage-blob', () => {
    return {
        BlobServiceClient: jest.fn().mockImplementation(() => ({
            getContainerClient: jest.fn().mockReturnValue({
                getBlockBlobClient: jest.fn().mockReturnValue({
                    // Use the variables defined above
                    uploadFile: mockUploadFile,
                    delete: mockDelete 
                })
            })
        })),
        StorageSharedKeyCredential: jest.fn()
    };
});

const app = require('../index');

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

test('POST /upload - Successful upload should return 200', async () => {
    const fakeFile = Buffer.from('this is a test file');

    const response = await request(app)
        .post('/upload')
        .field('note', 'My Test File')
        .attach('file', fakeFile, 'test.txt');

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('File uploaded successfully.');
});

test('DELETE /files/:key - Should delete a file and return 200', async () => {
    const testKey = 'some-fake-blob-key';
    
    const response = await request(app).delete(`/files/${testKey}`);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('File deleted successfully.');
});

test('DELETE /files/:key - Should return 500 if Azure delete fails', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Azure Storage is down'));

    const response = await request(app).delete('/files/any-key');

    expect(response.statusCode).toBe(500);
    expect(response.text).toBe('Failed to delete file.');
});

test('POST /upload - Should return 500 if upload fails', async () => {
    mockUploadFile.mockRejectedValueOnce(new Error('Upload failed'));

    const response = await request(app)
        .post('/upload')
        .field('note', 'test')
        .attach('file', Buffer.from('test'), 'test.txt');

    expect(response.statusCode).toBe(500);
    expect(response.text).toBe('Failed to upload file.');
});
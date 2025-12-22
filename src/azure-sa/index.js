const appInsights = require('applicationinsights');

/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
    appInsights.setup().start();
}

const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

// Prevent Brute Force (A07: Identification and Authentication Failures)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});

app.use(helmet()); // Sets security headers
app.use(xss());    // Sanitizes user input
app.use(limiter);  // Rate limiting

const crypto = require('crypto');
global.crypto = crypto;

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { DefaultAzureCredential } = require("@azure/identity");

const credential = new DefaultAzureCredential();

const { BlobServiceClient } = require('@azure/storage-blob');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });

const blobServiceClient = new BlobServiceClient(
    `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    credential
);

const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);

const { SecretClient } = require("@azure/keyvault-secrets");
if (process.env.KEY_VAULT_NAME) {
    const vaultUrl = `https://${process.env.KEY_VAULT_NAME}.vault.azure.net`;
    const secretClient = new SecretClient(vaultUrl, credential);
    // You would fetch these inside your routes or an async init function
}

const filesDataPath = './filesData.json';

const loadFilesData = () => {
    if (fs.existsSync(filesDataPath)) {
        const data = fs.readFileSync(filesDataPath);
        return JSON.parse(data);
    }
    return [];
};

const saveFilesData = (files) => {
    fs.writeFileSync(filesDataPath, JSON.stringify(files, null, 2));
};

let files = loadFilesData();

app.get('/', (req, res) => {
    res.status(200).send('FileVault is Active 🚀');
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/upload', upload.single('file'), async (req, res) => {
    const fileName = req.body.note;
    if (!fileName) {
        return res.status(400).send('File name is required.');
    }

    if (req.file) {
        try {
            const blobName = req.file.filename;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            await blockBlobClient.uploadFile(req.file.path);
            fs.unlinkSync(req.file.path); // remove the file locally after upload

            files.push({ name: fileName, key: blobName });
            saveFilesData(files);

            res.status(200).send('File uploaded successfully.');
        } catch (err) {
            console.error('Error uploading file:', err);
            res.status(500).send('Failed to upload file.');
        }
    } else {
        res.status(400).send('No file uploaded.');
    }
});

app.get('/files', (req, res) => {
    res.json(files);
});

app.delete('/files/:key', async (req, res) => {
    const fileKey = req.params.key;

    try {
        const blockBlobClient = containerClient.getBlockBlobClient(fileKey);
        await blockBlobClient.delete();

        files = files.filter(file => file.key !== fileKey);
        saveFilesData(files);

        res.status(200).send('File deleted successfully.');
    } catch (err) {
        console.error('Error deleting file:', err);
        res.status(500).send('Failed to delete file.');
    }
});

/* istanbul ignore if */
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;
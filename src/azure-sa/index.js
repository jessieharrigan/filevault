const appInsights = require('applicationinsights');
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
    appInsights.setup().start();
}

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const { DefaultAzureCredential } = require("@azure/identity");
const { BlobServiceClient } = require('@azure/storage-blob');
const { SecretClient } = require("@azure/keyvault-secrets");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const filesDataPath = path.join(__dirname, 'filesData.json');
const upload = multer({ dest: 'uploads/' });

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100 
});
app.use(
  helmet({
    contentSecurityPolicy: false, // Prevents CSP from blocking local/inline assets
    hsts: false,                  // STOPS the ERR_SSL_PROTOCOL_ERROR by allowing HTTP
  })
);
app.use(xss());    
app.use(limiter);  
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const credential = new DefaultAzureCredential();

const blobServiceClient = new BlobServiceClient(
    `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    credential
);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);

let secretClient;
if (process.env.KEY_VAULT_NAME) {
    const vaultUrl = `https://${process.env.KEY_VAULT_NAME}.vault.azure.net`;
    secretClient = new SecretClient(vaultUrl, credential);
}

app.get('/files', async (req, res) => {
    let list = [];
    for await (const blob of containerClient.listBlobsFlat({ includeMetadata: true })) {
        list.push({
            name: blob.metadata.fileName || blob.name,
            key: blob.name
        });
    }
    res.json(list);
});

app.post('/upload', upload.single('file'), async (req, res) => {
    const fileName = req.body.note;
    if (!fileName) return res.status(400).send('File name is required.');
    if (!req.file) return res.status(400).send('No file uploaded.');

    try {
        const blobName = req.file.filename;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadFile(req.file.path, {
            metadata: { fileName: req.body.note }
        });
        fs.unlinkSync(req.file.path); 

        files.push({ name: fileName, key: blobName });

        res.status(200).send('File uploaded successfully.');
    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).send('Failed to upload file.');
    }
});

app.delete('/files/:key', async (req, res) => {
    const fileKey = req.params.key;
    try {
        const blockBlobClient = containerClient.getBlockBlobClient(fileKey);
        await blockBlobClient.delete();

        res.status(200).send('File deleted successfully.');
    } catch (err) {
        console.error('Delete Error:', err);
        res.status(500).send('Failed to delete file.');
    }
});

/* istanbul ignore if */
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
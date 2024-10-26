const express = require('express');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.text({ type: 'text/*' }));

app.post('/convert-svg', async (req, res) => {
    try {
        const svg = req.body;
        if (!svg) {
            return res.status(400).send('SVG data is required');
        }

        // Converter o SVG para PNG
        const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

        // Gerar um nome único para o arquivo
        const filename = `${uuidv4()}.png`;

        // Definir o caminho completo do arquivo
        const filePath = path.join(__dirname, 'temp', filename);

        // Criar a pasta 'temp' se não existir
        await fs.promises.mkdir(path.join(__dirname, 'temp'), { recursive: true });

        // Adicionando logs de depuração para verificação do salvamento do arquivo
        console.log(`Saving file at: ${filePath}`);
        await fs.promises.writeFile(filePath, pngBuffer);
        console.log(`File saved successfully: ${filePath}`);

        // Retornar o link para download
        const downloadLink = `${req.protocol}://${req.get('host')}/download/${filename}`;
        res.json({ downloadLink });
    } catch (error) {
        console.error('Failed to convert SVG to image:', error);
        res.status(500).send('Failed to convert SVG to image');
    }
});

// Rota para servir a imagem para download
app.get('/download/:filename', async (req, res) => {
    const filePath = path.join(__dirname, 'temp', req.params.filename);

    try {
        // Verificar se o arquivo existe antes de tentar servir para download
        await fs.promises.access(filePath);

        // Servir o arquivo para download
        res.download(filePath, async (err) => {
            if (err) {
                return res.status(500).send('Failed to download image');
            }

            // Excluir o arquivo após um pequeno delay para garantir que o download foi completo
            setTimeout(async () => {
                try {
                    await fs.promises.unlink(filePath);
                    console.log('File deleted successfully');
                } catch (unlinkErr) {
                    if (unlinkErr.code === 'ENOENT') {
                        console.error('File not found, no need to delete.');
                    } else {
                        console.error('Failed to delete file:', unlinkErr);
                    }
                }
            }, 30000); // Delay de 1 segundo antes de excluir o arquivo
        });
    } catch (error) {
        console.error('File not found for download:', error);
        res.status(404).send('File not found');
    }
});

// Verificação do conteúdo da pasta para fins de debug
app.get('/debug/temp-contents', async (req, res) => {
    const tempDir = path.join(__dirname, 'temp');

    try {
        const files = await fs.promises.readdir(tempDir);
        res.json({ files });
    } catch (error) {
        console.error('Failed to read temp directory contents:', error);
        res.status(404).send('Temp directory not found');
    }
});

app.listen(port, () => {
    console.log(`SVG API is running on port ${port}`);
});

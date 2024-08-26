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
        const pngBuffer = await sharp(Buffer.from(svg))
            .png()
            .toBuffer();

        // Gerar um nome único para o arquivo
        const filename = `${uuidv4()}.png`;

        // Definir o caminho completo do arquivo
        const filePath = path.join(__dirname, 'temp', filename);

        // Criar a pasta 'temp' se não existir
        fs.mkdirSync(path.join(__dirname, 'temp'), { recursive: true });

        // Salvar a imagem no sistema de arquivos
        fs.writeFileSync(filePath, pngBuffer);

        // Retornar o link para download
        const downloadLink = `${req.protocol}://${req.get('host')}/download/${filename}`;
        res.json({ downloadLink });

    } catch (error) {
        res.status(500).send('Failed to convert SVG to image');
    }
});

// Rota para servir a imagem para download
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'temp', req.params.filename);
    res.download(filePath, (err) => {
        if (err) {
            res.status(500).send('Failed to download image');
        }

        // Opcional: Excluir o arquivo após o download
        fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete file:', err);
        });
    });
});

app.listen(port, () => {
    console.log(`SVG API is running on port ${port}`);
});

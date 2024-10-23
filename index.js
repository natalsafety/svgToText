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

        // Adicionando logs de depuração para verificação do salvamento do arquivo
        console.log(`Saving file at: ${filePath}`);  // Log para verificar o caminho onde o arquivo será salvo
        fs.writeFileSync(filePath, pngBuffer);       // Salvar o arquivo PNG
        console.log(`File saved successfully: ${filePath}`);  // Log para confirmar que o arquivo foi salvo

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

    // Verificar se o arquivo existe antes de tentar servir para download
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }

    // Servir o arquivo para download
    res.download(filePath, (err) => {
        if (err) {
            res.status(500).send('Failed to download image');
        } else {
            // Excluir o arquivo após um pequeno delay para garantir que o download foi completo
            setTimeout(() => {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        if (err.code === 'ENOENT') {
                            console.error('File not found, no need to delete.');
                        } else {
                            console.error('Failed to delete file:', err);
                        }
                    } else {
                        console.log('File deleted successfully');
                    }
                });
            }, 1000);  // Delay de 1 segundo antes de excluir o arquivo
        }
    });
});

// Verificação do conteúdo da pasta para fins de debug
app.get('/debug/temp-contents', (req, res) => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        res.json({ files });
    } else {
        res.status(404).send('Temp directory not found');
    }
});

app.listen(port, () => {
    console.log(`SVG API is running on port ${port}`);
});

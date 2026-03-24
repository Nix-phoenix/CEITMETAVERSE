const express = require('express');
// Replace mongoose (MongoDB) with Prisma (Postgres)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

dotenv.config();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'a3f8d9c2e1b4f6a9c8d7e3f1a9b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0';

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../../')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/games', express.static(path.join(__dirname, '../../uploads/games')));

// Better static file serving for game assets
app.use('/uploads/games/:gameName', express.static(path.join(__dirname, '../../uploads/games'), {
    setHeaders: (res, filePath) => {
        // Set proper MIME types for common game files
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
        } else if (filePath.endsWith('.data')) {
            res.setHeader('Content-Type', 'application/octet-stream');
        } else if (filePath.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        }
    }
}));

// Create uploads directories
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('uploads/games')) fs.mkdirSync('uploads/games', { recursive: true });

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }
});

// Connect Prisma (Postgres) using DATABASE_URL from .env
(async () => {
    try {
        await prisma.$connect();
        console.log('✅ Prisma connected (Postgres)');
    } catch (e) {
        console.warn('⚠️ Prisma connect warning:', e.message || e);
    }
})();

// ==================== SCHEMAS ====================

// Using Prisma models (`User`, `Game`) defined in prisma/schema.prisma
// Access via `prisma.user` and `prisma.game` throughout this file.

// ==================== HELPER FUNCTIONS ====================

// Improved unzip function with better error handling
async function unzipGameFile(zipPath, gameTitle) {
    return new Promise((resolve, reject) => {
        try {
            const sanitizedTitle = gameTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const extractPath = path.join(__dirname, '../../uploads/games', sanitizedTitle);

            console.log('📦 Extracting to:', extractPath);

            // Remove existing directory if it exists
            if (fs.existsSync(extractPath)) {
                console.log('⚠️  Directory exists, removing...');
                fs.rmSync(extractPath, { recursive: true, force: true });
            }

            // Create directory
            fs.mkdirSync(extractPath, { recursive: true });

            const stream = fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: extractPath }));

            stream.on('close', () => {
                console.log('✅ Unzip completed');
                
                // Verify index.html exists
                const indexPath = path.join(extractPath, 'index.html');
                if (!fs.existsSync(indexPath)) {
                    console.warn('⚠️  Warning: index.html not found in root of extracted files');
                }
                
                resolve(`games/${sanitizedTitle}`);
            });

            stream.on('error', (err) => {
                console.error('❌ Unzip stream error:', err);
                reject(new Error(`Failed to extract game: ${err.message}`));
            });

        } catch (err) {
            console.error('❌ Unzip setup error:', err);
            reject(err);
        }
    });
}

// ==================== ROUTES ====================

const crypto = require('crypto');

// Test route
app.get('/test', async (req, res) => {
    let dbStatus = 'unknown';
    try {
        // lightweight check
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'Connected (Postgres via Prisma)';
    } catch (e) {
        dbStatus = `Disconnected (${e.message || 'error'})`;
    }

    res.json({
        message: 'Server is running',
        port: PORT,
        database: dbStatus
    });
});

// Serve Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Register
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check existing user
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) return res.status(400).json({ error: 'Username or email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();

        const created = await prisma.user.create({
            data: {
                id,
                username,
                email,
                password: hashedPassword,
                fullName: fullName || username
            }
        });

        const token = jwt.sign({ userId: created.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'User registered successfully',
            token,
            userId: created.id,
            username: created.username,
            fullName: created.fullName,
            email: created.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
});

// Login - Updated to accept email OR username
app.post('/login', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const loginIdentifier = email || username;

        if (!loginIdentifier || !password) {
            return res.status(400).json({ error: 'Email/Username and password required' });
        }

        // Find user by email OR username using Prisma
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: loginIdentifier },
                    { username: loginIdentifier }
                ]
            }
        });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            userId: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

// Get profile
app.get('/profile/:userId', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { password: _pw, ...rest } = user;
        res.json(rest);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching profile', details: err.message });
    }
});

// Update profile
app.put('/profile/:userId', async (req, res) => {
    try {
        const { fullName, bio } = req.body;
        const updated = await prisma.user.update({
            where: { id: req.params.userId },
            data: { fullName, bio }
        });

        const { password: _pw2, ...restUpdated } = updated;
        res.json({ message: 'Profile updated', user: restUpdated });
    } catch (err) {
        res.status(500).json({ error: 'Error updating profile', details: err.message });
    }
});

// Add game - FIXED VERSION
app.post('/addGame', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'gameFile', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('\n========== ADD GAME ==========');
        console.log('Body:', req.body);
        console.log('Files:', req.files);
        console.log('Title:', req.body.title);
        console.log('Creator ID:', req.body.creatorId);

        // Validation
        if (!req.body.title || !req.body.title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        if (!req.files?.gameFile || req.files.gameFile.length === 0) {
            return res.status(400).json({ error: 'Game file is required' });
        }

        if (!req.files?.coverImage || req.files.coverImage.length === 0) {
            return res.status(400).json({ error: 'Cover image is required' });
        }

        let gameFilePath = null;
        const zipFile = req.files.gameFile[0];

        console.log('Processing zip file:', zipFile.originalname);
        console.log('Zip file size:', zipFile.size, 'bytes');
        
        try {
            gameFilePath = await unzipGameFile(zipFile.path, req.body.title);
            console.log('✅ Game extracted to:', gameFilePath);
            
            // Delete the original zip file after extraction
            fs.unlinkSync(zipFile.path);
            console.log('✅ Original zip file deleted');
        } catch (unzipErr) {
            console.error('❌ Unzip error:', unzipErr.message);
            return res.status(500).json({ 
                error: 'Error extracting game file', 
                details: unzipErr.message 
            });
        }

        // Create game record via Prisma
        const id = crypto.randomUUID();
        const tagsArray = req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        const coverPath = req.files.coverImage[0].path.replace(/\\/g, '/');

        const createdGame = await prisma.game.create({
            data: {
                id,
                title: req.body.title.trim(),
                shortDesc: req.body.shortDesc?.trim() || '',
                fullDesc: req.body.fullDesc?.trim() || '',
                gameType: req.body.gameType?.trim() || 'Other',
                tags: tagsArray.length ? tagsArray : null,
                coverImage: coverPath,
                gameFile: gameFilePath,
                creatorId: req.body.creatorId || null
            }
        });

        console.log('✅ Game saved to database:', createdGame.id);
        console.log('========== END ADD GAME ==========\n');

        res.json({
            message: 'Game uploaded successfully',
            game: createdGame
        });
    } catch (err) {
        console.error('❌ Add game error:', err);
        res.status(500).json({ 
            error: 'Error uploading game', 
            details: err.message 
        });
    }
});

// Get all games
app.get('/games', async (req, res) => {
    try {
        const games = await prisma.game.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching games', details: err.message });
    }
});

// Get game by ID
app.get('/games/:gameId', async (req, res) => {
    try {
        const game = await prisma.game.findUnique({ where: { id: req.params.gameId } });
        if (!game) return res.status(404).json({ error: 'Game not found' });
        res.json(game);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching game', details: err.message });
    }
});

// Serve individual game pages
app.get('/play/:gameId', async (req, res) => {
    try {
        const game = await prisma.game.findUnique({ where: { id: req.params.gameId } });

        if (!game) return res.status(404).send('Game not found');

        // Serve the game's index.html
        const gamePath = path.join(__dirname, '../../uploads', game.gameFile, 'index.html');

        if (fs.existsSync(gamePath)) {
            res.sendFile(gamePath);
        } else {
            res.status(404).send('Game files not found. index.html is missing.');
        }
    } catch (err) {
        console.error('Error loading game:', err);
        res.status(500).send('Error loading game');
    }
});

// Start server with port fallback if in use
function startServer(port, attemptsLeft = 5) {
    const numericPort = Number(port) || 3001;
    const server = app.listen(numericPort, () => {
        console.log(`\n✅ Server running on http://localhost:${numericPort}`);
        console.log(`✅ API available at http://localhost:${numericPort}/test`);
        console.log(`✅ Swagger UI available at http://localhost:${numericPort}/docs\n`);
    });

    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${numericPort} is already in use.`);
            if (attemptsLeft > 0) {
                const nextPort = numericPort + 1;
                console.log(`➡️ Trying next port: ${nextPort} (attempts left: ${attemptsLeft - 1})`);
                setTimeout(() => startServer(nextPort, attemptsLeft - 1), 500);
            } else {
                console.error('❌ No available ports found. Exiting.');
                process.exit(1);
            }
        } else {
            console.error('❌ Server error:', err);
            process.exit(1);
        }
    });
}

startServer(PORT);
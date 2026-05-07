import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase, disconnectDatabase } from './config/prisma';
import { ensureUploadsDirectory } from './utils/fileUtils';

// Routes
import authRoutes from './module/Auth/api/auth.Routes';
import userRoutes from './module/user/api/User.Routes';
import gameRoutes from './module/game/api/GameRoute';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app  = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Static files ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../../')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/games',   express.static(path.join(__dirname, '../../uploads/games')));

app.use(
    '/uploads/games/:gameName',
    express.static(path.join(__dirname, '../../uploads/games'), {
        setHeaders: (res, filePath) => {
            if      (filePath.endsWith('.js'))   res.setHeader('Content-Type', 'application/javascript');
            else if (filePath.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm');
            else if (filePath.endsWith('.data')) res.setHeader('Content-Type', 'application/octet-stream');
            else if (filePath.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
        },
    })
);

// ── Health check ────────────────────────────────────────────────────────────
app.get('/test', (req: Request, res: Response) => {
    res.json({
        message:  'Server is running',
        port:     PORT,
        database: 'Connected',
        version:  '2.0.0 (TypeScript + SQL + Prisma)',
    });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/',        authRoutes);
app.use('/profile', userRoutes);
app.use('/',        gameRoutes);

// ── Server startup ───────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        ensureUploadsDirectory();
        console.log('✅ Uploads directory ready');

        await connectDatabase();

        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`✅ API available at http://localhost:${PORT}/test`);
            console.log(`✅ Backend: TypeScript + SQL (Prisma)\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// ── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await disconnectDatabase();
    process.exit(0);
};

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

startServer();

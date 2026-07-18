import { Request, Response } from 'express';
import prisma from '../../../Config/Prisma';
import { unzipGameFile, storeExeFile } from '../../../Utils/fileUtils';
import fs from 'fs';
import path from 'path';

const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z'];

export class GameController {

    static async addGame(req: Request, res: Response) {
        try {
            const { title, shortDesc, fullDesc, gametype, tags, creatorId } = req.body;

            if (!title?.trim()) {
                res.status(400).json({ error: 'Title is required' });
                return;
            }

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (!files?.gameFile?.length) {
                res.status(400).json({ error: 'Game file is required' });
                return;
            }

            if (!files?.coverImage?.length) {
                res.status(400).json({ error: 'Cover image is required' });
                return;
            }

            const uploadedFile = files.gameFile[0];
            const fileExt      = path.extname(uploadedFile.originalname).toLowerCase();
            let gameFilePath: string | null = null;
            let resolvedGameType = gametype?.trim() || 'other';

            try {
                if (ARCHIVE_EXTENSIONS.includes(fileExt)) {
                    // WebGL game — extract the archive
                    gameFilePath     = await unzipGameFile(uploadedFile.path, title);
                    resolvedGameType = resolvedGameType === 'other' ? 'webgl' : resolvedGameType;
                    fs.unlinkSync(uploadedFile.path);
                } else if (fileExt === '.exe') {
                    // Desktop/EXE game — store directly
                    gameFilePath     = await storeExeFile(uploadedFile.path, title);
                    resolvedGameType = 'exe';
                } else {
                    fs.unlinkSync(uploadedFile.path);
                    res.status(400).json({ error: 'Unsupported game file type' });
                    return;
                }
            } catch (fileErr: any) {
                res.status(500).json({ error: 'Failed to process game file', details: fileErr.message });
                return;
            }

            const game = await prisma.game.create({
                data: {
                    id:         crypto.randomUUID(),
                    title:      title.trim(),
                    shortDesc:  shortDesc?.trim() || '',
                    fulldesc:   fullDesc?.trim()   || '',
                    gametype:   resolvedGameType,
                    tags:       tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                    coverImage: files.coverImage[0].path.replace(/\\/g, '/'),
                    gameFile:   gameFilePath,
                    creatorId:  creatorId || null,
                },
            });

            res.json({ message: 'Game added successfully', game });

        } catch (err: any) {
            console.error('Error adding game:', err);
            res.status(500).json({ error: 'Failed to add game', details: err.message });
        }
    }

    static async getAllGames(req: Request, res: Response): Promise<void> {
        try {
            const games = await prisma.game.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    creator: {
                        select: { id: true, username: true, fullname: true },
                    },
                },
            });

            res.json(games);
        } catch (err: any) {
            res.status(500).json({ error: 'Failed to retrieve games', details: err.message });
        }
    }

    static async getGamesById(req: Request, res: Response): Promise<void> {
        try {
            const { gameId } = req.params;

            const game = await prisma.game.findUnique({
                where: { id: gameId },
                include: {
                    creator: {
                        select: { id: true, username: true, fullname: true },
                    },
                },
            });

            if (!game) {
                res.status(404).json({ error: 'Game not found' });
                return;
            }

            res.json(game);
        } catch (err: any) {
            res.status(500).json({ error: 'Failed to retrieve game', details: err.message });
        }
    }

    static async playGame(req: Request, res: Response) {
        try {
            const { gameId } = req.params;

            const game = await prisma.game.findUnique({ where: { id: gameId } });

            if (!game) {
                res.status(404).json({ error: 'Game not found' });
                return;
            }

            if (!game.gameFile) {
                res.status(404).json({ error: 'Game file not found' });
                return;
            }

            const gamePath = path.join(__dirname, '../../../uploads', game.gameFile, 'index.html');

            if (fs.existsSync(gamePath)) {
                res.sendFile(gamePath);
            } else {
                res.status(404).json({ error: 'Game index file not found' });
            }
        } catch (err: any) {
            console.error('Error playing game:', err);
            res.status(500).json({ error: 'Failed to play game' });
        }
    }

    static async downloadGame(req: Request, res: Response) {
        try {
            const { gameId } = req.params;

            const game = await prisma.game.findUnique({ where: { id: gameId } });

            if (!game) {
                res.status(404).json({ error: 'Game not found' });
                return;
            }

            if (!game.gameFile) {
                res.status(404).json({ error: 'Game file not found' });
                return;
            }

            const exePath = path.join(__dirname, '../../../uploads', game.gameFile);

            if (!fs.existsSync(exePath)) {
                res.status(404).json({ error: 'EXE file not found on server' });
                return;
            }

            const fileName = `${game.title.replace(/[^a-z0-9_\- ]/gi, '_')}.exe`;
            res.download(exePath, fileName);
        } catch (err: any) {
            console.error('Error downloading game:', err);
            res.status(500).json({ error: 'Failed to download game' });
        }
    }
}


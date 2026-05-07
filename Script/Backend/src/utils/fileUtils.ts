import fs from 'fs';
import path from 'path';
import * as unzipper from 'unzipper';

export const unzipGameFile = (zipFilePath: string, gameTitle: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const sanitizedTitle  = gameTitle.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
            const extractPath     = path.join(__dirname, '../../uploads/games', sanitizedTitle);

            if (fs.existsSync(extractPath)) {
                fs.rmSync(extractPath, { recursive: true, force: true });
            }

            fs.mkdirSync(extractPath, { recursive: true });

            const stream = fs.createReadStream(zipFilePath).pipe(
                unzipper.Extract({ path: extractPath })
            );

            stream.on('close', () => {
                const indexPath = path.join(extractPath, 'index.html');
                if (!fs.existsSync(indexPath)) {
                    console.warn('Warning: index.html not found in root of extracted files');
                }
                resolve(`game/${sanitizedTitle}`);
            });

            stream.on('error', (err: any) => {
                reject(new Error(`Failed to extract game: ${err?.message ?? String(err)}`));
            });
        } catch (err: any) {
            reject(err);
        }
    });
};

export function ensureUploadsDirectory(): void {
    const uploadDir = path.join(__dirname, '../../uploads');
    const gameDir   = path.join(uploadDir, 'games');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    if (!fs.existsSync(gameDir)) {
        fs.mkdirSync(gameDir);
    }
}


import multer, { StorageEngine } from 'multer';
import path from 'path';
import { Request } from 'express';

// Configuration constants
const UPLOAD_DIR = 'uploads/';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '524288000'); // 500MB default
const ALLOWED_FILE_TYPES = ['.zip', '.rar', '.7z'];

// Custom storage configuration
const storage: StorageEngine = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb) => {
        cb(null, UPLOAD_DIR);
    },
    
    filename: (req: Request, file: Express.Multer.File, cb) => {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const extension = path.extname(file.originalname);
        const uniqueName = `${timestamp}-${randomString}${extension}`;
        
        cb(null, uniqueName);
    }
});

// File filter for validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (ALLOWED_FILE_TYPES.includes(extension)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`));
    }
};

// Multer upload configuration
export const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter
});
import { Router } from 'express';
import { GameController } from './GameController';
import { upload } from '../../../middleware/upload';

const router = Router();

router.post(
    '/addGame',
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'gameFile',   maxCount: 1 },
    ]),
    GameController.addGame
);

router.get('/game',              GameController.getAllGames);
router.get('/games/:gameId',     GameController.getGamesById);
router.get('/play/:gameId',      GameController.playGame);
router.get('/download/:gameId',  GameController.downloadGame);

export default router;

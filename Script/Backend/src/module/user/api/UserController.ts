import { Request, Response } from 'express';
import prisma from '../../../Config/Prisma';

export class UserController {

    static async getProfile(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            if (!userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }

            const user = await prisma.user.findFirst({
                where: { id: userId },
                select: {
                    id:       true,
                    username: true,
                    email:    true,
                    fullName: true,
                },
            });

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({ user });
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ error: 'Failed to get profile', details: err.message });
        }
    }

    static async updateProfile(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const { username, email, fullName } = req.body;

            if (!userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }

            const data: Record<string, string> = {};
            if (username) data.username = username;
            if (email)    data.email    = email;
            if (fullName) data.fullName = fullName;

            if (Object.keys(data).length === 0) {
                res.status(400).json({ error: 'No updatable fields provided' });
                return;
            }

            const updated = await prisma.user.update({
                where: { id: userId },
                data,
                select: {
                    id:       true,
                    username: true,
                    email:    true,
                    fullName: true,
                },
            });

            res.json({ message: 'Profile updated', user: updated });
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update profile', details: err.message });
        }
    }
}


import { Request, Response } from 'express';
import prisma from '../../../Config/Prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'a3f8d9c2e1b4f6a9c8d7e3f1a9b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, fullName } = req.body;

      if (!username || !email || !password) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });

      if (existingUser) {
        res.status(400).json({ error: 'Username or email already exists' });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          id:       crypto.randomUUID(),
          username,
          email,
          password: hashedPassword,
          fullName: fullName || username,
        },
      });

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'User registered successfully',
        token,
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Registration failed', details: err.message });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password } = req.body;
      const loginIdentifier = email || username;

      if (!loginIdentifier || !password) {
        res.status(400).json({ error: 'Email/Username and password required' });
        return;
      }

      // Find user by email OR username
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: loginIdentifier }, { username: loginIdentifier }],
        },
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login successful',
        token,
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Login failed', details: err.message });
    }
  }
}

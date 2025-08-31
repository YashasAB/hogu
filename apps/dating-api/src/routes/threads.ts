
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { z } from 'zod';

const router = express.Router();

const SendMessageSchema = z.object({
  body: z.string().optional(),
  attachment: z.string().optional()
});

// Get or create user's thread
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    let thread = await prisma.messageThread.findUnique({
      where: { userId: req.user!.id }
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: { userId: req.user!.id }
      });
    }

    res.json({ threadId: thread.id.toString() });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for user's thread
router.get('/me/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const cursor = req.query.cursor ? BigInt(req.query.cursor as string) : undefined;
    const limit = 20;

    const thread = await prisma.messageThread.findUnique({
      where: { userId: req.user!.id }
    });

    if (!thread) {
      return res.json({ messages: [], hasMore: false });
    }

    const messages = await prisma.message.findMany({
      where: {
        threadId: thread.id,
        ...(cursor && { id: { lt: cursor } })
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    res.json({
      messages: messages.map(msg => ({
        id: msg.id.toString(),
        senderType: msg.senderType,
        body: msg.body,
        attachment: msg.attachment,
        createdAt: msg.createdAt
      })),
      hasMore,
      nextCursor: messages.length > 0 ? messages[messages.length - 1].id.toString() : null
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message from user
router.post('/me/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = SendMessageSchema.parse(req.body);

    if (!data.body && !data.attachment) {
      return res.status(400).json({ error: 'Message must have body or attachment' });
    }

    // Get or create thread
    let thread = await prisma.messageThread.findUnique({
      where: { userId: req.user!.id }
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: { userId: req.user!.id }
      });
    }

    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderType: 'USER',
        senderId: req.user!.id,
        body: data.body,
        attachment: data.attachment
      }
    });

    res.status(201).json({
      id: message.id.toString(),
      senderType: message.senderType,
      body: message.body,
      attachment: message.attachment,
      createdAt: message.createdAt
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Admin send message to user
router.post('/admin/:userId/messages', async (req, res) => {
  try {
    const userId = BigInt(req.params.userId);
    const data = SendMessageSchema.parse(req.body);

    if (!data.body && !data.attachment) {
      return res.status(400).json({ error: 'Message must have body or attachment' });
    }

    // Get or create thread for user
    let thread = await prisma.messageThread.findUnique({
      where: { userId }
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: { userId }
      });
    }

    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderType: 'ADMIN',
        senderId: BigInt(1), // Admin ID
        body: data.body,
        attachment: data.attachment
      }
    });

    res.status(201).json({
      id: message.id.toString(),
      senderType: message.senderType,
      body: message.body,
      attachment: message.attachment,
      createdAt: message.createdAt
    });
  } catch (error) {
    console.error('Admin send message error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

export default router;

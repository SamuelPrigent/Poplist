import { Request, Response } from 'express';
import { z } from 'zod';
import { Watchlist } from '../models/Watchlist.model.js';
import { User } from '../models/User.model.js';
import { OneTimeInvite } from '../models/OneTimeInvite.model.js';
import { generateTokenId, hashToken } from '../lib/jwt.js';
import { Types } from 'mongoose';

const watchlistItemSchema = z.object({
  tmdbId: z.string(),
  title: z.string(),
  posterUrl: z.string(),
  type: z.enum(['movie', 'tv']),
  platformList: z.array(z.string()).default([]),
});

const createWatchlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  items: z.array(watchlistItemSchema).default([]),
  fromLocalStorage: z.boolean().optional(),
});

const updateWatchlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  items: z.array(watchlistItemSchema).optional(),
});

const addCollaboratorSchema = z.object({
  email: z.string().email(),
});

export async function getMyWatchlists(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.sub;

    const watchlists = await Watchlist.find({
      $or: [
        { ownerId: userId },
        { collaborators: userId },
      ],
    }).sort({ createdAt: -1 });

    res.json({ watchlists });
  } catch (error) {
    throw error;
  }
}

export async function createWatchlist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const data = createWatchlistSchema.parse(req.body);

    // Check if watchlist with same name exists (for local storage merge)
    if (data.fromLocalStorage) {
      const existing = await Watchlist.findOne({
        ownerId: userId,
        name: data.name,
      });

      if (existing) {
        // Append "(local)" to the name
        data.name = `${data.name} (local)`;
      }
    }

    const watchlist = await Watchlist.create({
      ownerId: userId,
      name: data.name,
      description: data.description,
      isPublic: data.isPublic,
      items: data.items,
    });

    res.status(201).json({ watchlist });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
}

export async function updateWatchlist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const data = updateWatchlistSchema.parse(req.body);

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Check if user is owner or collaborator
    const isOwner = watchlist.ownerId.toString() === userId;
    const isCollaborator = watchlist.collaborators.some(
      (c) => c.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Update fields
    if (data.name) watchlist.name = data.name;
    if (data.description !== undefined) watchlist.description = data.description;
    if (data.isPublic !== undefined) watchlist.isPublic = data.isPublic;
    if (data.items) watchlist.items = data.items;

    await watchlist.save();

    res.json({ watchlist });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
}

export async function deleteWatchlist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Only owner can delete
    if (watchlist.ownerId.toString() !== userId) {
      res.status(403).json({ error: 'Only owner can delete watchlist' });
      return;
    }

    await Watchlist.findByIdAndDelete(id);

    res.json({ message: 'Watchlist deleted successfully' });
  } catch (error) {
    throw error;
  }
}

export async function createShareLink(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Only owner can create share links
    if (watchlist.ownerId.toString() !== userId) {
      res.status(403).json({ error: 'Only owner can create share links' });
      return;
    }

    // Generate invite token
    const token = generateTokenId();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await OneTimeInvite.create({
      watchlistId: id,
      tokenHash,
      expiresAt,
      used: false,
      createdBy: userId,
    });

    const shareUrl = `${process.env.CLIENT_URL}/invite/${token}`;

    res.json({
      shareUrl,
      expiresAt,
      inviteId: invite._id,
    });
  } catch (error) {
    throw error;
  }
}

export async function addCollaborator(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const { email } = addCollaboratorSchema.parse(req.body);

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Only owner can add collaborators
    if (watchlist.ownerId.toString() !== userId) {
      res.status(403).json({ error: 'Only owner can add collaborators' });
      return;
    }

    // Find user by email
    const collaborator = await User.findOne({ email });

    if (!collaborator) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already a collaborator
    if (
      watchlist.collaborators.some((c) => c.toString() === collaborator._id.toString())
    ) {
      res.status(400).json({ error: 'User is already a collaborator' });
      return;
    }

    watchlist.collaborators.push(collaborator._id as Types.ObjectId);
    await watchlist.save();

    res.json({ message: 'Collaborator added successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
}

export async function getPublicWatchlist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const watchlist = await Watchlist.findById(id).populate(
      'ownerId',
      'email'
    );

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    if (!watchlist.isPublic) {
      res.status(403).json({ error: 'This watchlist is private' });
      return;
    }

    res.json({ watchlist });
  } catch (error) {
    throw error;
  }
}

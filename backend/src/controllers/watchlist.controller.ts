import { Request, Response } from 'express';
import { z } from 'zod';
import { Watchlist } from '../models/Watchlist.model.js';
import { User } from '../models/User.model.js';
import { OneTimeInvite } from '../models/OneTimeInvite.model.js';
import { generateTokenId, hashToken } from '../lib/jwt.js';
import { Types } from 'mongoose';
import { enrichMediaData, searchMedia, getFullMediaDetails } from '../services/tmdb.service.js';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Validate if an ID is a valid MongoDB ObjectId
 * Returns false for offline IDs or invalid ObjectIds
 */
function isValidWatchlistId(id: string): boolean {
  return !id.startsWith('offline-') && Types.ObjectId.isValid(id);
}

/**
 * Extract Cloudinary public_id from a Cloudinary URL
 * Example: https://res.cloudinary.com/dxqyjaa91/image/upload/v1762789942/watchlists/abc123.jpg
 * Returns: watchlists/abc123
 */
function extractPublicIdFromUrl(imageUrl: string): string | null {
  try {
    // Match pattern: /upload/[version]/[public_id].[extension]
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Failed to extract public_id from URL:', error);
    return null;
  }
}

const watchlistItemSchema = z.object({
  tmdbId: z.string(),
  title: z.string(),
  posterUrl: z.string(),
  type: z.enum(['movie', 'tv']),
  platformList: z.array(z.string()).default([]),
  runtime: z.number().optional(),
  numberOfSeasons: z.number().optional(),
  numberOfEpisodes: z.number().optional(),
  addedAt: z.string().or(z.date()).optional(),
});

const createWatchlistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  categories: z.array(z.string()).optional(),
  items: z.array(watchlistItemSchema).default([]),
  fromLocalStorage: z.boolean().optional(),
});

const updateWatchlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  categories: z.array(z.string()).optional(),
  items: z.array(watchlistItemSchema).optional(),
});

const addCollaboratorSchema = z.object({
  email: z.string().email(),
});

const addItemSchema = z.object({
  tmdbId: z.string(),
  type: z.enum(['movie', 'tv']),
  language: z.string().default('fr-FR'),
  region: z.string().default('FR'),
});

const moveItemSchema = z.object({
  position: z.enum(['first', 'last']),
});

const reorderItemsSchema = z.object({
  orderedTmdbIds: z.array(z.string()),
});

const reorderWatchlistsSchema = z.object({
  orderedWatchlistIds: z.array(z.string()),
});

export async function getMyWatchlists(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;

    // Get user to access savedWatchlists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Find all watchlists where user is owner or collaborator
    const ownedOrCollaborated = await Watchlist.find({
      $or: [{ ownerId: userId }, { collaborators: userId }],
    }).sort({ displayOrder: 1, createdAt: -1 });

    // Find all saved watchlists
    const saved = user.savedWatchlists.length > 0
      ? await Watchlist.find({
          _id: { $in: user.savedWatchlists },
        }).populate('ownerId', 'username email')
      : [];

    // Merge and deduplicate (prioritize owned/collaborated watchlists over saved)
    const watchlistsMap = new Map<string, any>();
    const savedIds = new Set(saved.map(w => (w._id as Types.ObjectId).toString()));

    // Add owned/collaborated first (higher priority)
    ownedOrCollaborated.forEach(w => {
      const idStr = (w._id as Types.ObjectId).toString();
      const watchlistObj = w.toObject();
      // Check if user is the owner
      const ownerId = (w.ownerId as Types.ObjectId).toString();
      const isOwner = ownerId === userId;
      watchlistObj.isOwner = isOwner;
      // Mark as saved if it's also in the saved list
      watchlistObj.isSaved = savedIds.has(idStr);
      watchlistsMap.set(idStr, watchlistObj);
    });

    // Add saved watchlists (won't override if already exists)
    saved.forEach(w => {
      const idStr = (w._id as Types.ObjectId).toString();
      if (!watchlistsMap.has(idStr)) {
        const watchlistObj = w.toObject();
        watchlistObj.isOwner = false; // User is not owner (it's a followed watchlist)
        watchlistObj.isSaved = true;
        watchlistsMap.set(idStr, watchlistObj);
      }
    });

    const watchlists = Array.from(watchlistsMap.values());

    res.json({ watchlists });
  } catch (error) {
    throw error;
  }
}

export async function createWatchlist(req: Request, res: Response): Promise<void> {
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
      categories: data.categories,
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

export async function updateWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const data = updateWatchlistSchema.parse(req.body);

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Check if user is owner or collaborator
    const isOwner = watchlist.ownerId.toString() === userId;
    const isCollaborator = watchlist.collaborators.some(c => c.toString() === userId);

    if (!isOwner && !isCollaborator) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Update fields
    if (data.name) watchlist.name = data.name;
    if (data.description !== undefined) watchlist.description = data.description;
    if (data.isPublic !== undefined) watchlist.isPublic = data.isPublic;
    if (data.categories !== undefined) watchlist.categories = data.categories;
    if (data.items) {
      // Transform items to ensure addedAt is a Date and platformList is properly formatted
      watchlist.items = data.items.map(item => {
        // Clean up platformList to ensure it's in the correct format
        const cleanedPlatformList = (item.platformList || [])
          .filter((p: any) => p !== null && p !== undefined)
          .map((p: any) => {
            if (typeof p === 'string') {
              return p.trim() ? { name: p, logoPath: '' } : null;
            }
            if (
              p &&
              typeof p === 'object' &&
              p.name &&
              typeof p.name === 'string' &&
              p.name.trim()
            ) {
              return { name: p.name, logoPath: p.logoPath || '' };
            }
            return null;
          })
          .filter((p: any): p is { name: string; logoPath: string } => p !== null);

        return {
          tmdbId: item.tmdbId,
          title: item.title,
          posterUrl: item.posterUrl,
          type: item.type,
          runtime: item.runtime,
          numberOfSeasons: item.numberOfSeasons,
          numberOfEpisodes: item.numberOfEpisodes,
          platformList:
            cleanedPlatformList.length > 0
              ? cleanedPlatformList
              : [{ name: 'Inconnu', logoPath: '' }],
          addedAt: item.addedAt
            ? item.addedAt instanceof Date
              ? item.addedAt
              : new Date(item.addedAt)
            : new Date(),
        };
      });
    }

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

export async function deleteWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

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

export async function createShareLink(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

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

export async function addCollaborator(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const { email } = addCollaboratorSchema.parse(req.body);

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

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
    if (watchlist.collaborators.some(c => c.toString() === collaborator._id.toString())) {
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

export async function getPublicWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    const watchlist = await Watchlist.findById(id).populate('ownerId', 'email username');

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

// Get featured/community public watchlists (for homepage)
export async function getPublicWatchlists(req: Request, res: Response): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 6, 12);

    const watchlists = await Watchlist.find({
      isPublic: true,
    })
      .populate('ownerId', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('_id name description imageUrl items ownerId createdAt');

    res.json({ watchlists });
  } catch (error) {
    throw error;
  }
}

// Get public watchlists by category
export async function getWatchlistsByCategory(req: Request, res: Response): Promise<void> {
  try {
    const { category } = req.params;

    if (!category || category.trim().length === 0) {
      res.status(400).json({ error: 'Category parameter is required' });
      return;
    }

    const watchlists = await Watchlist.find({
      isPublic: true,
      categories: category,
    })
      .populate('ownerId', 'username email')
      .sort({ createdAt: -1 })
      .select('_id name description imageUrl items categories ownerId createdAt');

    res.json({ watchlists });
  } catch (error) {
    throw error;
  }
}

// Get count of public watchlists by category
export async function getWatchlistCountByCategory(req: Request, res: Response): Promise<void> {
  try {
    const { category } = req.params;

    if (!category || category.trim().length === 0) {
      res.status(400).json({ error: 'Category parameter is required' });
      return;
    }

    const count = await Watchlist.countDocuments({
      isPublic: true,
      categories: category,
    });

    res.json({ category, count });
  } catch (error) {
    throw error;
  }
}

// Get a single watchlist by ID (with permission check)
export async function getWatchlistById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    const watchlist = await Watchlist.findById(id).populate('ownerId', 'email username');

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Check if user has access (owner, collaborator, or public)
    const isOwner = watchlist.ownerId._id.toString() === userId;
    const isCollaborator = watchlist.collaborators.some(c => c.toString() === userId);
    const isPublic = watchlist.isPublic;

    if (!isOwner && !isCollaborator && !isPublic) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check if watchlist is saved by the user
    const user = await User.findById(userId);
    const isSaved = user?.savedWatchlists?.some(
      savedId => (savedId as Types.ObjectId).toString() === id
    ) || false;

    res.json({ watchlist, isSaved });
  } catch (error) {
    throw error;
  }
}

// Add an item to a watchlist (enriched with TMDB data)
export async function addItemToWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const data = addItemSchema.parse(req.body);

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Check if user is owner or collaborator
    const isOwner = watchlist.ownerId.toString() === userId;
    const isCollaborator = watchlist.collaborators.some(c => c.toString() === userId);

    if (!isOwner && !isCollaborator) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Check if item already exists
    const itemExists = watchlist.items.some(item => item.tmdbId === data.tmdbId);
    if (itemExists) {
      res.status(400).json({ error: 'Item already exists in watchlist' });
      return;
    }

    // Enrich media data with TMDB
    const enrichedData = await enrichMediaData(data.tmdbId, data.type, data.language, data.region);

    if (!enrichedData) {
      res.status(500).json({ error: 'Failed to fetch media details from TMDB' });
      return;
    }

    // Add item to watchlist
    watchlist.items.push({
      tmdbId: enrichedData.tmdbId,
      title: enrichedData.title,
      posterUrl: enrichedData.posterUrl,
      type: enrichedData.type,
      platformList: enrichedData.platformList,
      runtime: enrichedData.runtime,
      numberOfSeasons: enrichedData.numberOfSeasons,
      numberOfEpisodes: enrichedData.numberOfEpisodes,
      addedAt: new Date(),
    });

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

// Remove an item from a watchlist
export async function removeItemFromWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id, tmdbId } = req.params;

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Check if user is owner or collaborator
    const isOwner = watchlist.ownerId.toString() === userId;
    const isCollaborator = watchlist.collaborators.some(c => c.toString() === userId);

    if (!isOwner && !isCollaborator) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Remove item
    const initialLength = watchlist.items.length;
    watchlist.items = watchlist.items.filter(item => item.tmdbId !== tmdbId);

    if (watchlist.items.length === initialLength) {
      res.status(404).json({ error: 'Item not found in watchlist' });
      return;
    }

    await watchlist.save();

    res.json({ watchlist });
  } catch (error) {
    throw error;
  }
}

// Move an item to first or last position
export async function moveItemPosition(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id, tmdbId } = req.params;
    const { position } = moveItemSchema.parse(req.body);

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Check if user is owner or collaborator
    const isOwner = watchlist.ownerId.toString() === userId;
    const isCollaborator = watchlist.collaborators.some(c => c.toString() === userId);

    if (!isOwner && !isCollaborator) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Find the item
    const itemIndex = watchlist.items.findIndex(item => item.tmdbId === tmdbId);
    if (itemIndex === -1) {
      res.status(404).json({ error: 'Item not found in watchlist' });
      return;
    }

    // Remove item from current position
    const [item] = watchlist.items.splice(itemIndex, 1);

    // Insert at new position
    if (position === 'first') {
      watchlist.items.unshift(item);
    } else {
      watchlist.items.push(item);
    }

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

// Reorder items in watchlist (for drag and drop)
export async function reorderItems(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const { orderedTmdbIds } = reorderItemsSchema.parse(req.body);

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Check if user is owner or collaborator
    const isOwner = watchlist.ownerId.toString() === userId;
    const isCollaborator = watchlist.collaborators.some(c => c.toString() === userId);

    if (!isOwner && !isCollaborator) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Create a map of items by tmdbId for quick lookup
    const itemsMap = new Map(watchlist.items.map(item => [item.tmdbId, item]));

    // Reorder items based on orderedTmdbIds and clean up data
    const reorderedItems = orderedTmdbIds
      .map(tmdbId => {
        const item = itemsMap.get(tmdbId);
        if (!item) return undefined;

        // Clean up platformList to ensure it's in the correct format
        const cleanedPlatformList = (item.platformList || [])
          .filter((p: any) => p !== null && p !== undefined)
          .map((p: any) => {
            if (typeof p === 'string') {
              return p.trim() ? { name: p, logoPath: '' } : null;
            }
            if (
              p &&
              typeof p === 'object' &&
              p.name &&
              typeof p.name === 'string' &&
              p.name.trim()
            ) {
              return { name: p.name, logoPath: p.logoPath || '' };
            }
            return null;
          })
          .filter((p: any): p is { name: string; logoPath: string } => p !== null);

        return {
          tmdbId: item.tmdbId,
          title: item.title,
          posterUrl: item.posterUrl,
          type: item.type,
          runtime: item.runtime,
          numberOfSeasons: item.numberOfSeasons,
          numberOfEpisodes: item.numberOfEpisodes,
          addedAt: item.addedAt,
          platformList:
            cleanedPlatformList.length > 0
              ? cleanedPlatformList
              : [{ name: 'Inconnu', logoPath: '' }],
        };
      })
      .filter(item => item !== undefined);

    // Ensure all items are present
    if (reorderedItems.length !== watchlist.items.length) {
      res.status(400).json({ error: 'Invalid item order: missing or extra items' });
      return;
    }

    watchlist.items = reorderedItems as any;
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

// Upload custom cover image to Cloudinary
export async function uploadCover(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    console.log('📸 [UPLOAD] Starting image upload for watchlist:', id);

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Only owner can upload cover
    if (watchlist.ownerId.toString() !== userId) {
      res.status(403).json({ error: 'Only owner can upload cover' });
      return;
    }

    // Check if file is provided
    if (!req.body.imageData) {
      console.error('❌ [UPLOAD] No image data provided');
      res.status(400).json({ error: 'No image data provided' });
      return;
    }

    console.log('📊 [UPLOAD] Image data received, length:', req.body.imageData.length);
    console.log('📊 [UPLOAD] Image data prefix:', req.body.imageData.substring(0, 50));

    // Validate image data format (must be base64 data URL)
    if (!req.body.imageData.startsWith('data:image/')) {
      console.error('❌ [UPLOAD] Invalid image format:', req.body.imageData.substring(0, 100));
      res.status(400).json({ error: 'Invalid image format. Must be a base64 data URL.' });
      return;
    }

    // Extract image type
    const imageType = req.body.imageData.match(/data:image\/([^;]+);/)?.[1];
    console.log('📊 [UPLOAD] Image type:', imageType);

    // Check Cloudinary configuration
    const cloudinaryConfig = cloudinary.config();
    console.log('☁️  [CLOUDINARY] Config check:', {
      cloud_name: cloudinaryConfig.cloud_name,
      api_key: cloudinaryConfig.api_key ? '✅ Set' : '❌ Missing',
      api_secret: cloudinaryConfig.api_secret ? '✅ Set' : '❌ Missing',
    });

    if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
      console.error('❌ [CLOUDINARY] Configuration incomplete!');
      res.status(500).json({
        error: 'Cloudinary not properly configured',
        details: 'Missing cloud_name, api_key, or api_secret',
      });
      return;
    }

    try {
      // Delete old image from Cloudinary if exists
      if (watchlist.imageUrl) {
        const oldPublicId = extractPublicIdFromUrl(watchlist.imageUrl);
        if (oldPublicId) {
          console.log('🗑️  [CLOUDINARY] Deleting old image:', oldPublicId);
          try {
            await cloudinary.uploader.destroy(oldPublicId);
            console.log('✅ [CLOUDINARY] Old image deleted successfully');
          } catch (deleteError: any) {
            // Log but don't fail - old image might already be deleted manually
            console.warn('⚠️  [CLOUDINARY] Failed to delete old image:', deleteError.message);
          }
        }
      }

      console.log('☁️  [CLOUDINARY] Uploading new image to Cloudinary...');

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.body.imageData, {
        folder: 'watchlists',
        width: 500,
        height: 500,
        crop: 'fill',
        resource_type: 'image',
      });

      console.log('✅ [CLOUDINARY] Upload successful:', result.secure_url);
      console.log('📊 [CLOUDINARY] Upload result:', {
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      });

      // Update watchlist with new image URL
      watchlist.imageUrl = result.secure_url;
      await watchlist.save();

      res.json({
        watchlist,
        imageUrl: result.secure_url,
      });
    } catch (cloudinaryError: any) {
      console.error('❌ [CLOUDINARY] Upload error:', {
        message: cloudinaryError.message,
        error: cloudinaryError.error,
        http_code: cloudinaryError.http_code,
        name: cloudinaryError.name,
      });
      res.status(500).json({
        error: 'Failed to upload image to Cloudinary',
        details: cloudinaryError.message || 'Unknown Cloudinary error',
        cloudinaryError: {
          message: cloudinaryError.message,
          code: cloudinaryError.http_code,
        },
      });
      return;
    }
  } catch (error: any) {
    console.error('❌ [UPLOAD] Error uploading cover:', error);
    res.status(500).json({
      error: 'Failed to upload cover image',
      details: error.message || 'Unknown error',
    });
  }
}

// Delete cover image from Cloudinary
export async function deleteCover(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    console.log('🗑️  [DELETE] Starting image deletion for watchlist:', id);

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Only owner can delete cover
    if (watchlist.ownerId.toString() !== userId) {
      res.status(403).json({ error: 'Only owner can delete cover' });
      return;
    }

    // Check if watchlist has an image
    if (!watchlist.imageUrl) {
      res.status(404).json({ error: 'No cover image to delete' });
      return;
    }

    // Extract public_id from URL
    const publicId = extractPublicIdFromUrl(watchlist.imageUrl);

    if (!publicId) {
      console.error('❌ [DELETE] Failed to extract public_id from URL:', watchlist.imageUrl);
      res.status(400).json({ error: 'Invalid image URL format' });
      return;
    }

    try {
      console.log('☁️  [CLOUDINARY] Deleting image:', publicId);

      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);

      console.log('📊 [CLOUDINARY] Delete result:', result);

      // Clear image URL from database
      watchlist.imageUrl = undefined;
      await watchlist.save();

      console.log('✅ [DELETE] Image deleted successfully');

      res.json({
        message: 'Cover image deleted successfully',
        watchlist,
      });
    } catch (cloudinaryError: any) {
      console.error('❌ [CLOUDINARY] Delete error:', {
        message: cloudinaryError.message,
        http_code: cloudinaryError.http_code,
      });
      res.status(500).json({
        error: 'Failed to delete image from Cloudinary',
        details: cloudinaryError.message || 'Unknown Cloudinary error',
      });
      return;
    }
  } catch (error: any) {
    console.error('❌ [DELETE] Error deleting cover:', error);
    res.status(500).json({
      error: 'Failed to delete cover image',
      details: error.message || 'Unknown error',
    });
  }
}

// Reorder user's watchlists (for drag and drop)
export async function reorderWatchlists(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { orderedWatchlistIds } = reorderWatchlistsSchema.parse(req.body);

    console.log('🔄 [REORDER] Reordering watchlists for user:', userId);
    console.log('📋 [REORDER] New order:', orderedWatchlistIds);

    // Update displayOrder for each watchlist
    const updatePromises = orderedWatchlistIds.map((watchlistId, index) =>
      Watchlist.findOneAndUpdate(
        {
          _id: watchlistId,
          $or: [{ ownerId: userId }, { collaborators: userId }],
        },
        { displayOrder: index },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    console.log('✅ [REORDER] Watchlists reordered successfully');

    res.json({ message: 'Watchlists reordered successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
}

// Search movies and TV shows via TMDB
export async function searchTMDB(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query.query as string;
    const language = (req.query.language as string) || 'fr-FR';
    const region = (req.query.region as string) || 'FR';
    const page = parseInt(req.query.page as string) || 1;

    if (!query || query.trim().length === 0) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }

    const results = await searchMedia(query, language, region, page);

    res.json(results);
  } catch (error) {
    console.error('Error searching TMDB:', error);
    res.status(500).json({ error: 'Failed to search media' });
  }
}

// Get full details for a specific media item (movie or TV show)
export async function getItemDetails(req: Request, res: Response): Promise<void> {
  try {
    const { tmdbId, type } = req.params;
    const language = (req.query.language as string) || 'fr-FR';

    if (!tmdbId || !type) {
      res.status(400).json({ error: 'tmdbId and type are required' });
      return;
    }

    if (type !== 'movie' && type !== 'tv') {
      res.status(400).json({ error: 'type must be either "movie" or "tv"' });
      return;
    }

    // console.log(`🔍 [ITEM DETAILS] Fetching details for ${type} ${tmdbId}`);

    const details = await getFullMediaDetails(tmdbId, type, language);

    if (!details) {
      res.status(404).json({ error: 'Media details not found' });
      return;
    }

    res.json({ details });
  } catch (error) {
    console.error('Error fetching item details:', error);
    res.status(500).json({ error: 'Failed to fetch media details' });
  }
}

// Save a public watchlist to user's library
export async function saveWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    const watchlist = await Watchlist.findById(id);

    if (!watchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Can only save public watchlists
    if (!watchlist.isPublic) {
      res.status(403).json({ error: 'Can only save public watchlists' });
      return;
    }

    // Cannot save your own watchlist
    if (watchlist.ownerId.toString() === userId) {
      res.status(400).json({ error: 'Cannot save your own watchlist' });
      return;
    }

    // Add to user's savedWatchlists
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already saved
    if (user.savedWatchlists.some(w => w.toString() === id)) {
      res.status(400).json({ error: 'Watchlist already saved' });
      return;
    }

    user.savedWatchlists.push(new Types.ObjectId(id));
    await user.save();

    res.json({ message: 'Watchlist saved successfully' });
  } catch (error) {
    throw error;
  }
}

// Unsave a watchlist from user's library
export async function unsaveWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove from savedWatchlists
    const initialLength = user.savedWatchlists.length;
    user.savedWatchlists = user.savedWatchlists.filter(w => w.toString() !== id);

    if (user.savedWatchlists.length === initialLength) {
      res.status(404).json({ error: 'Watchlist not in saved list' });
      return;
    }

    await user.save();

    res.json({ message: 'Watchlist removed from library' });
  } catch (error) {
    throw error;
  }
}

// Duplicate a public watchlist to user's personal space
export async function duplicateWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    if (!isValidWatchlistId(id)) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    const originalWatchlist = await Watchlist.findById(id);

    if (!originalWatchlist) {
      res.status(404).json({ error: 'Watchlist not found' });
      return;
    }

    // Can only duplicate public watchlists or ones you have access to
    const isOwner = originalWatchlist.ownerId.toString() === userId;
    const isCollaborator = originalWatchlist.collaborators.some(c => c.toString() === userId);

    if (!originalWatchlist.isPublic && !isOwner && !isCollaborator) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Cannot duplicate your own watchlist if you're the owner
    if (isOwner) {
      res.status(400).json({ error: 'Cannot duplicate your own watchlist' });
      return;
    }

    // Create a copy
    const duplicatedWatchlist = await Watchlist.create({
      ownerId: userId,
      name: `${originalWatchlist.name} (copy)`,
      description: originalWatchlist.description,
      isPublic: false, // Duplicates are private by default
      categories: originalWatchlist.categories,
      items: originalWatchlist.items,
    });

    res.status(201).json({ watchlist: duplicatedWatchlist });
  } catch (error) {
    throw error;
  }
}

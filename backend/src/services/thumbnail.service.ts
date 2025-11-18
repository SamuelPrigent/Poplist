import sharp from 'sharp';
import fetch from 'node-fetch';
import { v2 as cloudinary } from 'cloudinary';

const THUMBNAIL_SIZE = 500; // 500x500 total (250x250 per quadrant)
const POSTER_SIZE = 250; // Each poster is 250x250

/**
 * Download an image from URL and return buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

/**
 * Generate a 2x2 thumbnail grid from poster URLs
 * @param posterUrls Array of up to 4 poster URLs from TMDB
 * @returns Buffer containing the generated thumbnail as JPEG
 */
export async function generateThumbnail(posterUrls: string[]): Promise<Buffer> {
  // Create a blank 500x500 canvas
  const canvas = sharp({
    create: {
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE,
      channels: 3,
      background: { r: 24, g: 24, b: 27 }, // #18181b background
    },
  });

  // Download and prepare images
  const imageBuffers: Buffer[] = [];
  const postersToUse = posterUrls.slice(0, 4); // Max 4 images

  for (const url of postersToUse) {
    try {
      const buffer = await downloadImage(url);
      // Resize and crop to 250x250 with object-fit: cover effect
      const resized = await sharp(buffer)
        .resize(POSTER_SIZE, POSTER_SIZE, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();
      imageBuffers.push(resized);
    } catch (error) {
      console.error(`Failed to process image ${url}:`, error);
      // Create a blank gray square if image fails
      const blankSquare = await sharp({
        create: {
          width: POSTER_SIZE,
          height: POSTER_SIZE,
          channels: 3,
          background: { r: 39, g: 39, b: 42 }, // #27272a muted color
        },
      })
        .jpeg()
        .toBuffer();
      imageBuffers.push(blankSquare);
    }
  }

  // Fill remaining slots with blank squares if less than 4 images
  while (imageBuffers.length < 4) {
    const blankSquare = await sharp({
      create: {
        width: POSTER_SIZE,
        height: POSTER_SIZE,
        channels: 3,
        background: { r: 39, g: 39, b: 42 },
      },
    })
      .jpeg()
      .toBuffer();
    imageBuffers.push(blankSquare);
  }

  // Composite images into 2x2 grid
  const compositeOperations = imageBuffers.map((buffer, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    return {
      input: buffer,
      top: row * POSTER_SIZE,
      left: col * POSTER_SIZE,
    };
  });

  // Generate final thumbnail
  const thumbnail = await canvas
    .composite(compositeOperations)
    .jpeg({ quality: 85 })
    .toBuffer();

  return thumbnail;
}

/**
 * Upload thumbnail to Cloudinary
 * @param thumbnailBuffer Image buffer
 * @param watchlistId Watchlist ID for naming
 * @returns Cloudinary URL
 */
export async function uploadThumbnailToCloudinary(
  thumbnailBuffer: Buffer,
  watchlistId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'watchlist_thumbnails',
        public_id: `thumbnail_${watchlistId}`,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed: no result returned'));
        }
      }
    );

    // Write buffer to stream
    uploadStream.end(thumbnailBuffer);
  });
}

/**
 * Regenerate thumbnail for a watchlist (helper function)
 * Can be called after add/remove/reorder operations
 * @param watchlistId Watchlist ID
 * @param posterUrls Array of poster URLs (first 4)
 * @returns Cloudinary URL or null if no posters available
 */
export async function regenerateThumbnail(
  watchlistId: string,
  posterUrls: string[]
): Promise<string | null> {
  try {
    if (posterUrls.length === 0) {
      return null;
    }

    const thumbnailBuffer = await generateThumbnail(posterUrls);
    const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailBuffer, watchlistId);
    return thumbnailUrl;
  } catch (error) {
    console.error('Failed to regenerate thumbnail:', error);
    return null;
  }
}

/**
 * Delete thumbnail from Cloudinary
 * @param watchlistId Watchlist ID
 * @returns Promise<void>
 */
export async function deleteThumbnailFromCloudinary(
  watchlistId: string
): Promise<void> {
  try {
    const publicId = `watchlist_thumbnails/thumbnail_${watchlistId}`;
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted thumbnail for watchlist ${watchlistId} from Cloudinary`);
  } catch (error) {
    console.error('Failed to delete thumbnail from Cloudinary:', error);
    // Don't throw - deletion is not critical
  }
}

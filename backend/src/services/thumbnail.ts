import sharp from 'sharp'
import { cloudinary } from './cloudinary.js'

const THUMBNAIL_SIZE = 500
const POSTER_SIZE = 250

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer)
}

export async function generateThumbnail(posterUrls: string[]): Promise<Buffer> {
  const canvas = sharp({
    create: {
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE,
      channels: 3,
      background: { r: 24, g: 24, b: 27 },
    },
  })

  const imageBuffers: Buffer[] = []
  const postersToUse = posterUrls.slice(0, 4)

  for (const url of postersToUse) {
    try {
      const buffer = await downloadImage(url)
      const resized = await sharp(buffer)
        .resize(POSTER_SIZE, POSTER_SIZE, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer()
      imageBuffers.push(resized)
    } catch {
      const blankSquare = await sharp({
        create: {
          width: POSTER_SIZE,
          height: POSTER_SIZE,
          channels: 3,
          background: { r: 39, g: 39, b: 42 },
        },
      })
        .jpeg()
        .toBuffer()
      imageBuffers.push(blankSquare)
    }
  }

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
      .toBuffer()
    imageBuffers.push(blankSquare)
  }

  const compositeOperations = imageBuffers.map((buffer, index) => {
    const row = Math.floor(index / 2)
    const col = index % 2
    return {
      input: buffer,
      top: row * POSTER_SIZE,
      left: col * POSTER_SIZE,
    }
  })

  const thumbnail = await canvas.composite(compositeOperations).jpeg({ quality: 85 }).toBuffer()

  return thumbnail
}

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
          reject(error)
        } else if (result) {
          resolve(result.secure_url)
        } else {
          reject(new Error('Upload failed: no result returned'))
        }
      }
    )

    uploadStream.end(thumbnailBuffer)
  })
}

export async function regenerateThumbnail(
  watchlistId: string,
  posterUrls: string[]
): Promise<string | null> {
  try {
    if (posterUrls.length === 0) {
      return null
    }

    const thumbnailBuffer = await generateThumbnail(posterUrls)
    const thumbnailUrl = await uploadThumbnailToCloudinary(thumbnailBuffer, watchlistId)
    return thumbnailUrl
  } catch (error) {
    console.error('Failed to regenerate thumbnail:', error)
    return null
  }
}

export async function deleteThumbnailFromCloudinary(watchlistId: string): Promise<void> {
  try {
    const publicId = `watchlist_thumbnails/thumbnail_${watchlistId}`
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Failed to delete thumbnail from Cloudinary:', error)
  }
}

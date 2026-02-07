import { v2 as cloudinary } from 'cloudinary'
import { env } from '../env.js'

// Explicit config from env (don't rely on auto-detect)
const cloudinaryUrl = new URL(env.CLOUDINARY_URL.replace('cloudinary://', 'https://'))
cloudinary.config({
  cloud_name: cloudinaryUrl.hostname,
  api_key: decodeURIComponent(cloudinaryUrl.username),
  api_secret: decodeURIComponent(cloudinaryUrl.password),
})

export function extractPublicIdFromUrl(imageUrl: string): string | null {
  try {
    // Handle URLs with or without transformations:
    // .../upload/v123/folder/file.jpg
    // .../upload/w_200,h_200/v123/folder/file.jpg
    const uploadIndex = imageUrl.indexOf('/upload/')
    if (uploadIndex === -1) return null

    let pathAfterUpload = imageUrl.slice(uploadIndex + '/upload/'.length)

    // Strip transformation segments (e.g. w_200,h_200,c_fill/)
    // Transformations contain commas or start with known prefixes
    const segments = pathAfterUpload.split('/')
    const cleanSegments: string[] = []
    for (const seg of segments) {
      if (seg.includes(',') || /^[a-z]_/.test(seg)) continue // transformation
      if (/^v\d+$/.test(seg)) continue // version
      cleanSegments.push(seg)
    }

    if (cleanSegments.length === 0) return null

    // Remove file extension from last segment
    const last = cleanSegments[cleanSegments.length - 1]
    const dotIndex = last.lastIndexOf('.')
    if (dotIndex > 0) {
      cleanSegments[cleanSegments.length - 1] = last.slice(0, dotIndex)
    }

    return cleanSegments.join('/')
  } catch {
    return null
  }
}

export async function deleteFromCloudinary(imageUrl: string): Promise<boolean> {
  const publicId = extractPublicIdFromUrl(imageUrl)
  if (!publicId) {
    console.warn('[Cloudinary] Could not extract public_id from:', imageUrl)
    return false
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId)
    if (result.result !== 'ok') {
      console.warn(`[Cloudinary] destroy(${publicId}):`, result.result)
    }
    return result.result === 'ok'
  } catch (error) {
    console.error(`[Cloudinary] Failed to delete ${publicId}:`, error)
    return false
  }
}

export { cloudinary }

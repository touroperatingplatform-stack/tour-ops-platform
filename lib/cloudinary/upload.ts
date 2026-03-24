/**
 * Cloudinary Upload Utility
 * 
 * Uploads images to Cloudinary and returns the URL
 * 
 * Usage:
 *   const url = await uploadToCloudinary(file, 'incidents')
 */

const CLOUDINARY_CLOUD_NAME = 'dorhbpsxy'
const CLOUDINARY_API_KEY = '933486393815468'
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET // Set in .env.local

/**
 * Upload file to Cloudinary
 * 
 * @param file - File object from input
 * @param folder - Folder path in Cloudinary (e.g., 'tour-ops/incidents')
 * @returns Cloudinary URL or null on error
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'tour-ops'
): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'tour-ops-unsigned') // Create this preset in Cloudinary
  formData.append('folder', folder)

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const data = await response.json()
    return data.secure_url // https://res.cloudinary.com/.../image.jpg
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return null
  }
}

/**
 * Generate Cloudinary URL from public ID
 */
export function getCloudinaryUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`
}

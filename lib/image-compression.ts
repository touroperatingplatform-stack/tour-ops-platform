/**
 * Image Compression Utility
 * Compresses images client-side before upload to prevent memory issues
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxFileSizeMB?: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.7,
  maxFileSizeMB: 1
}

/**
 * Compress an image file before upload
 * @param file Original image file
 * @param options Compression settings
 * @returns Compressed File (as Blob converted to File)
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // If file is already small enough, return as-is
  if (file.size < opts.maxFileSizeMB! * 1024 * 1024) {
    // Still resize if dimensions are too large
    return resizeImage(file, opts)
  }
  
  return resizeImage(file, opts)
}

/**
 * Resize image using canvas
 */
function resizeImage(file: File, options: CompressionOptions): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const img = new Image()
    
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Calculate new dimensions
      let { width, height } = img
      const { maxWidth, maxHeight } = options
      
      if (maxWidth && width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (maxHeight && height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw with better quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to blob
      const quality = options.quality || 0.8
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not create blob'))
            return
          }
          
          // Create new file from blob
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          
          console.log('Image compressed:', {
            original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
            compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
            dimensions: `${width}x${height}`
          })
          
          resolve(compressedFile)
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = () => reject(new Error('Could not load image'))
    reader.onerror = () => reject(new Error('Could not read file'))
    
    reader.readAsDataURL(file)
  })
}

/**
 * Create a thumbnail preview
 */
export async function createThumbnail(
  file: File,
  maxSize: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const img = new Image()
    
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      let { width, height } = img
      
      if (width > height) {
        height = (height * maxSize) / width
        width = maxSize
      } else {
        width = (width * maxSize) / height
        height = maxSize
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    
    img.onerror = () => reject(new Error('Could not create thumbnail'))
    reader.onerror = () => reject(new Error('Could not read file'))
    
    reader.readAsDataURL(file)
  })
}

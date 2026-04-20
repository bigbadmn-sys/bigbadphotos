// Max longest-edge in pixels for the display copy.
// 1920px covers full HD and looks sharp on retina at the viewer size.
const MAX_DISPLAY_PX = 1920

// JPEG quality for the resized display blob (0–1).
const DISPLAY_QUALITY = 0.88

/**
 * Load a File into a canvas, resize if larger than MAX_DISPLAY_PX,
 * and return a blob: URL pointing to the resized copy.
 *
 * The original File is never modified.
 *
 * @param {File} file
 * @returns {Promise<string>} blob URL — caller must revoke when done
 */
export function createDisplayUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const tempUrl = URL.createObjectURL(file)

    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img

      // Skip resize if already within limit
      if (w <= MAX_DISPLAY_PX && h <= MAX_DISPLAY_PX) {
        URL.revokeObjectURL(tempUrl)
        // Re-create from file so we own the lifecycle
        resolve(URL.createObjectURL(file))
        return
      }

      const scale = Math.min(MAX_DISPLAY_PX / w, MAX_DISPLAY_PX / h)
      const dw = Math.round(w * scale)
      const dh = Math.round(h * scale)

      const canvas = document.createElement('canvas')
      canvas.width = dw
      canvas.height = dh

      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, dw, dh)

      URL.revokeObjectURL(tempUrl)

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('canvas.toBlob failed')); return }
          resolve(URL.createObjectURL(blob))
        },
        'image/jpeg',
        DISPLAY_QUALITY,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl)
      reject(new Error(`Failed to decode ${file.name}`))
    }

    img.src = tempUrl
  })
}

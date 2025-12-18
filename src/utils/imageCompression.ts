export async function compressImage(file: File, maxSizeMB: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions (max 1920x1920)
        const maxDimension = 1920
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width
          width = maxDimension
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height
          height = maxDimension
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Start with quality 0.8 and reduce if needed
        let quality = 0.8
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            
            // If still too large, reduce quality further
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
              quality -= 0.1
              canvas.toBlob(
                (newBlob) => {
                  if (!newBlob) {
                    reject(new Error('Failed to compress image'))
                    return
                  }
                  const compressedFile = new File(
                    [newBlob],
                    file.name.replace(/\.[^.]+$/, '.jpg'),
                    { type: 'image/jpeg' }
                  )
                  resolve(compressedFile)
                },
                'image/jpeg',
                quality
              )
            } else {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'),
                { type: 'image/jpeg' }
              )
              resolve(compressedFile)
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
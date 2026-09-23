export type FaceValidationResult = {
  supported: boolean
  hasFace: boolean
}

type FaceDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<unknown[]>
}

type FaceDetectorConstructor = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorInstance

export async function validateStudentFace(dataUrl: string): Promise<FaceValidationResult> {
  const Detector = (window as typeof window & { FaceDetector?: FaceDetectorConstructor }).FaceDetector
  if (!Detector) return { supported: false, hasFace: false }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Nao foi possivel analisar a foto.'))
    element.src = dataUrl
  })

  const detector = new Detector({ fastMode: false, maxDetectedFaces: 2 })
  const faces = await detector.detect(image)
  return { supported: true, hasFace: faces.length > 0 }
}

export async function preparePhotoFile(file: File, maxSide = 900): Promise<string> {
  if (file.type && !file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.')
  if (file.size > 12 * 1024 * 1024) throw new Error('A foto deve ter no maximo 12 MB.')

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Nao foi possivel abrir essa foto.'))
      element.src = objectUrl
    })
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Nao foi possivel preparar essa foto.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.78)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

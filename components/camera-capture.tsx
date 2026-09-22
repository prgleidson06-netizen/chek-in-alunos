'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCw, Upload, Video, X } from 'lucide-react'
import { useApp } from '@/components/app-provider'

interface CameraCaptureProps {
  onCapture: (photo: string) => void
  currentPhoto?: string
}

const MAX_PHOTO_SIDE = 760
const PHOTO_QUALITY = 0.74
const MAX_INPUT_BYTES = 12 * 1024 * 1024

function canvasToJpeg(canvas: HTMLCanvasElement) {
  return canvas.toDataURL('image/jpeg', PHOTO_QUALITY)
}

async function fileToCompressedDataUrl(file: File): Promise<string> {
  // Some Android document/camera providers omit the MIME type even for valid images.
  // Let the browser decoder validate those files instead of rejecting them up front.
  if (file.type && !file.type.startsWith('image/')) throw new Error('Please select an image file')
  if (file.size > MAX_INPUT_BYTES) throw new Error('Image size must be less than 12MB')

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to read the image file'))
      img.src = objectUrl
    })

    const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height))
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale))
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare image')
    ctx.drawImage(image, 0, 0, width, height)
    return canvasToJpeg(canvas)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function CameraCapture({ onCapture, currentPhoto }: CameraCaptureProps) {
  const { t } = useApp()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photo, setPhoto] = useState<string>(currentPhoto || '')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [error, setError] = useState<string>('')
  const [isReadingFile, setIsReadingFile] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown')

  useEffect(() => {
    setPhoto(currentPhoto || '')
  }, [currentPhoto])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((result) => {
          setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
          result.onchange = () => setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
        })
        .catch(() => setPermissionStatus('unknown'))
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) stream.getTracks().forEach((track) => track.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setStream(null)
    setIsCameraActive(false)
    setIsCameraReady(false)
  }, [stream])

  const startCamera = useCallback(async () => {
    try {
      setError('')
      setIsCameraReady(false)
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t.cameraNotSupported || 'Camera not supported in this browser')
        return
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      })
      setStream(mediaStream)
      setIsCameraActive(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError(t.cameraPermissionDenied || 'Camera permission denied. Please allow camera access in your browser settings.')
      } else if (message.includes('NotFoundError')) {
        setError(t.cameraNotFound || 'No camera found on this device.')
      } else {
        setError(t.cameraError || `Could not access camera: ${message}`)
      }
    }
  }, [t])

  // The video element is rendered only after isCameraActive changes. Connecting
  // the stream here avoids the render race that can leave Android stuck on
  // "Starting camera..." with an empty videoRef.
  useEffect(() => {
    const video = videoRef.current
    if (!stream || !isCameraActive || !video) return

    video.srcObject = stream
    let cancelled = false

    const startPreview = async () => {
      try {
        await video.play()
        if (!cancelled) setIsCameraReady(true)
      } catch {
        if (!cancelled) setError('Não foi possível iniciar a câmera. Use Enviar foto como alternativa.')
      }
    }

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) void startPreview()
    else video.onloadedmetadata = () => void startPreview()

    return () => {
      cancelled = true
      video.onloadedmetadata = null
      if (video.srcObject === stream) video.srcObject = null
    }
  }, [stream, isCameraActive])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sourceWidth = video.videoWidth || 640
    const sourceHeight = video.videoHeight || 480
    const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(sourceWidth, sourceHeight))
    canvas.width = Math.max(1, Math.round(sourceWidth * scale))
    canvas.height = Math.max(1, Math.round(sourceHeight * scale))
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvasToJpeg(canvas)
    setPhoto(dataUrl)
    onCapture(dataUrl)
    setError('')
    stopCamera()
  }, [onCapture, stopCamera])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsReadingFile(true)
    setError('')
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setPhoto(dataUrl)
      onCapture(dataUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to read the image file')
    } finally {
      setIsReadingFile(false)
    }
  }

  const retakePhoto = () => {
    setPhoto('')
    onCapture('')
    setError('')
  }

  useEffect(() => () => {
    if (stream) stream.getTracks().forEach((track) => track.stop())
  }, [stream])

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] bg-secondary rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-border">
        {photo ? (
          <img src={photo} alt="Student" className="w-full h-full object-cover" />
        ) : isCameraActive ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!isCameraReady && <div className="absolute inset-0 bg-secondary flex items-center justify-center"><div className="text-center text-muted-foreground"><Video className="w-12 h-12 mx-auto mb-2 animate-pulse" /><p>{t.startingCamera || 'Starting camera...'}</p></div></div>}
          </>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t.studentPhoto}</p>
            <p className="text-sm mt-2">{isReadingFile ? 'Preparando foto...' : (t.takeOrUploadPhoto || 'Take a photo or upload an image')}</p>
            {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-red-500 text-sm">{error}</p></div>}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <img src="/images/fju-logo.png" alt="" className="w-32" />
        </div>

        {isCameraActive && <Button type="button" variant="ghost" size="icon" onClick={stopCamera} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"><X className="w-4 h-4" /></Button>}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

      <div className="flex gap-2">
        {photo ? (
          <>
            <Button type="button" variant="outline" onClick={retakePhoto} className="flex-1"><RefreshCw className="w-4 h-4 mr-2" />{t.retakePhoto}</Button>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1" disabled={isReadingFile}><Upload className="w-4 h-4 mr-2" />{t.uploadPhoto}</Button>
          </>
        ) : isCameraActive ? (
          <>
            <Button type="button" onClick={capturePhoto} disabled={!isCameraReady} className="flex-1 bg-primary hover:bg-primary/90"><Camera className="w-4 h-4 mr-2" />{t.takePhoto}</Button>
            <Button type="button" variant="outline" onClick={stopCamera} className="flex-1"><X className="w-4 h-4 mr-2" />{t.cancel}</Button>
          </>
        ) : (
          <>
            <Button type="button" onClick={startCamera} className="flex-1 bg-primary hover:bg-primary/90"><Camera className="w-4 h-4 mr-2" />{t.takePhoto}</Button>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1" disabled={isReadingFile}><Upload className="w-4 h-4 mr-2" />{isReadingFile ? 'Preparando...' : t.uploadPhoto}</Button>
          </>
        )}
      </div>

      {permissionStatus === 'denied' && !photo && <p className="text-xs text-muted-foreground text-center">{t.cameraPermissionHint || 'Camera access was denied. Please enable it in your browser settings or upload a photo instead.'}</p>}
    </div>
  )
}

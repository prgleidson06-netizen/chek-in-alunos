'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCw, Upload, Video, X } from 'lucide-react'
import { useApp } from '@/components/app-provider'

interface CameraCaptureProps {
  onCapture: (photo: string) => void
  currentPhoto?: string
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
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown')

  // Check camera permission status
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((result) => {
          setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
          result.onchange = () => {
            setPermissionStatus(result.state as 'prompt' | 'granted' | 'denied')
          }
        })
        .catch(() => {
          setPermissionStatus('unknown')
        })
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setError('')
      setIsCameraReady(false)
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(t.cameraNotSupported || 'Camera not supported in this browser')
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false,
      })
      
      setStream(mediaStream)
      setIsCameraActive(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => setIsCameraReady(true))
            .catch(err => {
              console.error('Video play error:', err)
              setError('Failed to start video preview')
            })
        }
      }
    } catch (err: unknown) {
      console.error('Camera error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError(t.cameraPermissionDenied || 'Camera permission denied. Please allow camera access in your browser settings.')
      } else if (errorMessage.includes('NotFoundError')) {
        setError(t.cameraNotFound || 'No camera found on this device.')
      } else {
        setError(t.cameraError || `Could not access camera: ${errorMessage}`)
      }
    }
  }, [t])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setIsCameraReady(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    
    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPhoto(dataUrl)
    onCapture(dataUrl)
    stopCamera()
  }, [onCapture, stopCamera])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setPhoto(dataUrl)
      onCapture(dataUrl)
      setError('')
    }
    reader.onerror = () => {
      setError('Failed to read the image file')
    }
    reader.readAsDataURL(file)
  }

  const retakePhoto = () => {
    setPhoto('')
    onCapture('')
    setError('')
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] bg-secondary rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-border">
        {photo ? (
          <img src={photo} alt="Student" className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : isCameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isCameraReady && (
              <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Video className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                  <p>{t.startingCamera || 'Starting camera...'}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t.studentPhoto}</p>
            <p className="text-sm mt-2">{t.takeOrUploadPhoto || 'Take a photo or upload an image'}</p>
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}
        
        {/* FJU Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <img src="/images/fju-logo.png" alt="" className="w-32" />
        </div>

        {/* Close camera button */}
        {isCameraActive && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={stopCamera}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex gap-2">
        {photo ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={retakePhoto}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.retakePhoto}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.uploadPhoto}
            </Button>
          </>
        ) : isCameraActive ? (
          <>
            <Button
              type="button"
              onClick={capturePhoto}
              disabled={!isCameraReady}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Camera className="w-4 h-4 mr-2" />
              {t.takePhoto}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={stopCamera}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              {t.cancel}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={startCamera}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Camera className="w-4 h-4 mr-2" />
              {t.takePhoto}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.uploadPhoto}
            </Button>
          </>
        )}
      </div>

      {/* Permission hint */}
      {permissionStatus === 'denied' && !photo && (
        <p className="text-xs text-muted-foreground text-center">
          {t.cameraPermissionHint || 'Camera access was denied. Please enable it in your browser settings or upload a photo instead.'}
        </p>
      )}
    </div>
  )
}

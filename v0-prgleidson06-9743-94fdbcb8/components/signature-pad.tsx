'use client'

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'

interface SignaturePadProps {
  onSignature: (signature: string) => void
  width?: number
  height?: number
}

export interface SignaturePadRef {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: () => string
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  function SignaturePad({ onSignature, width = 400, height = 150 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set up canvas
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }, [])

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      if ('touches' in e) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        }
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return

      setIsDrawing(true)
      const { x, y } = getCoordinates(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      if (!isDrawing) return

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx) return

      const { x, y } = getCoordinates(e)
      ctx.lineTo(x, y)
      ctx.stroke()
      setHasSignature(true)
    }

    const stopDrawing = () => {
      setIsDrawing(false)
      if (hasSignature && canvasRef.current) {
        onSignature(canvasRef.current.toDataURL())
      }
    }

    const clear = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx || !canvas) return

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setHasSignature(false)
      onSignature('')
    }

    useImperativeHandle(ref, () => ({
      clear,
      isEmpty: () => !hasSignature,
      toDataURL: () => canvasRef.current?.toDataURL() || '',
    }))

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-border rounded-md touch-none bg-white cursor-crosshair w-full"
        style={{ maxWidth: width }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    )
  }
)

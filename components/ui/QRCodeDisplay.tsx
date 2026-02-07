'use client'

import { useQRCode } from 'next-qrcode'
import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface QRCodeDisplayProps {
    value: string
    size?: number
    name?: string
}

export function QRCodeDisplay({ value, size = 200, name }: QRCodeDisplayProps) {
    const { Canvas } = useQRCode()

    const handleDownload = () => {
        const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement
        if (canvas) {
            const link = document.createElement('a')
            link.download = `qr-${name || value}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
            toast.success('QR Code downloaded!')
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement
                if (canvas) {
                    const blob = await new Promise<Blob>((resolve) => {
                        canvas.toBlob((blob) => resolve(blob!), 'image/png')
                    })
                    const file = new File([blob], `qr-${name || value}.png`, { type: 'image/png' })
                    await navigator.share({
                        files: [file],
                        title: 'GDG Attendance QR Code',
                        text: `QR Code for ${name || 'attendee'}`,
                    })
                }
            } catch {
                toast.error('Failed to share')
            }
        } else {
            // Fallback: copy URL
            await navigator.clipboard.writeText(value)
            toast.success('ID copied to clipboard!')
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                id="qr-canvas"
                className="overflow-hidden rounded-xl bg-white p-4"
            >
                <Canvas
                    text={value}
                    options={{
                        errorCorrectionLevel: 'M',
                        margin: 2,
                        scale: 4,
                        width: size,
                        color: {
                            dark: '#09090b',
                            light: '#ffffff',
                        },
                    }}
                />
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-2"
                >
                    <Download className="h-4 w-4" />
                    Download
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="gap-2"
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </div>
        </div>
    )
}

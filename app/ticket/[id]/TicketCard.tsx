'use client'

import { Attendee } from '@/types/database.types'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { Download, Share2, Ticket, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface TicketCardProps {
    attendee: Attendee
}

const categoryColors: Record<string, { bg: string; text: string; glow: string }> = {
    Team: { bg: 'bg-[#4285F4]', text: 'text-white', glow: 'shadow-[#4285F4]/50' },
    Student: { bg: 'bg-[#34A853]', text: 'text-white', glow: 'shadow-[#34A853]/50' },
    Guest: { bg: 'bg-[#FBBC05]', text: 'text-black', glow: 'shadow-[#FBBC05]/50' },
}

export function TicketCard({ attendee }: TicketCardProps) {
    const colors = categoryColors[attendee.category] || categoryColors.Guest

    const handleShare = async () => {
        const url = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${attendee.full_name} - GDG Event Ticket`,
                    text: 'Check out my digital event ticket!',
                    url,
                })
            } catch {
                // User cancelled or share failed
            }
        } else {
            await navigator.clipboard.writeText(url)
            toast.success('Link copied to clipboard!')
        }
    }

    const handleDownload = () => {
        const svg = document.querySelector('#ticket-qr-code svg') as SVGSVGElement
        if (!svg) {
            toast.error('Could not find QR code')
            return
        }

        // Create a canvas and draw the SVG
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const svgData = new XMLSerializer().serializeToString(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        const img = new window.Image()
        img.onload = () => {
            // Add padding for the white background
            const padding = 32
            canvas.width = img.width + padding * 2
            canvas.height = img.height + padding * 2

            // Fill white background
            if (ctx) {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, padding, padding)
            }

            URL.revokeObjectURL(url)

            // Download the image
            const link = document.createElement('a')
            link.download = `ticket-${attendee.full_name.replace(/\s+/g, '-')}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
            toast.success('QR Code downloaded!')
        }
        img.onerror = () => {
            toast.error('Failed to generate image')
            URL.revokeObjectURL(url)
        }
        img.src = url
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-sm"
        >
            {/* Ticket Container */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#18181b] to-[#09090b] p-1 shadow-2xl ${colors.glow}`}>
                {/* Inner Card */}
                <div className="relative rounded-[22px] bg-gradient-to-br from-[#18181b] via-[#1a1a1f] to-[#18181b] p-6">
                    {/* Glowing Border Effect */}
                    <div className="absolute inset-0 rounded-[22px] opacity-20 bg-gradient-to-br from-primary via-transparent to-primary" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                                <Ticket className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">GDG DevFest</h2>
                                <p className="text-xs text-muted-foreground">Digital Event Pass</p>
                            </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${colors.bg} ${colors.text}`}>
                            {attendee.category}
                        </span>
                    </div>

                    {/* Decorative Line */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-dashed border-muted-foreground/30" />
                        </div>
                        <div className="absolute -left-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#09090b]" />
                        <div className="absolute -right-8 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#09090b]" />
                    </div>

                    {/* QR Code */}
                    <motion.div
                        id="ticket-qr-code"
                        className="flex justify-center mb-6"
                        whileHover={{ scale: 1.02 }}
                    >
                        <div className="rounded-2xl bg-white p-4 shadow-lg">
                            <QRCodeSVG
                                value={attendee.id}
                                size={180}
                                level="H"
                                includeMargin={false}
                                bgColor="#ffffff"
                                fgColor="#000000"
                            />
                        </div>
                    </motion.div>

                    {/* Name & Email */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-foreground mb-1">
                            {attendee.full_name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {attendee.email}
                        </p>
                        {attendee.organization && (
                            <p className="mt-1 text-xs text-muted-foreground/70">
                                {attendee.organization}
                            </p>
                        )}
                    </div>

                    {/* Bottom Section */}
                    <div className="space-y-4">
                        {/* Event Date Placeholder */}
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Present this QR at the event</span>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
                    <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
                </div>
            </div>

            {/* Footer Note */}
            <p className="mt-4 text-center text-xs text-muted-foreground/60">
                Powered by GDG Attendance System
            </p>
        </motion.div>
    )
}

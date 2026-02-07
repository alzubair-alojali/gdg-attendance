'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'
import { Attendee } from '@/types/database.types'
import { Mail, Phone, Building, GraduationCap, User, Download, Share2, ExternalLink, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AttendeeSheetProps {
    attendee: Attendee | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const categoryColors: Record<string, { badge: string; gradient: string }> = {
    Team: {
        badge: 'bg-google-blue text-white',
        gradient: 'from-google-blue/20 via-google-blue/10 to-transparent',
    },
    Student: {
        badge: 'bg-google-green text-white',
        gradient: 'from-google-green/20 via-google-green/10 to-transparent',
    },
    Guest: {
        badge: 'bg-google-yellow text-black',
        gradient: 'from-google-yellow/20 via-google-yellow/10 to-transparent',
    },
}

export function AttendeeSheet({ attendee, open, onOpenChange }: AttendeeSheetProps) {
    const [ticketUrl, setTicketUrl] = useState('')

    useEffect(() => {
        if (attendee && typeof window !== 'undefined') {
            setTicketUrl(`${window.location.origin}/ticket/${attendee.id}`)
        }
    }, [attendee])

    if (!attendee) return null

    const colors = categoryColors[attendee.category] || categoryColors.Guest

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(ticketUrl)
        toast.success('Ticket link copied!', { description: 'Share this link with the attendee' })
    }

    const handleOpenTicket = () => {
        window.open(ticketUrl, '_blank')
    }

    const handleDownloadQR = () => {
        const svg = document.querySelector('#admin-qr-code svg') as SVGSVGElement
        if (!svg) return

        // Create a canvas and draw the SVG
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const svgData = new XMLSerializer().serializeToString(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        const img = new window.Image()
        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            ctx?.drawImage(img, 0, 0)
            URL.revokeObjectURL(url)

            const link = document.createElement('a')
            link.download = `ticket-qr-${attendee.full_name.replace(/\s+/g, '-')}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
            toast.success('QR Code downloaded!')
        }
        img.src = url
    }

    const handleShareQR = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${attendee.full_name}'s Event Ticket`,
                    text: 'Scan this QR code or open the link to view your digital ticket',
                    url: ticketUrl,
                })
            } catch {
                handleCopyLink()
            }
        } else {
            handleCopyLink()
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="text-left">
                    <SheetTitle className="text-xl font-semibold">Attendee Profile</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Profile Card Header with Gradient */}
                    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-card", `bg-gradient-to-br ${colors.gradient}`)}>
                        {/* Cover/Gradient Area */}
                        <div className="h-20 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />

                        {/* Profile Info */}
                        <div className="relative px-6 pb-6">
                            {/* Avatar */}
                            <div className="absolute -top-8 left-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card border-4 border-card shadow-lg">
                                    <User className="h-8 w-8 text-primary" />
                                </div>
                            </div>

                            <div className="pt-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">{attendee.full_name}</h3>
                                        <p className="text-sm text-muted-foreground">{attendee.email}</p>
                                    </div>
                                    <Badge className={cn('mt-1', colors.badge)}>
                                        {attendee.category}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Details Grid */}
                    <div className="grid gap-3 rounded-xl border border-border bg-card/50 p-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact Information</h4>

                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{attendee.email}</span>
                        </div>
                        {attendee.phone && (
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">{attendee.phone}</span>
                            </div>
                        )}
                        {attendee.organization && (
                            <div className="flex items-center gap-3 text-sm">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">{attendee.organization}</span>
                            </div>
                        )}
                        {attendee.student_id && (
                            <div className="flex items-center gap-3 text-sm">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">ID: {attendee.student_id}</span>
                            </div>
                        )}
                    </div>

                    {/* Digital Ticket QR Section */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <div className="text-center mb-4">
                            <h4 className="font-semibold text-foreground">Digital Ticket QR</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Student scans this → Opens their ticket page
                            </p>
                        </div>

                        {/* QR Code - encodes the full ticket URL */}
                        <div id="admin-qr-code" className="flex justify-center mb-4">
                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                                <QRCodeSVG
                                    value={ticketUrl}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>
                        </div>

                        {/* Ticket Link Preview */}
                        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-xs mb-4">
                            <code className="flex-1 truncate text-muted-foreground">{ticketUrl}</code>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyLink}>
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={handleDownloadQR} className="gap-2">
                                <Download className="h-4 w-4" />
                                Download QR
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleShareQR} className="gap-2">
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                        </div>

                        <Button
                            variant="default"
                            size="sm"
                            className="w-full mt-2 gap-2"
                            onClick={handleOpenTicket}
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open Ticket Page
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

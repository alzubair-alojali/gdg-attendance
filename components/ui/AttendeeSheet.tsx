'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { QRCodeDisplay } from './QRCodeDisplay'
import { Attendee } from '@/types/database.types'
import { Mail, Phone, Building, GraduationCap, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendeeSheetProps {
    attendee: Attendee | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const categoryColors: Record<string, string> = {
    Team: 'bg-[#4285F4] text-white',
    Student: 'bg-[#34A853] text-white',
    Guest: 'bg-[#FBBC05] text-black',
}

export function AttendeeSheet({ attendee, open, onOpenChange }: AttendeeSheetProps) {
    if (!attendee) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader className="text-left">
                    <SheetTitle className="text-xl font-semibold">Attendee Details</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">{attendee.full_name}</h3>
                            <Badge className={cn('mt-1', categoryColors[attendee.category])}>
                                {attendee.category}
                            </Badge>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
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

                    {/* QR Code */}
                    <div className="border-t border-border pt-6">
                        <h4 className="mb-4 text-center text-sm font-medium text-muted-foreground">
                            Scan QR Code for Check-in
                        </h4>
                        <QRCodeDisplay
                            value={attendee.id}
                            name={attendee.full_name}
                            size={180}
                        />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

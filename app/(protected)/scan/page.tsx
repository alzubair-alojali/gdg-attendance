'use client'

import { useState, useCallback } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { ScanFeedback } from '@/components/ui/ScanFeedback'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { QrCode, Camera, CameraOff, ScanLine } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Attendee } from '@/types/database.types'

type FeedbackType = 'success' | 'warning' | 'error' | null

interface FeedbackState {
    type: FeedbackType
    title: string
    subtitle?: string
}

export default function ScanPage() {
    const [isScanning, setIsScanning] = useState(true)
    const [feedback, setFeedback] = useState<FeedbackState>({ type: null, title: '' })
    const [lastScannedId, setLastScannedId] = useState<string | null>(null)
    const supabase = createClient()

    // Get active session
    const { data: activeSession } = useQuery({
        queryKey: ['active-session'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('is_active', true)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            return data
        },
    })

    const showFeedback = useCallback((type: FeedbackType, title: string, subtitle?: string) => {
        setFeedback({ type, title, subtitle })
        setIsScanning(false)

        // Auto-hide after 2 seconds
        setTimeout(() => {
            setFeedback({ type: null, title: '' })
            setIsScanning(true)
        }, 2000)
    }, [])

    const handleScan = useCallback(async (result: string) => {
        // Prevent scanning same QR immediately
        if (result === lastScannedId) return
        setLastScannedId(result)

        // Clear last scanned ID after 3 seconds
        setTimeout(() => setLastScannedId(null), 3000)

        if (!activeSession) {
            showFeedback('error', 'No Active Session', 'Please create a session first')
            toast.error('No active session')
            return
        }

        try {
            // Find attendee by ID
            const { data: attendee, error: attendeeError } = await supabase
                .from('attendees')
                .select('*')
                .eq('id', result)
                .single() as { data: Attendee | null; error: unknown }

            if (attendeeError || !attendee) {
                showFeedback('error', 'User Not Found', 'QR code is not registered')
                toast.error('User not found')
                return
            }

            // Check if already scanned today
            const { data: existingLog } = await supabase
                .from('attendance_logs')
                .select('*')
                .eq('attendee_id', result)
                .eq('session_id', (activeSession as { id: string }).id)
                .single()

            if (existingLog) {
                showFeedback('warning', 'Already Scanned', `${attendee.full_name} is already checked in`)
                toast.warning('Already checked in')
                return
            }

            // Create attendance log
            const { error: logError } = await supabase
                .from('attendance_logs')
                // @ts-expect-error - Supabase types not properly inferred without codegen
                .insert({
                    attendee_id: result,
                    session_id: (activeSession as { id: string }).id,
                    scanned_at: new Date().toISOString(),
                    status: 'present',
                })

            if (logError) throw logError

            showFeedback('success', `Welcome, ${attendee.full_name}!`, attendee.category)
            toast.success(`${attendee.full_name} checked in!`)
        } catch (error) {
            console.error('Scan error:', error)
            showFeedback('error', 'Scan Failed', 'Something went wrong')
            toast.error('Failed to process scan')
        }
    }, [activeSession, lastScannedId, showFeedback, supabase])

    return (
        <>
            <div className="flex flex-col items-center space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="text-center space-y-2"
                >
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ScanLine className="h-4 w-4" />
                        <span className="font-data text-xs uppercase tracking-wider">
                            QR Scanner
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Scan QR</h1>
                    <p className="text-muted-foreground">
                        Point the camera at an attendee&apos;s QR code
                    </p>
                </motion.div>

                {/* Session Status */}
                {!activeSession && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl glass-card border-yellow-500/20 bg-yellow-500/5 p-4"
                    >
                        <p className="text-sm font-medium text-yellow-500">
                            ⚠️ No active session — Scanning is disabled
                        </p>
                    </motion.div>
                )}

                {/* Scanner */}
                <Card className="w-full max-w-md overflow-hidden glass-card rounded-2xl">
                    <CardContent className="p-0">
                        <div className="relative aspect-square">
                            {isScanning && activeSession ? (
                                <Scanner
                                    onScan={(result) => {
                                        if (result?.[0]?.rawValue) {
                                            handleScan(result[0].rawValue)
                                        }
                                    }}
                                    onError={(error) => {
                                        console.error(error)
                                        toast.error('Camera error')
                                    }}
                                    styles={{
                                        container: { width: '100%', height: '100%' },
                                        video: { objectFit: 'cover' },
                                    }}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-white/[0.02]">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex flex-col items-center gap-4 text-center"
                                    >
                                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08]">
                                            <CameraOff className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {!activeSession ? 'No active session' : 'Camera paused'}
                                        </p>
                                    </motion.div>
                                </div>
                            )}

                            {/* Scan overlay */}
                            {isScanning && activeSession && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="h-48 w-48 rounded-2xl border-2 border-primary/80 shadow-lg shadow-primary/20" />
                                    {/* Animated scan line */}
                                    <motion.div
                                        animate={{ y: [-90, 90] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatType: 'reverse',
                                            ease: 'easeInOut'
                                        }}
                                        className="absolute h-0.5 w-44 bg-gradient-to-r from-transparent via-primary to-transparent"
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Controls */}
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setIsScanning(!isScanning)}
                        disabled={!activeSession}
                        className="gap-2 glass border-white/[0.08] hover:bg-white/[0.06] active:scale-95 transition-all"
                    >
                        {isScanning ? (
                            <>
                                <CameraOff className="h-4 w-4" />
                                Pause
                            </>
                        ) : (
                            <>
                                <Camera className="h-4 w-4" />
                                Resume
                            </>
                        )}
                    </Button>
                </div>

                {/* Instructions */}
                <div className="max-w-sm text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <QrCode className="h-4 w-4" />
                        <span>Position QR code within the frame</span>
                    </div>
                </div>
            </div>

            {/* Feedback Overlay */}
            {feedback.type && (
                <ScanFeedback
                    type={feedback.type}
                    title={feedback.title}
                    subtitle={feedback.subtitle}
                />
            )}
        </>
    )
}

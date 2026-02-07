'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type FeedbackType = 'success' | 'warning' | 'error' | null

interface ScanFeedbackProps {
    type: FeedbackType
    title: string
    subtitle?: string
    onAnimationComplete?: () => void
}

const feedbackConfig = {
    success: {
        icon: CheckCircle,
        bgClass: 'bg-green-500/20',
        iconClass: 'text-green-500',
        glowClass: 'glow-success',
    },
    warning: {
        icon: AlertCircle,
        bgClass: 'bg-yellow-500/20',
        iconClass: 'text-yellow-500',
        glowClass: 'glow-warning',
    },
    error: {
        icon: XCircle,
        bgClass: 'bg-red-500/20',
        iconClass: 'text-red-500',
        glowClass: 'glow-error',
    },
}

export function ScanFeedback({ type, title, subtitle, onAnimationComplete }: ScanFeedbackProps) {
    if (!type) return null

    const config = feedbackConfig[type]
    const Icon = config.icon

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onAnimationComplete={onAnimationComplete}
                className={cn(
                    'fixed inset-0 z-50 flex items-center justify-center',
                    config.bgClass
                )}
            >
                <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    className="flex flex-col items-center gap-4 text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
                        className={cn(
                            'flex h-24 w-24 items-center justify-center rounded-full',
                            config.bgClass,
                            config.glowClass
                        )}
                    >
                        <Icon className={cn('h-12 w-12', config.iconClass)} />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold text-foreground"
                    >
                        {title}
                    </motion.h2>
                    {subtitle && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-muted-foreground"
                        >
                            {subtitle}
                        </motion.p>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

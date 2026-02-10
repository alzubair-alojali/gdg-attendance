'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedCounter } from './AnimatedCounter'

interface StatsCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    className,
}: StatsCardProps) {
    // Determine if value is numeric (should use animated counter)
    const isNumeric = typeof value === 'number' || /^\d/.test(String(value))

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
                'group relative overflow-hidden rounded-2xl',
                'glass-card glow-hover',
                'p-6',
                className
            )}
        >
            {/* Animated glow border on hover */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                    background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1), transparent 50%)',
                }}
            />

            <div className="relative flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="text-3xl font-bold tracking-tight text-foreground">
                        {isNumeric ? (
                            <AnimatedCounter value={value} />
                        ) : (
                            <span>{value}</span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1">
                            <span
                                className={cn(
                                    'text-xs font-medium font-data',
                                    trend.isPositive ? 'text-green-500' : 'text-red-500'
                                )}
                            >
                                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs last event</span>
                        </div>
                    )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
            </div>
        </motion.div>
    )
}

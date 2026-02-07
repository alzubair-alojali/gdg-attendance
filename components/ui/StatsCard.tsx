'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
                'group relative overflow-hidden rounded-xl border border-border bg-card p-6',
                'transition-shadow hover:shadow-lg hover:shadow-primary/5',
                className
            )}
        >
            {/* Background gradient on hover */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1">
                            <span
                                className={cn(
                                    'text-xs font-medium',
                                    trend.isPositive ? 'text-green-500' : 'text-red-500'
                                )}
                            >
                                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs last event</span>
                        </div>
                    )}
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
            </div>
        </motion.div>
    )
}

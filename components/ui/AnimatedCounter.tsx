'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, useInView, useTransform, motion } from 'framer-motion'

interface AnimatedCounterProps {
    /** The target value to animate to (number or string like "42%") */
    value: number | string
    /** Duration of the spring animation in seconds */
    duration?: number
    /** CSS class for the counter element */
    className?: string
    /** Whether to display as mono/data font */
    mono?: boolean
}

/**
 * AnimatedCounter — Counts up from 0 to the target value using spring physics.
 * Supports both numeric values and string values with numeric prefixes (e.g., "85%").
 * Only animates when the element enters the viewport.
 */
export function AnimatedCounter({
    value,
    duration = 1.5,
    className = '',
    mono = true,
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true, margin: '-50px' })

    // Parse numeric part and suffix
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
    const suffix = typeof value === 'string' ? String(value).replace(/[\d.-]/g, '') : ''

    const motionValue = useMotionValue(0)
    const springValue = useSpring(motionValue, {
        stiffness: 100,
        damping: 30,
        duration: duration * 1000,
    })

    const display = useTransform(springValue, (latest) => {
        const rounded = Math.round(latest)
        return `${rounded}${suffix}`
    })

    useEffect(() => {
        if (isInView) {
            motionValue.set(numericValue)
        }
    }, [isInView, numericValue, motionValue])

    return (
        <motion.span
            ref={ref}
            className={`${mono ? 'font-data' : ''} ${className}`}
        >
            {display}
        </motion.span>
    )
}

'use client'

import { motion } from 'framer-motion'

/**
 * Template — Next.js template file for the (protected) route group.
 * Re-renders on every navigation, providing a smooth fade & slide-up
 * page transition using Framer Motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                mass: 0.8,
            }}
        >
            {children}
        </motion.div>
    )
}

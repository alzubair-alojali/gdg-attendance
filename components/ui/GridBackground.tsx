'use client'

/**
 * GridBackground — Full-screen technical grid pattern background
 * Creates a subtle CSS-only grid overlay with radial gradient color accents,
 * giving the app a high-tech data analytics feel.
 */
export function GridBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 z-0">
            {/* Base grid pattern */}
            <div className="absolute inset-0 grid-bg" />

            {/* Radial gradient overlays for depth & color */}
            <div className="absolute inset-0 grid-bg-overlay" />

            {/* Vignette effect — darkens edges */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(5, 5, 7, 0.6) 100%)',
                }}
            />
        </div>
    )
}

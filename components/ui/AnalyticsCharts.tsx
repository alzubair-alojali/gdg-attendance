'use client'

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react'

// ============================================
// Mock Data — Replace with real Supabase queries
// ============================================

const attendanceTrendData = [
    { session: 'Day 1', attendees: 42 },
    { session: 'Day 2', attendees: 38 },
    { session: 'Day 3', attendees: 51 },
    { session: 'Day 4', attendees: 45 },
    { session: 'Day 5', attendees: 55 },
    { session: 'Day 6', attendees: 49 },
    { session: 'Day 7', attendees: 62 },
    { session: 'Day 8', attendees: 58 },
    { session: 'Day 9', attendees: 67 },
    { session: 'Day 10', attendees: 72 },
]

const categoryData = [
    { name: 'Students', value: 65, color: '#4285F4' },
    { name: 'Guests', value: 20, color: '#FBBC05' },
    { name: 'Team', value: 15, color: '#34A853' },
]

// ============================================
// Custom Tooltip
// ============================================

interface TooltipPayloadItem {
    name?: string
    value?: number
    color?: string
    dataKey?: string
    payload?: Record<string, unknown>
}

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean
    payload?: TooltipPayloadItem[]
    label?: string
}) {
    if (!active || !payload?.length) return null

    return (
        <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-xl">
            <p className="text-muted-foreground mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="font-data font-semibold text-foreground">
                    {entry.value} attendees
                </p>
            ))}
        </div>
    )
}

function PieTooltip({
    active,
    payload,
}: {
    active?: boolean
    payload?: TooltipPayloadItem[]
}) {
    if (!active || !payload?.length) return null

    return (
        <div className="glass-card rounded-lg px-3 py-2 text-sm shadow-xl">
            <p className="font-medium text-foreground">
                {payload[0]?.name}
            </p>
            <p className="font-data font-semibold" style={{ color: payload[0]?.payload?.color as string }}>
                {payload[0]?.value}%
            </p>
        </div>
    )
}

// ============================================
// Attendance Trend Area Chart
// ============================================

export function AttendanceTrendChart() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
            className="glass-card glow-hover rounded-2xl p-6"
        >
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground">
                        Attendance Trends
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Last 10 sessions
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={attendanceTrendData}
                        margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="attendeesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4285F4" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#4285F4" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="session"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#71717a' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#71717a' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="attendees"
                            stroke="#4285F4"
                            strokeWidth={2.5}
                            fill="url(#attendeesGradient)"
                            dot={false}
                            activeDot={{
                                r: 5,
                                fill: '#4285F4',
                                stroke: '#050507',
                                strokeWidth: 3,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}

// ============================================
// Category Distribution Donut Chart
// ============================================

interface LegendEntry {
    value?: string
    color?: string
}

function CustomLegend({ payload }: { payload?: LegendEntry[] }) {
    if (!payload) return null

    return (
        <div className="flex flex-col gap-2 pl-4">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-2.5">
                    <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground">{entry.value}</span>
                </div>
            ))}
        </div>
    )
}

export function CategoryDistributionChart() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
            className="glass-card glow-hover rounded-2xl p-6"
        >
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-google-green/10">
                    <PieChartIcon className="h-5 w-5 text-google-green" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-foreground">
                        Category Distribution
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Students vs Guests vs Team
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip content={<PieTooltip />} />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            content={<CustomLegend />}
                        />
                        <Pie
                            data={categoryData}
                            cx="40%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                            cornerRadius={6}
                            stroke="none"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    className="transition-opacity hover:opacity-80"
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}

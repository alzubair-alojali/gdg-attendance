import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Trophy, Medal, Award } from "lucide-react"

interface LeaderboardEntry {
    name: string
    score: number
    subtext?: string
    rank: number
    avatarUrl?: string
    category?: string
}

interface LeaderboardCardProps {
    title: string
    icon: React.ElementType
    entries: LeaderboardEntry[]
    metricLabel: string
    colorClass?: string
    formatScore?: (score: number) => string
}

export function LeaderboardCard({ title, icon: Icon, entries, metricLabel, colorClass = "text-yellow-500", formatScore }: LeaderboardCardProps) {
    return (
        <Card className="h-full border-none shadow-lg bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Icon className={cn("w-6 h-6", colorClass)} />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 pt-4">
                    {entries.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No data available yet
                        </div>
                    ) : (
                        entries.map((entry, index) => (
                            <div key={index} className="flex items-center space-x-4">
                                <div className="flex-shrink-0 w-8 text-center font-bold text-lg text-muted-foreground">
                                    {index === 0 ? (
                                        <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
                                    ) : index === 1 ? (
                                        <Medal className="w-6 h-6 text-gray-400 mx-auto" />
                                    ) : index === 2 ? (
                                        <Award className="w-6 h-6 text-amber-600 mx-auto" />
                                    ) : (
                                        <span className="text-sm">#{index + 1}</span>
                                    )}
                                </div>

                                <Avatar className="h-10 w-10 border-2 border-background flex-shrink-0">
                                    <AvatarImage src={entry.avatarUrl} alt={entry.name} />
                                    <AvatarFallback className={cn(
                                        "font-bold",
                                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                                            index === 1 ? "bg-gray-100 text-gray-700" :
                                                index === 2 ? "bg-orange-100 text-orange-700" : ""
                                    )}>
                                        {entry.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0 space-y-1">
                                    <p className="text-sm font-medium leading-none truncate" title={entry.name}>
                                        {entry.name}
                                    </p>
                                    {entry.category && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {entry.category}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-lg font-bold">
                                        {formatScore ? formatScore(entry.score) : entry.score}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {metricLabel}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

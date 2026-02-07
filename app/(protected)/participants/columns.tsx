'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Attendee } from '@/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const categoryColors: Record<string, string> = {
    Team: 'bg-[#4285F4] text-white hover:bg-[#4285F4]/90',
    Student: 'bg-[#34A853] text-white hover:bg-[#34A853]/90',
    Guest: 'bg-[#FBBC05] text-black hover:bg-[#FBBC05]/90',
}

interface ColumnActions {
    onEdit?: (attendee: Attendee) => void
    onDelete?: (attendee: Attendee) => void
}

export const createAttendeeColumns = (actions?: ColumnActions): ColumnDef<Attendee>[] => [
    {
        accessorKey: 'full_name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4 hover:bg-transparent"
            >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="font-medium text-foreground">{row.getValue('full_name')}</div>
        ),
    },
    {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
            <div className="text-muted-foreground">{row.getValue('email')}</div>
        ),
    },
    {
        accessorKey: 'category',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                className="-ml-4 hover:bg-transparent"
            >
                Category
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const category = row.getValue('category') as string
            return (
                <Badge className={cn(categoryColors[category])}>
                    {category}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: 'organization',
        header: 'Organization',
        cell: ({ row }) => (
            <div className="text-muted-foreground">
                {row.getValue('organization') || '—'}
            </div>
        ),
    },
    // Actions Column
    {
        id: 'actions',
        cell: ({ row }) => {
            const attendee = row.original

            if (!actions) return null

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                actions.onEdit?.(attendee)
                            }}
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.stopPropagation()
                                actions.onDelete?.(attendee)
                            }}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

// Keep the original export for backwards compatibility
export const attendeeColumns = createAttendeeColumns()

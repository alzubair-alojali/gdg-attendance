'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Attendee } from '@/types/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const categoryColors: Record<string, string> = {
    Team: 'bg-[#4285F4] text-white hover:bg-[#4285F4]/90',
    Student: 'bg-[#34A853] text-white hover:bg-[#34A853]/90',
    Guest: 'bg-[#FBBC05] text-black hover:bg-[#FBBC05]/90',
}

export const attendeeColumns: ColumnDef<Attendee>[] = [
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
        header: 'Category',
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
]

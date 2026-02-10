'use client'

import { useState, ReactNode } from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    ColumnFiltersState,
} from '@tanstack/react-table'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    searchPlaceholder?: string
    onRowClick?: (row: TData) => void
    headerActions?: ReactNode
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey = 'full_name',
    searchPlaceholder = 'Search...',
    onRowClick,
    headerActions,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <div className="space-y-4">
            {/* Header with Search and Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
                        onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
                        className="pl-10 bg-white/[0.04] border-white/[0.08] focus:border-primary/50"
                    />
                </div>
                {headerActions && (
                    <div className="flex items-center gap-2">
                        {headerActions}
                    </div>
                )}
            </div>

            {/* Scrollable Table Container */}
            <div className="max-h-[600px] overflow-auto rounded-2xl glass-card">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-[rgba(16,16,20,0.9)] backdrop-blur-sm">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-white/[0.06]">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row, index) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 400,
                                            damping: 30,
                                            delay: Math.min(index * 0.03, 0.6),
                                        }}
                                        onClick={() => onRowClick?.(row.original)}
                                        className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.04] ${onRowClick ? 'cursor-pointer' : ''
                                            }`}
                                        data-state={row.getIsSelected() && 'selected'}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </motion.tr>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground font-data">
                {table.getFilteredRowModel().rows.length} result(s)
            </div>
        </div>
    )
}

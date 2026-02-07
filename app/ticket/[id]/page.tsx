import { createClient } from '@/utils/supabase/server'
import { Attendee } from '@/types/database.types'
import { notFound } from 'next/navigation'
import { TicketCard } from './TicketCard'

interface Props {
    params: Promise<{ id: string }>
}

export default async function PublicTicketPage({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch attendee by ID
    const { data: attendee, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !attendee) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#09090b] via-[#0f0f13] to-[#09090b] flex items-center justify-center p-4">
            <TicketCard attendee={attendee as Attendee} />
        </div>
    )
}

// Metadata for SEO
export async function generateMetadata({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const { data: attendee } = await supabase
        .from('attendees')
        .select('full_name')
        .eq('id', id)
        .single()

    return {
        title: attendee ? `${(attendee as { full_name: string }).full_name} - GDG Event Ticket` : 'GDG Event Ticket',
        description: 'Your digital event ticket for GDG DevFest',
    }
}

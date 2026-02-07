'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ============== SESSION ACTIONS ==============

export async function createSession(formData: FormData) {
    const title = formData.get('title') as string
    const date = formData.get('date') as string
    const setActive = formData.get('setActive') === 'true'

    if (!title || !date) {
        return { error: 'Title and date are required' }
    }

    const supabase = await createClient()

    // If setting as active, first deactivate all other sessions
    if (setActive) {
        await supabase
            .from('sessions')
            // @ts-expect-error - Supabase types not properly inferred without codegen
            .update({ is_active: false })
            .eq('is_active', true)
    }

    const { data, error } = await supabase
        .from('sessions')
        // @ts-expect-error - Supabase types not properly inferred without codegen
        .insert({
            title,
            date,
            is_active: setActive,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating session:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/sessions')
    return { success: true, session: data }
}

export async function toggleSessionActive(sessionId: string, isActive: boolean) {
    const supabase = await createClient()

    // If activating, first deactivate all other sessions
    if (isActive) {
        await supabase
            .from('sessions')
            // @ts-expect-error - Supabase types not properly inferred without codegen
            .update({ is_active: false })
            .eq('is_active', true)
    }

    const { error } = await supabase
        .from('sessions')
        // @ts-expect-error - Supabase types not properly inferred without codegen
        .update({ is_active: isActive })
        .eq('id', sessionId)

    if (error) {
        console.error('Error updating session:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/sessions')
    return { success: true }
}

export async function deleteSession(sessionId: string) {
    const supabase = await createClient()

    // First delete all attendance logs for this session
    await supabase
        .from('attendance_logs')
        .delete()
        .eq('session_id', sessionId)

    const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)

    if (error) {
        console.error('Error deleting session:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/sessions')
    return { success: true }
}

export async function updateSession(sessionId: string, title: string, date: string) {
    if (!title || !date) {
        return { error: 'Title and date are required' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('sessions')
        // @ts-expect-error - Supabase types not properly inferred without codegen
        .update({ title, date })
        .eq('id', sessionId)

    if (error) {
        console.error('Error updating session:', error)
        return { error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/sessions')
    return { success: true }
}

// ============== ATTENDANCE ACTIONS ==============

export async function markAttendeePresent(attendeeId: string, sessionId: string) {
    const supabase = await createClient()

    // Check if already marked present
    const { data: existing } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('attendee_id', attendeeId)
        .eq('session_id', sessionId)
        .single()

    if (existing) {
        return { success: true, message: 'Already marked present' }
    }

    const { error } = await supabase
        .from('attendance_logs')
        // @ts-expect-error - Supabase types not properly inferred without codegen
        .insert({
            attendee_id: attendeeId,
            session_id: sessionId,
        })

    if (error) {
        console.error('Error marking present:', error)
        return { error: error.message }
    }

    revalidatePath(`/sessions/${sessionId}`)
    return { success: true }
}

export async function markAttendeeAbsent(attendeeId: string, sessionId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('attendance_logs')
        .delete()
        .eq('attendee_id', attendeeId)
        .eq('session_id', sessionId)

    if (error) {
        console.error('Error marking absent:', error)
        return { error: error.message }
    }

    revalidatePath(`/sessions/${sessionId}`)
    return { success: true }
}

// ============== ATTENDEE ACTIONS ==============

export interface AttendeeFormData {
    full_name: string
    email: string
    phone?: string
    category: 'Team' | 'Student' | 'Guest'
    student_id?: string
    organization?: string
}

export async function createAttendee(data: AttendeeFormData) {
    if (!data.full_name || !data.email || !data.category) {
        return { error: 'Name, email, and category are required' }
    }

    const supabase = await createClient()

    const { data: attendee, error } = await supabase
        .from('attendees')
        // @ts-expect-error - Supabase types not properly inferred without codegen
        .insert({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone || null,
            category: data.category,
            student_id: data.student_id || null,
            organization: data.organization || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating attendee:', error)
        return { error: error.message }
    }

    revalidatePath('/participants')
    revalidatePath('/team')
    revalidatePath('/')
    return { success: true, attendee }
}

export async function updateAttendee(id: string, data: AttendeeFormData) {
    if (!data.full_name || !data.email || !data.category) {
        return { error: 'Name, email, and category are required' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('attendees')
        // @ts-expect-error - Supabase types not properly inferred without codegen
        .update({
            full_name: data.full_name,
            email: data.email,
            phone: data.phone || null,
            category: data.category,
            student_id: data.student_id || null,
            organization: data.organization || null,
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating attendee:', error)
        return { error: error.message }
    }

    revalidatePath('/participants')
    revalidatePath('/team')
    revalidatePath('/')
    return { success: true }
}

export async function deleteAttendee(id: string) {
    const supabase = await createClient()

    // First delete any attendance logs for this attendee
    await supabase
        .from('attendance_logs')
        .delete()
        .eq('attendee_id', id)

    const { error } = await supabase
        .from('attendees')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting attendee:', error)
        return { error: error.message }
    }

    revalidatePath('/participants')
    revalidatePath('/team')
    revalidatePath('/')
    return { success: true }
}

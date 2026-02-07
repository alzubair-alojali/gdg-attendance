export type AttendeeCategory = 'Team' | 'Student' | 'Guest'

export interface Attendee {
    id: string
    full_name: string
    email: string
    phone: string | null
    category: AttendeeCategory
    student_id: string | null
    organization: string | null
    created_at: string
}

export interface Session {
    id: string
    title: string
    date: string
    is_active: boolean
    created_at: string
}

export interface AttendanceLog {
    id: string
    attendee_id: string
    session_id: string
    scanned_at: string
    status: 'present' | 'late' | 'early'
}

export interface Database {
    public: {
        Tables: {
            attendees: {
                Row: Attendee
                Insert: Omit<Attendee, 'id' | 'created_at'>
                Update: Partial<Omit<Attendee, 'id' | 'created_at'>>
            }
            sessions: {
                Row: Session
                Insert: Omit<Session, 'id' | 'created_at'>
                Update: Partial<Omit<Session, 'id' | 'created_at'>>
            }
            attendance_logs: {
                Row: AttendanceLog
                Insert: Omit<AttendanceLog, 'id'>
                Update: Partial<Omit<AttendanceLog, 'id'>>
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: {
            attendee_category: AttendeeCategory
        }
    }
}

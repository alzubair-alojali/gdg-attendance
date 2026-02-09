import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { Attendee, Session, AttendanceLog } from '@/types/database.types'

export type AudienceFilter = 'participants' | 'team' | 'all'

export interface ExportConfig {
  selectedSessionIds: string[]
  audienceFilter: AudienceFilter
}

interface AttendanceMatrix {
  attendee: Attendee
  sessionStatuses: Map<string, boolean>
  totalAbsences: number
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function loadFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Font fetch failed')
  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function generateAttendanceReport(
  sessions: Session[],
  attendees: Attendee[],
  attendanceLogs: AttendanceLog[],
  config: ExportConfig
): Promise<void> {
  const { selectedSessionIds, audienceFilter } = config

  const selectedSessions = sessions
    .filter((s) => selectedSessionIds.includes(s.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let filteredAttendees = attendees
  if (audienceFilter === 'participants') {
    filteredAttendees = attendees.filter((a) => a.category !== 'Team')
  } else if (audienceFilter === 'team') {
    filteredAttendees = attendees.filter((a) => a.category === 'Team')
  }

  const attendanceByAttendee = new Map<string, Set<string>>()
  attendanceLogs.forEach((log) => {
    if (!attendanceByAttendee.has(log.attendee_id)) {
      attendanceByAttendee.set(log.attendee_id, new Set())
    }
    attendanceByAttendee.get(log.attendee_id)!.add(log.session_id)
  })

  const matrix: AttendanceMatrix[] = filteredAttendees.map((attendee) => {
    const presentSessions = attendanceByAttendee.get(attendee.id) || new Set()
    const sessionStatuses = new Map<string, boolean>()
    let totalAbsences = 0

    selectedSessions.forEach((session) => {
      const isPresent = presentSessions.has(session.id)
      sessionStatuses.set(session.id, isPresent)
      if (!isPresent) totalAbsences++
    })

    return { attendee, sessionStatuses, totalAbsences }
  })

  const doc = new jsPDF({
    orientation: selectedSessions.length > 5 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let arabicFontLoaded = false
  try {
    const fontBase64 = await loadFontAsBase64('/fonts/Amiri-Regular.ttf')
    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64)
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
    arabicFontLoaded = true
  } catch (err) {
    console.warn('Arabic font failed to load, using Helvetica:', err)
  }

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  try {
    const logo = await loadImage('/gdg-logo.png')
    const logoHeight = 12
    const logoWidth = (logo.width / logo.height) * logoHeight
    doc.addImage(logo, 'PNG', margin, margin, logoWidth, logoHeight)
  } catch {
    // Logo failed to load
  }

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(66, 133, 244)
  doc.text('GDG Attendance Report', pageWidth / 2, margin + 8, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const subtitle =
    audienceFilter === 'all'
      ? 'All Attendees'
      : audienceFilter === 'team'
        ? 'Team Members Only'
        : 'Participants Only'
  doc.text(subtitle, pageWidth / 2, margin + 14, { align: 'center' })

  const tableHeaders = [
    'Name',
    'Category',
    ...selectedSessions.map((s) => format(new Date(s.date), 'MMM d')),
    'Absences',
  ]

  const tableData = matrix.map((row) => {
    const sessionCells = selectedSessions.map((session) => {
      const isPresent = row.sessionStatuses.get(session.id)
      return isPresent ? 'P' : 'A'
    })

    return [row.attendee.full_name, row.attendee.category, ...sessionCells, row.totalAbsences.toString()]
  })

  autoTable(doc, {
    startY: margin + 22,
    head: [tableHeaders],
    body: tableData,
    theme: 'striped',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      valign: 'middle',
      halign: 'center',
      font: arabicFontLoaded ? 'Amiri' : 'helvetica',
    },
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      font: 'helvetica',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const colIndex = data.column.index
        if (colIndex >= 2 && colIndex < 2 + selectedSessions.length) {
          const cellText = data.cell.text[0]
          if (cellText === 'P') {
            data.cell.styles.textColor = [34, 197, 94]
            data.cell.styles.fontStyle = 'bold'
          } else if (cellText === 'A') {
            data.cell.styles.textColor = [239, 68, 68]
            data.cell.styles.fontStyle = 'bold'
          }
        }
        if (colIndex === 2 + selectedSessions.length) {
          const absences = parseInt(data.cell.text[0], 10)
          if (absences > 0) {
            data.cell.styles.textColor = [239, 68, 68]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      }
    },
    margin: { left: margin, right: margin },
  })

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}`, margin, pageHeight - 10)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
  }

  const dateStr = format(new Date(), 'yyyy-MM-dd')
  doc.save(`GDG-Attendance-Report-${dateStr}.pdf`)
}

// Hand-rolled .ics (iCalendar) generation — no dependency. One all-day
// VEVENT per file, which is all a deliverable due date needs.

export interface IcsEventInput {
  uid: string
  title: string
  description?: string
  date: string // YYYY-MM-DD
  url?: string
}

function formatIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function generateIcsEvent(input: IcsEventInput): string {
  const dtstamp = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
  const dateValue = formatIcsDate(input.date)

  const endDate = new Date(`${input.date}T00:00:00Z`)
  endDate.setUTCDate(endDate.getUTCDate() + 1)
  const endValue = formatIcsDate(endDate.toISOString().slice(0, 10))

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Infoishai//Campaign Tracker//EN',
    'BEGIN:VEVENT',
    `UID:${input.uid}@infoishai.com`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dateValue}`,
    `DTEND;VALUE=DATE:${endValue}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    ...(input.description ? [`DESCRIPTION:${escapeIcsText(input.description)}`] : []),
    ...(input.url ? [`URL:${input.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

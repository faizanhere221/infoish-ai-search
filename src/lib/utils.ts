import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCSV(dataToExport: any[], includeHeaders: boolean = true) {
  if (!dataToExport || dataToExport.length === 0) {
    throw new Error('No data to export')
  }

  let csvContent = ''

  // Add headers if requested
  if (includeHeaders) {
    const headers = Object.keys(dataToExport[0])
    csvContent += headers.join(',') + '\n'
  }

  // Add data rows
  dataToExport.forEach(row => {
    const values = Object.values(row).map(value => {
      // Handle strings that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        // Escape quotes by doubling them and wrap in quotes
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    })
    csvContent += values.join(',') + '\n'
  })

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `export-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

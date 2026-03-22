import { format, formatDistanceToNow, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'

export function toDate(value: Timestamp | Date | string | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  const d = new Date(value)
  return isValid(d) ? d : null
}

export function formatDate(value: Timestamp | Date | string | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  return format(d, 'dd MMM yyyy', { locale: es })
}

export function formatRelative(value: Timestamp | Date | string | null | undefined): string {
  const d = toDate(value)
  if (!d) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

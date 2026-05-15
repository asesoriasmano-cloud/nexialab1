import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr = 'PPP') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr, { locale: es })
}

export function formatTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

export function formatCurrency(amount: number, currency = 'CLP') {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export const BUSINESS_CATEGORIES = [
  { value: 'salon', label: 'Salón de Belleza' },
  { value: 'barbershop', label: 'Barbería' },
  { value: 'nails', label: 'Centro de Uñas' },
  { value: 'tattoo', label: 'Estudio de Tatuajes' },
  { value: 'massage', label: 'Centro de Masajes' },
  { value: 'personal_training', label: 'Personal Training' },
  { value: 'pet_grooming', label: 'Pet Grooming' },
  { value: 'photography', label: 'Estudio Fotográfico' },
  { value: 'coaching', label: 'Coaching / Consultoría' },
  { value: 'tutoring', label: 'Clases Particulares' },
  { value: 'other', label: 'Otro' },
] as const

export const DAYS_OF_WEEK = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
]

export const APPOINTMENT_STATUSES = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-800' },
}

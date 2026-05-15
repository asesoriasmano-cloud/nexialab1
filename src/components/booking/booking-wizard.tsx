'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ServiceSelector } from './service-selector'
import { StaffSelector } from './staff-selector'
import { TimeSlotPicker } from './time-slot-picker'
import { ClientInfoForm } from './client-info-form'
import { BookingConfirmation } from './booking-confirmation'
import { ChevronLeft } from 'lucide-react'

interface BookingWizardProps {
  business: any
  services: any[]
  staff: any[]
  workingHours: any[]
}

export type BookingState = {
  service: any
  staff: any
  date: string
  time: string
  clientName: string
  clientEmail: string
  clientPhone: string
  notes: string
  intakeResponses: Record<string, any>
}

const STEPS = ['Servicio', 'Profesional', 'Fecha y hora', 'Tus datos', 'Confirmar']

export function BookingWizard({ business, services, staff, workingHours }: BookingWizardProps) {
  const [step, setStep] = useState(0)
  const [booking, setBooking] = useState<Partial<BookingState>>({})
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  function nextStep() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function prevStep() { setStep(s => Math.max(s - 1, 0)) }

  if (step === STEPS.length && appointmentId) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cita confirmada!</h2>
        <p className="text-gray-500 mb-6">
          Recibirás un email de confirmación en <strong>{booking.clientEmail}</strong>
        </p>
        <Button onClick={() => { setStep(0); setBooking({}); setAppointmentId(null) }} variant="outline">
          Hacer otra reserva
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`text-xs font-medium hidden sm:block ${i === step ? 'text-violet-600' : i < step ? 'text-green-600' : 'text-gray-400'}`}
            >
              {i < step ? '✓ ' : ''}{s}
            </span>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        <p className="text-sm text-gray-500 mt-1 sm:hidden">
          Paso {step + 1} de {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {step > 0 && (
            <button onClick={prevStep} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
              <ChevronLeft className="h-4 w-4" />
              Volver
            </button>
          )}

          {step === 0 && (
            <ServiceSelector
              services={services}
              selected={booking.service}
              onSelect={service => { setBooking(p => ({ ...p, service })); nextStep() }}
              primaryColor={business.primary_color}
            />
          )}

          {step === 1 && (
            <StaffSelector
              staff={staff}
              serviceId={booking.service?.id}
              selected={booking.staff}
              onSelect={staff => { setBooking(p => ({ ...p, staff })); nextStep() }}
              primaryColor={business.primary_color}
            />
          )}

          {step === 2 && (
            <TimeSlotPicker
              businessId={business.id}
              serviceId={booking.service?.id}
              staffId={booking.staff?.id}
              workingHours={workingHours}
              selectedDate={booking.date}
              selectedTime={booking.time}
              onSelect={(date, time) => { setBooking(p => ({ ...p, date, time })); nextStep() }}
              primaryColor={business.primary_color}
            />
          )}

          {step === 3 && (
            <ClientInfoForm
              service={booking.service}
              onSubmit={data => { setBooking(p => ({ ...p, ...data })); nextStep() }}
            />
          )}

          {step === 4 && (
            <BookingConfirmation
              booking={booking as BookingState}
              business={business}
              onConfirm={id => { setAppointmentId(id); setStep(STEPS.length) }}
              onBack={prevStep}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

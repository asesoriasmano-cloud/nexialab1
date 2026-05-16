import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, ArrowLeft } from 'lucide-react'

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Pago exitoso!</h1>
        <p className="text-gray-500 mb-8">
          Tu cita ha sido confirmada. Recibirás un email con todos los detalles.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Calendar className="h-4 w-4" />
            Agregar al calendario
          </Button>
        </div>
      </div>
    </div>
  )
}

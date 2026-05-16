import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function BookingCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-12 w-12 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Pago cancelado</h1>
        <p className="text-gray-500 mb-8">
          No se realizó ningún cargo. Tu reserva no fue confirmada.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => window.history.go(-2)} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
        </div>
      </div>
    </div>
  )
}

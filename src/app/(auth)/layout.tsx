import Link from 'next/link'
import { Calendar } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex flex-col">
      <div className="flex justify-center pt-8 pb-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center shadow-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">CitaPro</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
      <div className="text-center pb-8">
        <p className="text-sm text-gray-400">
          © 2024 CitaPro · <a href="#" className="hover:text-gray-600">Términos</a> · <a href="#" className="hover:text-gray-600">Privacidad</a>
        </p>
      </div>
    </div>
  )
}

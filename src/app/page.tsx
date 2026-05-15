import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, Users, CreditCard, Bell, BarChart3, Shield, 
  Scissors, Dumbbell, Camera, PawPrint, Palette, BookOpen,
  CheckCircle, ArrowRight, Star, Menu
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Calendario Inteligente',
    description: 'Vista semanal y mensual con drag & drop. Gestiona citas con FullCalendar integrado.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Users,
    title: 'CRM de Clientes',
    description: 'Historial completo, notas, etiquetas y métricas por cliente. Nunca olvides un detalle.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: CreditCard,
    title: 'Pagos Online',
    description: 'Cobra depósitos o el total por adelantado con Stripe. Reduce no-shows hasta 70%.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: Bell,
    title: 'Recordatorios Automáticos',
    description: 'Emails automáticos de confirmación y recordatorio a 24h y 2h de la cita.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: BarChart3,
    title: 'Analítica Avanzada',
    description: 'Dashboard con ingresos, ocupación, clientes nuevos y tasa de no-shows en tiempo real.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
  {
    icon: Shield,
    title: 'Multi-Profesional',
    description: 'Gestiona múltiples profesionales, sus horarios y servicios independientes.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
]

const categories = [
  { icon: Scissors, label: 'Salones & Barberías', color: 'text-violet-500' },
  { icon: Palette, label: 'Uñas & Tatuajes', color: 'text-pink-500' },
  { icon: Dumbbell, label: 'Personal Training', color: 'text-orange-500' },
  { icon: PawPrint, label: 'Pet Grooming', color: 'text-green-500' },
  { icon: Camera, label: 'Fotografía', color: 'text-blue-500' },
  { icon: BookOpen, label: 'Clases & Coaching', color: 'text-teal-500' },
]

const plans = [
  {
    name: 'Gratis',
    price: '0',
    period: '/mes',
    description: 'Perfecto para comenzar',
    features: ['50 citas al mes', '1 profesional', '5 servicios', 'Página de reservas', 'Emails básicos'],
    cta: 'Empezar Gratis',
    popular: false,
  },
  {
    name: 'Starter',
    price: '9.900',
    period: '/mes',
    description: 'Para negocios en crecimiento',
    features: ['200 citas al mes', '3 profesionales', '15 servicios', 'Recordatorios automáticos', 'Estadísticas básicas', 'Soporte por email'],
    cta: 'Prueba 14 días gratis',
    popular: false,
  },
  {
    name: 'Profesional',
    price: '24.900',
    period: '/mes',
    description: 'Para negocios establecidos',
    features: ['Citas ilimitadas', '10 profesionales', 'Servicios ilimitados', 'Pagos online Stripe', 'Analytics avanzado', 'Soporte prioritario'],
    cta: 'Prueba 14 días gratis',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '59.900',
    period: '/mes',
    description: 'Para cadenas y franquicias',
    features: ['Todo ilimitado', 'Staff ilimitado', 'API access', 'Onboarding personalizado', 'SLA garantizado', 'Facturación personalizada'],
    cta: 'Contactar ventas',
    popular: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CitaPro</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Características</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Precios</a>
              <a href="#categories" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Categorías</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Iniciar sesión</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white border-0">
                  Empezar gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-pink-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">
            ✨ Nuevo: Pagos online con Stripe integrado
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
            Tu negocio merece el{' '}
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              mejor sistema
            </span>{' '}
            de citas
          </h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed">
            CitaPro es la plataforma de reservas más completa para salones, barberías, estudios y más. 
            Gestiona citas, clientes y pagos en un solo lugar. Sin complicaciones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white border-0 text-base px-8 h-12">
                Empezar gratis — sin tarjeta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/book/demo">
              <Button size="lg" variant="outline" className="text-base px-8 h-12">
                Ver demo en vivo
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            ✓ 14 días gratis &nbsp;·&nbsp; ✓ Sin tarjeta de crédito &nbsp;·&nbsp; ✓ Cancela cuando quieras
          </p>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative mx-auto max-w-5xl">
            <div className="bg-gradient-to-br from-violet-100 to-pink-50 rounded-2xl border border-violet-100 shadow-2xl overflow-hidden h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="flex gap-4 justify-center mb-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-sm w-40">
                      <div className="h-2 bg-violet-200 rounded mb-2 w-3/4" />
                      <div className="h-2 bg-gray-100 rounded mb-2" />
                      <div className="h-6 bg-gradient-to-r from-violet-500 to-pink-400 rounded-md mt-3" />
                    </div>
                  ))}
                </div>
                <p className="text-violet-400 font-medium">Dashboard CitaPro</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              { stat: '10,000+', label: 'Citas gestionadas' },
              { stat: '500+', label: 'Negocios activos' },
              { stat: '4.9/5', label: 'Valoración media' },
              { stat: '70%', label: 'Menos no-shows' },
            ].map(({ stat, label }) => (
              <div key={label} className="text-center px-6">
                <div className="text-3xl font-bold text-gray-900">{stat}</div>
                <div className="text-sm text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para crecer
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Desde el primer contacto hasta el pago, CitaPro gestiona todo el flujo de tu negocio.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="group p-6 rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all duration-200 bg-white">
                <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-24 bg-gradient-to-br from-violet-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Diseñado para tu industria
            </h2>
            <p className="text-xl text-gray-500">
              Plantillas y flujos optimizados para cada tipo de negocio de servicios.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div key={cat.label} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100 hover:border-violet-200 cursor-pointer">
                <cat.icon className={`h-8 w-8 ${cat.color} mx-auto mb-3`} />
                <p className="text-sm font-medium text-gray-700">{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Precios simples y transparentes
            </h2>
            <p className="text-xl text-gray-500">
              Empieza gratis, escala cuando lo necesites.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border-2 ${
                  plan.popular
                    ? 'border-violet-500 bg-gradient-to-br from-violet-600 to-pink-500 text-white shadow-2xl scale-105'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-white text-violet-600 border-0 shadow">Más popular</Badge>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className={`text-lg font-bold mb-1 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.popular ? 'text-violet-200' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                </div>
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    ${plan.price}
                  </span>
                  <span className={`text-sm ${plan.popular ? 'text-violet-200' : 'text-gray-500'}`}>
                    {plan.period}
                  </span>
                  <span className={`text-sm ml-1 ${plan.popular ? 'text-violet-200' : 'text-gray-400'}`}>
                    CLP + IVA
                  </span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className={`h-4 w-4 shrink-0 ${plan.popular ? 'text-violet-200' : 'text-violet-600'}`} />
                      <span className={`text-sm ${plan.popular ? 'text-violet-100' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-white text-violet-600 hover:bg-violet-50'
                        : 'bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:from-violet-700 hover:to-pink-600 border-0'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'María González',
                business: 'Salón Divina, Santiago',
                rating: 5,
                text: 'CitaPro transformó mi salón. Antes perdía clientes por no confirmar citas. Ahora tengo 0 no-shows y mis clientes adoran el sistema de reservas online.',
              },
              {
                name: 'Carlos Mendoza',
                business: 'Barbería El Corte, Viña del Mar',
                rating: 5,
                text: 'La gestión del calendario con múltiples barberos era un caos. CitaPro lo ordenó todo. Ahora veo el día completo de un vistazo.',
              },
              {
                name: 'Ana López',
                business: 'Estudio Nails Pro, Concepción',
                rating: 5,
                text: 'Los recordatorios automáticos me ahorran horas de llamadas cada semana. El cobro online con depósito eliminó las cancelaciones de último minuto.',
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{testimonial.text}</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-violet-600 to-pink-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl text-violet-200 mb-8">
            Únete a cientos de negocios que ya usan CitaPro. Configura en 5 minutos.
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-violet-600 hover:bg-violet-50 text-base px-10 h-12">
              Empezar gratis ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-white font-semibold">CitaPro</span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Términos</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacidad</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Contacto</a>
            </div>
            <p className="text-gray-500 text-sm">© 2024 CitaPro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const PLANS = {
  free: {
    name: 'Gratis',
    price: 0,
    appointments: 50,
    staff: 1,
    services: 5,
    features: ['50 citas/mes', '1 profesional', '5 servicios', 'Página de reservas'],
  },
  starter: {
    name: 'Starter',
    price: 9900,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    appointments: 200,
    staff: 3,
    services: 15,
    features: ['200 citas/mes', '3 profesionales', '15 servicios', 'Recordatorios email', 'Estadísticas básicas'],
  },
  professional: {
    name: 'Profesional',
    price: 24900,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    appointments: -1,
    staff: 10,
    services: -1,
    features: ['Citas ilimitadas', '10 profesionales', 'Servicios ilimitados', 'Pagos online', 'Analytics avanzado', 'Soporte prioritario'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 59900,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    appointments: -1,
    staff: -1,
    services: -1,
    features: ['Todo ilimitado', 'Staff ilimitado', 'API access', 'Onboarding personalizado', 'SLA garantizado', 'Facturación personalizada'],
  },
}

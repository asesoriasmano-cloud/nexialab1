import { Card, CardContent } from '@/components/ui/card'
import { Calendar, DollarSign, Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    todayAppointments: number
    weekRevenue: number
    monthRevenue: number
    newClientsMonth: number
    occupancyRate: number
    noShowRate: number
  }
}

const statCards = (stats: StatsCardsProps['stats']) => [
  {
    title: 'Citas hoy',
    value: stats.todayAppointments.toString(),
    icon: Calendar,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    change: '+2 vs ayer',
    positive: true,
  },
  {
    title: 'Ingresos semana',
    value: formatCurrency(stats.weekRevenue),
    icon: DollarSign,
    color: 'text-green-600',
    bg: 'bg-green-50',
    change: '+12% vs semana ant.',
    positive: true,
  },
  {
    title: 'Ingresos mes',
    value: formatCurrency(stats.monthRevenue),
    icon: TrendingUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    change: '+8% vs mes ant.',
    positive: true,
  },
  {
    title: 'Clientes nuevos',
    value: stats.newClientsMonth.toString(),
    icon: Users,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    change: 'Este mes',
    positive: true,
  },
  {
    title: 'Ocupación',
    value: `${stats.occupancyRate}%`,
    icon: Clock,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    change: 'Esta semana',
    positive: stats.occupancyRate > 60,
  },
  {
    title: 'Tasa no-show',
    value: `${stats.noShowRate}%`,
    icon: AlertTriangle,
    color: stats.noShowRate > 10 ? 'text-red-600' : 'text-teal-600',
    bg: stats.noShowRate > 10 ? 'bg-red-50' : 'bg-teal-50',
    change: 'Último mes',
    positive: stats.noShowRate <= 10,
  },
]

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = statCards(stats)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{card.value}</div>
            <div className="text-sm text-gray-500 mb-1">{card.title}</div>
            <div className={`text-xs font-medium ${card.positive ? 'text-green-600' : 'text-red-600'}`}>
              {card.change}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

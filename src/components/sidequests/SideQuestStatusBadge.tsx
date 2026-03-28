import { Badge } from '../ui/Badge'
import type { SideQuestStatus } from '../../types/sidequest'
import type { SubscriptionStatus } from '../../types/subscription'

interface QuestBadgeProps {
  status: SideQuestStatus
}

interface SubBadgeProps {
  status: SubscriptionStatus
}

const questConfig: Record<SideQuestStatus, { variant: 'success' | 'danger' | 'warning' | 'default'; label: string }> = {
  open: { variant: 'success', label: 'Abierta' },
  closed: { variant: 'default', label: 'Cerrada' },
}

const subConfig: Record<SubscriptionStatus, { variant: 'success' | 'danger' | 'warning' | 'purple' | 'default'; label: string }> = {
  pending: { variant: 'purple', label: 'Pendiente' },
  active: { variant: 'warning', label: 'En progreso' },
  complete: { variant: 'success', label: 'Completada' },
  failed: { variant: 'danger', label: 'Fallada' },
  abandoned: { variant: 'default', label: 'Abandonada' },
}

export function SideQuestStatusBadge({ status }: QuestBadgeProps) {
  // Fallback para documentos con status legacy ('incomplete', 'complete', 'failed')
  const cfg = questConfig[status] ?? { variant: 'default' as const, label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function SubscriptionStatusBadge({ status }: SubBadgeProps) {
  const cfg = subConfig[status] ?? { variant: 'default' as const, label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

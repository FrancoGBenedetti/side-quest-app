import { Badge } from '../ui/Badge'
import type { SideQuestStatus } from '../../types/sidequest'

interface Props {
  status: SideQuestStatus
}

const config = {
  incomplete: { variant: 'warning' as const, label: 'Pendiente' },
  complete: { variant: 'success' as const, label: 'Completa' },
  failed: { variant: 'danger' as const, label: 'Fallada' },
}

export function SideQuestStatusBadge({ status }: Props) {
  const { variant, label } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

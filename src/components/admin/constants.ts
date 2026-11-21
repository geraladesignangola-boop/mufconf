import type { PrizeName } from '../../types/database'

/**
 * Ordem dos prémios do pódio (1º, 2º, 3º lugar).
 * Constante partilhada por RankingSection, ParticipantsSection e ParticipantModal.
 */
export const PODIUM_PRIZES: PrizeName[] = ['pack_completo', 'agenda', 'camisa']

export type ParticipantFilter =
  | 'all'
  | 'podium'
  | 'linked'
  | 'no_links'
  | 'group_added'
  | 'group_pending'

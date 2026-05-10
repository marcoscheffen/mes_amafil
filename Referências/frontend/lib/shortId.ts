/**
 * IDs compactos para UI: prefixo por entidade + 8 primeiros hex do UUID (sem hífens).
 * O UUID completo permanece a chave no Supabase; o tooltip deve expor o valor completo para suporte/logs.
 */

export const ENTITY_SHORT_HEX_LEN = 8;

const SEP = '\u00B7'; // middle dot

export const ENTITY_PREFIX = {
  client: 'CL',
  appointment: 'AG',
  attendance: 'AT',
  transcription: 'TR',
} as const;

export type EntityKind = keyof typeof ENTITY_PREFIX;

export function uuidHexPrefix(uuid: string | null | undefined, len: number = ENTITY_SHORT_HEX_LEN): string {
  if (!uuid || typeof uuid !== 'string') return '';
  const h = uuid.replace(/-/g, '');
  if (h.length < len) return h;
  return h.slice(0, len);
}

/**
 * Ex.: "AG·a1b2c3d4" (agendamento). Retorna "—" se id vazio/ inválido.
 */
export function formatEntityShortId(kind: EntityKind, id: string | null | undefined): string {
  if (!id) return '—';
  return `${ENTITY_PREFIX[kind]}${SEP}${uuidHexPrefix(id)}`;
}

/** Texto de tooltip padrão com UUID completo. */
export function fullEntityIdTooltip(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  return `ID completo: ${id}`;
}

import React from 'react';
import { type EntityKind, formatEntityShortId, fullEntityIdTooltip } from '../lib/shortId';

type EntityShortIdProps = {
  kind: EntityKind;
  id: string | null | undefined;
  className?: string;
};

/**
 * Rótulo compacto (CL·/AG·/AT·/TR· + 8 hex). Tooltip = UUID completo.
 */
export const EntityShortId: React.FC<EntityShortIdProps> = ({ kind, id, className = '' }) => {
  return (
    <span
      className={`font-mono text-[10px] text-slate-500 tabular-nums tracking-tight ${className}`.trim()}
      title={fullEntityIdTooltip(id)}
    >
      {formatEntityShortId(kind, id)}
    </span>
  );
};

import React, { useEffect, useState } from 'react';
import { normalizeProfilePhotoUrl } from '../utils/profilePhoto';

export interface ContactAvatarProps {
  /** URL preferencial (ex.: thumbnail do Chatwoot, costuma ser mais atual). */
  photoUrl?: string | null;
  /** Usada se a principal falhar ou estiver vazia (ex.: senderphoto no banco). */
  fallbackUrl?: string | null;
  initial: string;
  /** Classes do container (tamanho, sombra, etc.). */
  className?: string;
  /** Classes da letra de fallback (tamanho do texto varia por contexto). */
  initialClassName?: string;
}

type Stage = 'primary' | 'fallback' | 'initial';

export const ContactAvatar: React.FC<ContactAvatarProps> = ({
  photoUrl,
  fallbackUrl,
  initial,
  className = '',
  initialClassName = 'text-sm font-bold',
}) => {
  const primary = normalizeProfilePhotoUrl(photoUrl);
  const fallbackRaw = normalizeProfilePhotoUrl(fallbackUrl);
  const fallback = fallbackRaw && fallbackRaw !== primary ? fallbackRaw : null;

  const [stage, setStage] = useState<Stage>(() =>
    primary ? 'primary' : fallback ? 'fallback' : 'initial',
  );

  useEffect(() => {
    setStage(primary ? 'primary' : fallback ? 'fallback' : 'initial');
  }, [primary, fallback]);

  const showInitial = stage === 'initial';
  const src = stage === 'primary' ? primary : stage === 'fallback' ? fallback : null;

  return (
    <div
      className={`rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-slate-200 overflow-hidden shrink-0 ${className}`.trim()}
    >
      {src ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full min-h-0 min-w-0 object-cover"
          onError={() => {
            setStage(s => {
              if (s === 'primary' && fallback) return 'fallback';
              return 'initial';
            });
          }}
        />
      ) : (
        <span className={`select-none ${initialClassName}`}>{initial}</span>
      )}
    </div>
  );
};

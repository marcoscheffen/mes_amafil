/**
 * Normaliza URL de foto de perfil (WhatsApp/CDN): trim e remove espaços
 * acidentais que quebram o path (ex.: ".jp g" no meio da URL).
 */
export function normalizeProfilePhotoUrl(url: string | null | undefined): string | null {
  if (url == null || typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  const collapsed = t.replace(/\s+/g, '');
  try {
    const parsed = new URL(collapsed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return collapsed;
  } catch {
    return null;
  }
}

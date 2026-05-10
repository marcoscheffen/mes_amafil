// Normaliza erros do Supabase / PostgREST / fetch para uma mensagem amigável.
// PostgrestError não é instance de Error, por isso `e instanceof Error` falha.

export function formatSupabaseError(err: unknown, fallback = 'Erro inesperado.'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;

  if (err instanceof Error) return err.message || fallback;

  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const msg =
      (typeof e.message === 'string' && e.message) ||
      (typeof e.error_description === 'string' && e.error_description) ||
      (typeof e.details === 'string' && e.details) ||
      (typeof e.hint === 'string' && e.hint) ||
      '';

    const code = typeof e.code === 'string' && e.code ? ` [${e.code}]` : '';

    if (msg) return `${msg}${code}`;

    try {
      return JSON.stringify(err);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

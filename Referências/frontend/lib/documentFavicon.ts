/** Mesmo href padrão de `index.html` — usado quando a empresa não define favicon. */
export const DEFAULT_FAVICON_HREF =
  'https://tfkvgkkqpmafvczodnco.supabase.co/storage/v1/object/public/Logo/ayvi_logo_w.png';

export function applyDocumentFavicon(href: string | null | undefined): void {
  const target = href?.trim() ? href.trim() : DEFAULT_FAVICON_HREF;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
  }
  link.href = target;
}

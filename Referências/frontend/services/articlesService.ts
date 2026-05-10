import { supabase } from '../lib/supabase';
import { Article } from '../types';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getArticles(
  companyId: string,
  category?: string,
  isActive?: boolean
): Promise<Article[]> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('get_articles', {
    p_company_id: companyId,
    p_category:   category  ?? null,
    p_is_active:  isActive  !== undefined ? isActive : null
  });

  if (rpcError) throw rpcError;

  const raw = Array.isArray(rpcResult) ? rpcResult : [];
  return raw.map((item: any) => ({
    id:         item.id,
    company_id: item.company_id,
    title:      item.title,
    slug:       item.slug,
    summary:    item.summary   || '',
    content:    item.content   || '',
    category:   item.category  || '',
    language:   item.language  || 'pt-BR',
    priority:   item.priority  || 0,
    is_active:  item.is_active ?? true,
    tags:       item.tags      || [],
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
}

export async function getArticleById(articleId: string): Promise<Article | null> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('get_article_by_id', {
    p_article_id: articleId
  });

  if (rpcError) throw rpcError;
  if (!rpcResult?.id) return null;

  return {
    id:         rpcResult.id,
    company_id: rpcResult.company_id,
    title:      rpcResult.title,
    slug:       rpcResult.slug,
    summary:    rpcResult.summary   || '',
    content:    rpcResult.content   || '',
    category:   rpcResult.category  || '',
    language:   rpcResult.language  || 'pt-BR',
    priority:   rpcResult.priority  || 0,
    is_active:  rpcResult.is_active ?? true,
    tags:       rpcResult.tags      || [],
    created_at: rpcResult.created_at,
    updated_at: rpcResult.updated_at
  };
}

export async function createArticle(
  companyId: string,
  articleData: {
    title:      string;
    slug?:      string;
    summary?:   string;
    content?:   string;
    category?:  string;
    language?:  string;
    priority?:  number;
    is_active?: boolean;
    tags?:      string[];
  }
): Promise<Article> {
  const slug = articleData.slug || generateSlug(articleData.title);

  const { data: rpcResult, error: rpcError } = await supabase.rpc('create_article', {
    p_company_id: companyId,
    p_title:      articleData.title,
    p_slug:       slug,
    p_summary:    articleData.summary   ?? null,
    p_content:    articleData.content   ?? null,
    p_category:   articleData.category  ?? null,
    p_language:   articleData.language  || 'pt-BR',
    p_priority:   articleData.priority  || 0,
    p_is_active:  articleData.is_active ?? true
  });

  if (rpcError) throw rpcError;
  if (!rpcResult?.id) throw new Error('Erro ao criar artigo: resposta inválida');

  if (articleData.tags && articleData.tags.length > 0) {
    await setArticleTags(rpcResult.id, articleData.tags);
    const withTags = await getArticleById(rpcResult.id);
    if (withTags) return withTags;
  }

  return {
    id:         rpcResult.id,
    company_id: rpcResult.company_id,
    title:      rpcResult.title,
    slug:       rpcResult.slug,
    summary:    rpcResult.summary   || '',
    content:    rpcResult.content   || '',
    category:   rpcResult.category  || '',
    language:   rpcResult.language  || 'pt-BR',
    priority:   rpcResult.priority  || 0,
    is_active:  rpcResult.is_active ?? true,
    tags:       [],
    created_at: rpcResult.created_at,
    updated_at: rpcResult.updated_at
  };
}

export async function updateArticle(
  articleId: string,
  updates: {
    title?:     string;
    slug?:      string;
    summary?:   string;
    content?:   string;
    category?:  string;
    language?:  string;
    priority?:  number;
    is_active?: boolean;
    tags?:      string[];
  }
): Promise<Article> {
  let slug: string | null = null;
  if (updates.title !== undefined && updates.slug === undefined) {
    slug = generateSlug(updates.title);
  } else if (updates.slug !== undefined) {
    slug = updates.slug;
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc('update_article', {
    p_article_id: articleId,
    p_title:      updates.title    ?? null,
    p_slug:       slug,
    p_summary:    updates.summary  ?? null,
    p_content:    updates.content  ?? null,
    p_category:   updates.category ?? null,
    p_language:   updates.language ?? null,
    p_priority:   updates.priority !== undefined ? updates.priority : null,
    p_is_active:  updates.is_active !== undefined ? updates.is_active : null
  });

  if (rpcError) throw rpcError;
  if (!rpcResult?.id) throw new Error('Erro ao atualizar artigo: resposta inválida');

  if (updates.tags !== undefined) {
    await setArticleTags(articleId, updates.tags);
    const withTags = await getArticleById(articleId);
    if (withTags) return withTags;
  }

  return {
    id:         rpcResult.id,
    company_id: rpcResult.company_id,
    title:      rpcResult.title,
    slug:       rpcResult.slug,
    summary:    rpcResult.summary   || '',
    content:    rpcResult.content   || '',
    category:   rpcResult.category  || '',
    language:   rpcResult.language  || 'pt-BR',
    priority:   rpcResult.priority  || 0,
    is_active:  rpcResult.is_active ?? true,
    tags:       rpcResult.tags      || [],
    created_at: rpcResult.created_at,
    updated_at: rpcResult.updated_at
  };
}

export async function deleteArticle(articleId: string): Promise<void> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_article', {
    p_article_id: articleId
  });

  if (rpcError) throw rpcError;
  if (!rpcResult?.success) throw new Error(rpcResult?.message || 'Erro ao deletar artigo');
}

export async function setArticleTags(articleId: string, tagSlugs: string[]): Promise<void> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('set_article_tags', {
    p_article_id: articleId,
    p_tag_slugs:  tagSlugs || []
  });

  if (rpcError) throw rpcError;
  if (!rpcResult?.success) throw new Error(rpcResult?.message || 'Erro ao definir tags do artigo');
}

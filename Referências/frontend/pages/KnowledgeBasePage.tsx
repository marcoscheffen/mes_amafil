
import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { Article, FAQ, Tag } from '../types';
import * as articlesService from '../services/articlesService';
import * as faqsService from '../services/faqsService';
import * as tagsService from '../services/tagsService';
import * as agentsService from '../services/agentsService';

type KBTab = 'articles' | 'faqs' | 'tags';

interface ArticleData {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  language: string;
  priority: number;
  is_active: boolean;
  tags: string[];
}

interface FAQData {
  id?: string;
  question: string;
  answer: string;
  category: string;
  language: string;
  priority: number;
  allowed_agents: string[];
  is_active: boolean;
}

interface TagData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  is_active: boolean;
}

export const KnowledgeBasePage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<KBTab>('articles');
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<KBTab>('articles');
  
  // Data states
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // States for form data
  const [articleForm, setArticleForm] = useState<ArticleData>({
    title: '', slug: '', summary: '', content: '', category: 'Geral', language: 'pt-BR', priority: 0, is_active: true, tags: []
  });
  const [faqForm, setFaqForm] = useState<FAQData>({
    question: '', answer: '', category: 'Geral', language: 'pt-BR', priority: 0, allowed_agents: [], is_active: true
  });
  const [tagForm, setTagForm] = useState<TagData>({
    name: '', slug: '', description: '', color: '#3B82F6', is_active: true
  });

  // Load data
  useEffect(() => {
    if (!currentCompany) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load tags (only needs company_id)
        const tagsData = await tagsService.getTags(currentCompany.id);
        setTags(tagsData);
        
        const articlesData = await articlesService.getArticles(currentCompany.id);
        setArticles(articlesData);
        
        const faqsData = await faqsService.getFaqs(currentCompany.id);
        setFaqs(faqsData);
        
        // Load agents for FAQ allowed_agents selection
        const agentsData = await agentsService.getAgents(currentCompany.id);
        setAgents(agentsData);
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message || 'Erro ao carregar dados da base de conhecimento');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentCompany]);

  const handleCreate = (type: KBTab) => {
    setEditType(type);
    setError(null);
    if (type === 'articles') setArticleForm({ title: '', slug: '', summary: '', content: '', category: 'Geral', language: 'pt-BR', priority: 0, is_active: true, tags: [] });
    if (type === 'faqs') setFaqForm({ question: '', answer: '', category: 'Geral', language: 'pt-BR', priority: 0, allowed_agents: [], is_active: true });
    if (type === 'tags') setTagForm({ name: '', slug: '', description: '', color: '#3B82F6', is_active: true });
    setIsEditing(true);
  };

  const handleEditArticle = (art: Article) => {
    setEditType('articles');
    setError(null);
    setArticleForm({
      id: art.id,
      title: art.title,
      slug: art.slug,
      summary: art.summary,
      content: art.content,
      category: art.category,
      language: art.language,
      priority: art.priority,
      is_active: art.is_active,
      tags: art.tags
    });
    setIsEditing(true);
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditType('faqs');
    setError(null);
    setFaqForm({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      language: faq.language,
      priority: faq.priority,
      allowed_agents: faq.allowed_agents,
      is_active: faq.is_active
    });
    setIsEditing(true);
  };

  const handleEditTag = (tag: Tag) => {
    setEditType('tags');
    setError(null);
    setTagForm({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      color: tag.color,
      is_active: tag.is_active
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentCompany) {
      setError('Nenhuma empresa selecionada');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editType === 'tags') {
        if (tagForm.id) {
          // Update
          await tagsService.updateTag(tagForm.id, {
            name: tagForm.name,
            slug: tagForm.slug,
            description: tagForm.description,
            color: tagForm.color,
            is_active: tagForm.is_active
          });
        } else {
          // Create
          await tagsService.createTag(currentCompany.id, {
            name: tagForm.name,
            slug: tagForm.slug,
            description: tagForm.description,
            color: tagForm.color,
            is_active: tagForm.is_active
          });
        }
        // Reload tags
        const tagsData = await tagsService.getTags(currentCompany.id);
        setTags(tagsData);
      } else if (editType === 'articles') {
        if (articleForm.id) {
          // Update
          await articlesService.updateArticle(articleForm.id, {
            title: articleForm.title,
            slug: articleForm.slug,
            summary: articleForm.summary,
            content: articleForm.content,
            category: articleForm.category,
            language: articleForm.language,
            priority: articleForm.priority,
            is_active: articleForm.is_active,
            tags: articleForm.tags
          });
        } else {
          // Create
          await articlesService.createArticle(currentCompany.id, {
            title: articleForm.title,
            slug: articleForm.slug,
            summary: articleForm.summary,
            content: articleForm.content,
            category: articleForm.category,
            language: articleForm.language,
            priority: articleForm.priority,
            is_active: articleForm.is_active,
            tags: articleForm.tags
          });
        }
        // Reload articles
        const articlesData = await articlesService.getArticles(currentCompany.id);
        setArticles(articlesData);
      } else if (editType === 'faqs') {
        if (faqForm.id) {
          // Update
          await faqsService.updateFaq(faqForm.id, {
            question: faqForm.question,
            answer: faqForm.answer,
            category: faqForm.category,
            language: faqForm.language,
            priority: faqForm.priority,
            allowed_agents: faqForm.allowed_agents,
            is_active: faqForm.is_active
          });
        } else {
          // Create
          await faqsService.createFaq(currentCompany.id, {
            question: faqForm.question,
            answer: faqForm.answer,
            category: faqForm.category,
            language: faqForm.language,
            priority: faqForm.priority,
            allowed_agents: faqForm.allowed_agents,
            is_active: faqForm.is_active
          });
        }
        // Reload FAQs
        const faqsData = await faqsService.getFaqs(currentCompany.id);
        setFaqs(faqsData);
      }

      setIsEditing(false);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: KBTab, id: string) => {
    if (!currentCompany || !confirm('Tem certeza que deseja deletar este item?')) {
      return;
    }

    try {
      setError(null);
      if (type === 'tags') {
        await tagsService.deleteTag(id);
        const tagsData = await tagsService.getTags(currentCompany.id);
        setTags(tagsData);
      } else if (type === 'articles') {
        await articlesService.deleteArticle(id);
        const articlesData = await articlesService.getArticles(currentCompany.id);
        setArticles(articlesData);
      } else if (type === 'faqs') {
        await faqsService.deleteFaq(id);
        const faqsData = await faqsService.getFaqs(currentCompany.id);
        setFaqs(faqsData);
      }
    } catch (err: any) {
      console.error('Erro ao deletar:', err);
      setError(err.message || 'Erro ao deletar');
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  };

  if (isEditing) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsEditing(false)} className="size-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white">
                {editType === 'articles' ? (articleForm.id ? 'Editar Artigo' : 'Novo Artigo') : 
                 editType === 'faqs' ? (faqForm.id ? 'Editar FAQ' : 'Nova FAQ') : 
                 (tagForm.id ? 'Editar Tag' : 'Nova Tag')}
              </h2>
              <p className="text-slate-400 text-sm">Preencha os dados abaixo para atualizar sua base.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(false)} 
              disabled={saving}
              className="h-11 px-6 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {editType === 'articles' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Título do Artigo</label>
                  <input 
                    type="text" 
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({...articleForm, title: e.target.value, slug: generateSlug(e.target.value)})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="Ex: Como configurar o gateway" 
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Slug (URL)</label>
                  <input 
                    type="text" 
                    value={articleForm.slug}
                    onChange={(e) => setArticleForm({...articleForm, slug: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-slate-400 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Resumo (Summary)</label>
                  <textarea 
                    value={articleForm.summary}
                    onChange={(e) => setArticleForm({...articleForm, summary: e.target.value})}
                    className="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" 
                    placeholder="Uma breve introdução sobre o que o artigo trata..." 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Categoria</label>
                  <input 
                    type="text" 
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({...articleForm, category: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Idioma</label>
                  <select 
                    value={articleForm.language}
                    onChange={(e) => setArticleForm({...articleForm, language: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Prioridade</label>
                  <input 
                    type="number" 
                    value={articleForm.priority}
                    onChange={(e) => setArticleForm({...articleForm, priority: parseInt(e.target.value)})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white" 
                  />
                </div>
                <div className="flex items-end pb-2">
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <div 
                        onClick={() => setArticleForm({...articleForm, is_active: !articleForm.is_active})}
                        className={`w-12 h-6 rounded-full transition-all relative ${articleForm.is_active ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                         <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${articleForm.is_active ? 'left-7' : 'left-1'}`} />
                      </div>
                      <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Artigo Ativo</span>
                   </label>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Tags</label>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        const current = articleForm.tags;
                        if (current.includes(tag.slug)) {
                          setArticleForm({...articleForm, tags: current.filter(s => s !== tag.slug)});
                        } else {
                          setArticleForm({...articleForm, tags: [...current, tag.slug]});
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2 ${
                        articleForm.tags.includes(tag.slug)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <div className="size-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.slug}
                    </button>
                  ))}
                  {tags.length === 0 && (
                    <span className="text-xs text-slate-500">Crie tags primeiro na aba Tags</span>
                  )}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Conteúdo (Markdown)</label>
                  <span className="text-[10px] text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded uppercase">Suporta Markdown Completo</span>
                </div>
                <textarea 
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                  className="w-full h-80 bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono leading-relaxed" 
                  placeholder="# Comece a escrever aqui... \n\nUtilize títulos, listas e links para organizar o conhecimento." 
                />
              </div>
            </div>
          )}

          {editType === 'faqs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Pergunta</label>
                  <input 
                    type="text" 
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({...faqForm, question: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Ex: Como faço para contratar mais usuários?"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Resposta</label>
                  <textarea 
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})}
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Categoria</label>
                  <input 
                    type="text" 
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({...faqForm, category: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Prioridade</label>
                  <input 
                    type="number" 
                    value={faqForm.priority}
                    onChange={(e) => setFaqForm({...faqForm, priority: parseInt(e.target.value)})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Agentes Permitidos</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                     {agents.map(agent => (
                       <button 
                         key={agent.id}
                         onClick={() => {
                           const current = faqForm.allowed_agents;
                           if (current.includes(agent.slug)) {
                             setFaqForm({...faqForm, allowed_agents: current.filter(s => s !== agent.slug)});
                           } else {
                             setFaqForm({...faqForm, allowed_agents: [...current, agent.slug]});
                           }
                         }}
                         className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                           faqForm.allowed_agents.includes(agent.slug) 
                             ? 'bg-blue-600 border-blue-500 text-white' 
                             : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
                         }`}
                       >
                         {agent.slug}
                       </button>
                     ))}
                     {agents.length === 0 && (
                       <span className="text-xs text-slate-500">Nenhum agente disponível</span>
                     )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {editType === 'tags' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome da Tag</label>
                  <input 
                    type="text" 
                    value={tagForm.name}
                    onChange={(e) => setTagForm({...tagForm, name: e.target.value, slug: generateSlug(e.target.value)})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Cor</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={tagForm.color}
                      onChange={(e) => setTagForm({...tagForm, color: e.target.value})}
                      className="size-11 p-1 bg-slate-900 border border-slate-700 rounded-xl cursor-pointer" 
                    />
                    <input 
                      type="text" 
                      value={tagForm.color}
                      onChange={(e) => setTagForm({...tagForm, color: e.target.value})}
                      className="flex-1 h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white font-mono uppercase" 
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Descrição</label>
                  <textarea 
                    value={tagForm.description}
                    onChange={(e) => setTagForm({...tagForm, description: e.target.value})}
                    className="w-full h-24 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Base de Conhecimento</h2>
          <p className="text-slate-400">Alimente seus agentes com documentos, FAQs e organize com tags.</p>
        </div>
        <button 
          onClick={() => handleCreate(activeTab)}
          className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 group"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">add_circle</span>
          Novo {activeTab === 'articles' ? 'Artigo' : activeTab === 'faqs' ? 'FAQ' : 'Tag'}
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex border-b border-slate-700 bg-slate-900/10">
          <button 
            onClick={() => setActiveTab('articles')}
            className={`px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'articles' ? 'border-blue-500 text-blue-400 bg-slate-900/20' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-xl">description</span>
            Artigos
          </button>
          <button 
            onClick={() => setActiveTab('faqs')}
            className={`px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'faqs' ? 'border-blue-500 text-blue-400 bg-slate-900/20' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-xl">quiz</span>
            FAQs
          </button>
          <button 
            onClick={() => setActiveTab('tags')}
            className={`px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'tags' ? 'border-blue-500 text-blue-400 bg-slate-900/20' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-xl">label</span>
            Tags
          </button>
        </div>

        <div className="p-4 border-b border-slate-700 bg-slate-900/20 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <input 
              className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
              placeholder={`Buscar em ${activeTab}...`}
            />
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-500">search</span>
          </div>
          <div className="flex gap-2">
             <button className="h-11 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-xs font-bold hover:text-white transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">filter_alt</span>
                Filtrar
             </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm m-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <span className="material-symbols-outlined animate-spin text-4xl mb-4">refresh</span>
            <p>Carregando dados...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'articles' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                    <th className="px-6 py-4">Artigo</th>
                    <th className="px-6 py-4">Prioridade</th>
                    <th className="px-6 py-4">Tags</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {articles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Nenhum artigo encontrado. Clique em "Novo Artigo" para criar o primeiro.
                      </td>
                    </tr>
                  ) : (
                    articles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-white text-sm font-bold">{art.title}</p>
                          <p className="text-slate-500 text-xs mt-0.5 max-w-md truncate">{art.summary}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded border border-blue-400/10">#{art.priority}</span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-wrap gap-1">
                              {art.tags.map(t => {
                                const tag = tags.find(tag => tag.slug === t);
                                return (
                                  <span 
                                    key={t} 
                                    className="px-2 py-0.5 rounded bg-slate-900 text-[9px] font-bold text-slate-400 border border-slate-700 uppercase flex items-center gap-1"
                                  >
                                    {tag && <div className="size-1.5 rounded-full" style={{ backgroundColor: tag.color }} />}
                                    {t}
                                  </span>
                                );
                              })}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${art.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
                            {art.is_active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditArticle(art)} className="p-2 text-slate-400 hover:text-blue-400 transition-all"><span className="material-symbols-outlined text-lg">edit</span></button>
                            <button onClick={() => handleDelete('articles', art.id)} className="p-2 text-slate-400 hover:text-red-400 transition-all"><span className="material-symbols-outlined text-lg">delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'faqs' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                    <th className="px-6 py-4">FAQ</th>
                    <th className="px-6 py-4">Permissões</th>
                    <th className="px-6 py-4 text-center">Idioma</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {faqs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        Nenhum FAQ encontrado. Clique em "Nova FAQ" para criar o primeiro.
                      </td>
                    </tr>
                  ) : (
                    faqs.map((faq) => (
                      <tr key={faq.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="px-6 py-4 max-w-md">
                          <p className="text-white text-sm font-bold">{faq.question}</p>
                          <p className="text-slate-500 text-xs mt-0.5 truncate">{faq.answer}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {faq.allowed_agents.length === 0 ? (
                              <span className="text-[9px] text-slate-500">Todos os agentes</span>
                            ) : (
                              faq.allowed_agents.map(agent => (
                                <span key={agent} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase border border-blue-500/20">{agent}</span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">{faq.language}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditFAQ(faq)} className="p-2 text-slate-400 hover:text-blue-400 transition-all"><span className="material-symbols-outlined text-lg">edit</span></button>
                            <button onClick={() => handleDelete('faqs', faq.id)} className="p-2 text-slate-400 hover:text-red-400 transition-all"><span className="material-symbols-outlined text-lg">delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'tags' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                    <th className="px-6 py-4">Tag</th>
                    <th className="px-6 py-4">Identificador (Slug)</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {tags.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        Nenhuma tag encontrada. Clique em "Nova Tag" para criar a primeira.
                      </td>
                    </tr>
                  ) : (
                    tags.map((tag) => (
                      <tr key={tag.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="size-3.5 rounded-full shadow-lg" style={{ backgroundColor: tag.color }} />
                              <span className="text-white text-sm font-bold">{tag.name}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">/{tag.slug}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs">{tag.description}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditTag(tag)} className="p-2 text-slate-400 hover:text-blue-400 transition-all"><span className="material-symbols-outlined text-lg">edit</span></button>
                            <button onClick={() => handleDelete('tags', tag.id)} className="p-2 text-slate-400 hover:text-red-400 transition-all"><span className="material-symbols-outlined text-lg">delete</span></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

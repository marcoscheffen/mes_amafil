import React, { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../hooks/useAuth';
import { useGlobalAdmin } from '../hooks/useGlobalAdmin';
import { Agent } from '../types';
import * as agentsService from '../services/agentsService';
import * as promptsService from '../services/promptsService';
import type { Prompt as PromptType } from '../services/promptsService';

export const AgentsPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { isGlobalAdmin } = useGlobalAdmin(user ?? null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [prompts, setPrompts] = useState<PromptType[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Carregar agentes quando a company mudar
  useEffect(() => {
    if (currentCompany) {
      loadAgents();
    }
  }, [currentCompany]);

  const loadAgents = async () => {
    if (!currentCompany) return;

    try {
      setLoading(true);
      setError(null);
      const data = await agentsService.getAgents(currentCompany.id);
      setAgents(data);
    } catch (err: any) {
      console.error('Erro ao carregar agentes:', err);
      setError(err.message || 'Erro ao carregar agentes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (agent: Agent) => {
    try {
      setCurrentAgent(agent);
      setError(null);
      
      // Carregar prompts do agente
      const agentPrompts = await promptsService.getPrompts(agent.id);
      setPrompts(agentPrompts);
      setIsEditing(true);
    } catch (err: any) {
      console.error('Erro ao carregar prompts:', err);
      setError(err.message || 'Erro ao carregar prompts');
    }
  };

  const handleCreate = () => {
    setCurrentAgent({
      id: '',
      name: '',
      slug: '',
      description: '',
      temperature: 0.7,
      max_tokens: 2000,
      is_active: true,
      tags: [],
      company_id: currentCompany?.id || '',
      created_at: new Date().toISOString()
    });
    setPrompts([]);
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentCompany || !currentAgent) return;

    try {
      setSaving(true);
      setError(null);

      // Salvar agente
      let savedAgent: Agent;
      if (currentAgent.id) {
        // Atualizar agente existente
        savedAgent = await agentsService.updateAgent(currentAgent.id, {
          name: currentAgent.name,
          description: currentAgent.description,
          temperature: currentAgent.temperature,
          max_tokens: currentAgent.max_tokens,
          tags: currentAgent.tags,
          is_active: currentAgent.is_active
        });
      } else {
        // Criar novo agente
        savedAgent = await agentsService.createAgent(currentCompany.id, {
          name: currentAgent.name,
          description: currentAgent.description,
          temperature: currentAgent.temperature,
          max_tokens: currentAgent.max_tokens,
          tags: currentAgent.tags,
          is_active: currentAgent.is_active
        });
      }

      // Salvar prompts
      if (savedAgent.id && savedAgent.client_id) {
        // Buscar prompts existentes do agente para identificar quais foram removidos
        const existingPrompts = await promptsService.getPrompts(savedAgent.id);
        const existingPromptIds = existingPrompts.map(p => p.id);
        const currentPromptIds = prompts
          .filter(p => p.id && !p.id.startsWith('temp-'))
          .map(p => p.id);

        // Deletar prompts que foram removidos
        const promptsToDelete = existingPromptIds.filter(id => !currentPromptIds.includes(id));
        for (const promptId of promptsToDelete) {
          await promptsService.deletePrompt(promptId);
        }

        // Criar/atualizar prompts
        for (const prompt of prompts) {
          if (prompt.id && !prompt.id.startsWith('temp-')) {
            // Atualizar prompt existente
            await promptsService.updatePrompt(prompt.id, {
              prompt_type: prompt.prompt_type,
              title: prompt.title,
              content: prompt.content,
              order_index: prompt.order_index,
              is_active: prompt.is_active
            });
          } else {
            // Criar novo prompt
            await promptsService.createPrompt(
              savedAgent.id,
              currentCompany.id,
              savedAgent.client_id,
              {
                prompt_type: prompt.prompt_type,
                title: prompt.title,
                content: prompt.content,
                order_index: prompt.order_index,
                is_active: prompt.is_active
              }
            );
          }
        }
      } else if (savedAgent.id && !savedAgent.client_id) {
        console.warn('Agente criado sem client_id, não é possível salvar prompts');
        setError('Agente criado, mas não foi possível salvar os prompts. Recarregue a página e edite o agente novamente.');
      }

      // Recarregar lista de agentes
      await loadAgents();
      setIsEditing(false);
      setCurrentAgent(null);
      setPrompts([]);
    } catch (err: any) {
      console.error('Erro ao salvar agente:', err);
      setError(err.message || 'Erro ao salvar agente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Tem certeza que deseja deletar este agente?')) return;

    try {
      setError(null);
      await agentsService.deleteAgent(agentId);
      await loadAgents();
    } catch (err: any) {
      console.error('Erro ao deletar agente:', err);
      setError(err.message || 'Erro ao deletar agente');
    }
  };

  const handleDuplicate = async (agentId: string) => {
    try {
      setError(null);
      await agentsService.duplicateAgent(agentId);
      await loadAgents();
    } catch (err: any) {
      console.error('Erro ao duplicar agente:', err);
      setError(err.message || 'Erro ao duplicar agente');
    }
  };

  const addPrompt = () => {
    const newPrompt: PromptType = {
      id: `temp-${Date.now()}`,
      agent_id: currentAgent?.id || '',
      company_id: currentCompany?.id || '',
      client_id: currentAgent?.client_id || '',
      prompt_type: 'instruction',
      title: 'Novo Prompt',
      content: '',
      order_index: prompts.length + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setPrompts([...prompts, newPrompt]);
  };

  const updatePrompt = (id: string, field: keyof PromptType, value: any) => {
    setPrompts(prompts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePrompt = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
  };

  const getPromptBadgeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'instruction': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'constraint': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  // Filtrar agentes por busca e status
  const filteredAgents = agents.filter(agent => {
    if (filterActive === 'active' && !agent.is_active) return false;
    if (filterActive === 'inactive' && agent.is_active) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        agent.name.toLowerCase().includes(search) ||
        agent.description.toLowerCase().includes(search) ||
        agent.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    return true;
  });

  if (isEditing) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsEditing(false);
                setCurrentAgent(null);
                setPrompts([]);
                setError(null);
              }} 
              className="size-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white">{currentAgent?.id ? 'Editar Agente' : 'Novo Agente'}</h2>
              <p className="text-slate-400 text-sm">Configure o comportamento e as instruções da IA.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setIsEditing(false);
                setCurrentAgent(null);
                setPrompts([]);
                setError(null);
              }} 
              disabled={saving}
              className="h-11 px-6 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving || !currentAgent?.name}
              className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configurações Básicas */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">settings</span>
                Parâmetros
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Agente</label>
                  <input 
                    type="text" 
                    value={currentAgent?.name || ''}
                    onChange={(e) => setCurrentAgent(currentAgent ? { ...currentAgent, name: e.target.value } : null)}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Ex: Suporte de Vendas"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição</label>
                  <textarea 
                    value={currentAgent?.description || ''}
                    onChange={(e) => setCurrentAgent(currentAgent ? { ...currentAgent, description: e.target.value } : null)}
                    className="w-full min-h-[80px] bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    placeholder="Descreva o propósito deste agente..."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Temperatura</label>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] text-slate-400 italic">Mais preciso</span>
                     <span className="text-xs font-mono text-blue-400 font-bold">{currentAgent?.temperature || 0.7}</span>
                     <span className="text-[10px] text-slate-400 italic">Mais criativo</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={currentAgent?.temperature || 0.7} 
                    onChange={(e) => setCurrentAgent(currentAgent ? { ...currentAgent, temperature: parseFloat(e.target.value) } : null)}
                    className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Max Tokens</label>
                  <input 
                    type="number" 
                    value={currentAgent?.max_tokens || 2000}
                    onChange={(e) => setCurrentAgent(currentAgent ? { ...currentAgent, max_tokens: parseInt(e.target.value) || 2000 } : null)}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    min="100"
                    max="4000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentAgent(currentAgent ? { ...currentAgent, is_active: !currentAgent.is_active } : null)}
                      className={`flex-1 h-11 rounded-xl font-bold transition-all ${
                        currentAgent?.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-900 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {currentAgent?.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
               <h3 className="text-lg font-bold text-white mb-4">Dicas de Engenharia de Prompt</h3>
               <p className="text-sm text-slate-400 leading-relaxed">
                 Use o tipo <span className="text-violet-400 font-bold">System</span> para definir quem o agente é, <span className="text-blue-400 font-bold">Instruction</span> para o que ele deve fazer e <span className="text-amber-400 font-bold">Constraint</span> para o que ele nunca deve fazer.
               </p>
            </div>
          </div>

          {/* Gestão de Prompts */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-500">terminal</span>
                Gerenciador de Prompts
              </h3>
              <button 
                onClick={addPrompt}
                className="h-9 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-lg">add</span> Adicionar Prompt
              </button>
            </div>

            <div className="space-y-4">
              {prompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 gap-3">
                  <span className="material-symbols-outlined text-4xl">inventory_2</span>
                  <p className="font-medium text-sm">Nenhum prompt configurado para este agente.</p>
                </div>
              ) : (
                prompts.sort((a,b) => a.order_index - b.order_index).map((prompt, index) => (
                  <div key={prompt.id} className={`bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden transition-all ${!prompt.is_active ? 'opacity-60' : ''}`}>
                    <div className="p-4 bg-slate-900/40 border-b border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="size-6 bg-slate-700 rounded text-[10px] font-bold text-slate-400 flex items-center justify-center">
                          {prompt.order_index}
                        </div>
                        <input 
                          type="text"
                          value={prompt.title}
                          onChange={(e) => updatePrompt(prompt.id, 'title', e.target.value)}
                          className="bg-transparent border-none text-white font-bold text-sm focus:ring-0 p-0 w-full"
                          placeholder="Título do Prompt"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`relative flex items-center gap-1.5 min-w-[120px] h-8 px-3 rounded-md text-[11px] font-bold border ${getPromptBadgeColor(prompt.prompt_type)}`}>
                          <span className="flex-1 truncate pointer-events-none" title={prompt.prompt_type}>
                            {prompt.prompt_type === 'system' ? 'SYSTEM' : prompt.prompt_type === 'instruction' ? 'INSTRUCTION' : prompt.prompt_type === 'constraint' ? 'CONSTRAINT' : (prompt.prompt_type || '').toUpperCase()}
                          </span>
                          <select
                            value={prompt.prompt_type}
                            onChange={(e) => updatePrompt(prompt.id, 'prompt_type', e.target.value as any)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label="Tipo do prompt"
                          >
                            <option value="system">SYSTEM</option>
                            <option value="instruction">INSTRUCTION</option>
                            <option value="constraint">CONSTRAINT</option>
                          </select>
                          <span className="material-symbols-outlined text-sm text-current pointer-events-none">expand_more</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updatePrompt(prompt.id, 'is_active', !prompt.is_active)}
                            className={`size-8 flex items-center justify-center rounded-lg transition-all ${prompt.is_active ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 bg-slate-700'}`}
                          >
                            <span className="material-symbols-outlined text-lg">{prompt.is_active ? 'visibility' : 'visibility_off'}</span>
                          </button>
                          <button 
                            onClick={() => removePrompt(prompt.id)}
                            className="size-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <textarea 
                        value={prompt.content}
                        onChange={(e) => updatePrompt(prompt.id, 'content', e.target.value)}
                        className="w-full min-h-[120px] bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                        placeholder="Escreva aqui o conteúdo do prompt..."
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Selecione uma empresa para gerenciar agentes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Meus Agentes</h2>
          <p className="text-slate-400">Gerencie e configure seus assistentes virtuais de IA.</p>
        </div>
        {isGlobalAdmin && (
          <button 
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Criar Agente
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <input 
            className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
            placeholder="Buscar por nome ou tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-500">search</span>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto no-scrollbar">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            <option value="all">Todos os status</option>
            <option value="active">Apenas ativos</option>
            <option value="inactive">Apenas inativos</option>
          </select>
          <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined block">grid_view</span>
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined block">table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="size-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 gap-3">
          <span className="material-symbols-outlined text-4xl">smart_toy</span>
          <p className="font-medium text-sm">Nenhum agente encontrado.</p>
          {isGlobalAdmin && (
            <button 
              onClick={handleCreate}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all"
            >
              Criar Primeiro Agente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAgents.map((agent) => (
            <div 
              key={agent.id}
              className={`group relative flex flex-col justify-between bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 p-6 h-full ${!agent.is_active ? 'opacity-70' : ''}`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="size-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-white/5">
                    <span className="material-symbols-outlined text-2xl">smart_toy</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    agent.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'
                  }`}>
                    {agent.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{agent.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{agent.description || 'Sem descrição'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {agent.tags.length > 0 ? (
                    agent.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-slate-500 border border-slate-700">#{tag}</span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-600">Sem tags</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>Temp: {agent.temperature}</span>
                  <span>•</span>
                  <span>Tokens: {agent.max_tokens}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <span className="material-symbols-outlined text-sm">history</span>
                  {formatTimeAgo(agent.created_at)}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEdit(agent)}
                    className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-500 hover:text-blue-400 transition-all"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  {isGlobalAdmin && (
                    <button 
                      onClick={() => handleDuplicate(agent.id)}
                      className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-500 hover:text-violet-400 transition-all"
                      title="Duplicar"
                    >
                      <span className="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                  )}
                  {isGlobalAdmin && (
                    <button 
                      onClick={() => handleDelete(agent.id)}
                      className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-all"
                      title="Deletar"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

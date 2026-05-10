import React, { useEffect, useState } from 'react';
import * as clientInfoAIService from '../services/clientInfoAIService';
import type {
  ClientInfoForm,
  ClientInfoFormSummary,
  ClientInfoQuestionDraft,
  ClientInfoAnswerType,
  ClientInfoTargetField,
} from '../services/clientInfoAIService';
import * as globalAdminService from '../services/globalAdminService';
import type { GlobalAdminCompany } from '../services/globalAdminService';

const ANSWER_TYPES: Array<{ value: ClientInfoAnswerType; label: string }> = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'boolean', label: 'Sim/Não' },
  { value: 'email', label: 'E-mail' },
  { value: 'uf', label: 'UF' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'client_type', label: 'Tipo de cliente' },
  { value: 'sports_json', label: 'Esportes JSON' },
  { value: 'select', label: 'Seleção' },
  { value: 'multi_select', label: 'Múltipla seleção' },
];

const TARGET_FIELDS: Array<{ value: ClientInfoTargetField; label: string }> = [
  { value: 'custom', label: 'Resposta customizada' },
  { value: 'ai_name', label: 'Nome identificado' },
  { value: 'ai_company', label: 'Empresa/Arena' },
  { value: 'ai_city', label: 'Cidade' },
  { value: 'ai_state', label: 'Estado (UF)' },
  { value: 'ai_sports', label: 'Esportes' },
  { value: 'ai_courts', label: 'Nº de quadras' },
  { value: 'ai_email', label: 'E-mail' },
  { value: 'ai_social', label: 'Rede social' },
  { value: 'ai_client_type', label: 'Tipo de cliente' },
  { value: 'ai_marketing', label: 'Marketing' },
];

function createBlankQuestion(orderIndex = 0): ClientInfoQuestionDraft {
  return {
    question_text: '',
    help_text: '',
    answer_type: 'text',
    target_field: 'custom',
    options: [],
    is_required: false,
    order_index: orderIndex,
  };
}

export function AdminClientInfoFormsPage() {
  const [companies, setCompanies] = useState<GlobalAdminCompany[]>([]);
  const [allForms, setAllForms] = useState<ClientInfoFormSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [detailForm, setDetailForm] = useState<ClientInfoForm | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingMeta, setEditingMeta] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [editingQuestions, setEditingQuestions] = useState(false);
  const [draftQuestions, setDraftQuestions] = useState<ClientInfoQuestionDraft[]>([]);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const [showReplace, setShowReplace] = useState(false);
  const [replaceName, setReplaceName] = useState('');
  const [replaceDescription, setReplaceDescription] = useState('');

  async function loadList() {
    setLoadingList(true);
    try {
      const [loadedCompanies, loadedForms] = await Promise.all([
        globalAdminService.getAllCompanies(),
        clientInfoAIService.adminListAllForms(),
      ]);
      setCompanies(loadedCompanies.filter((c) => c.is_active));
      setAllForms(loadedForms);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  async function selectCompany(companyId: string) {
    setSelectedCompanyId(companyId);
    setDetailForm(null);
    setEditingMeta(false);
    setEditingQuestions(false);
    setShowNewForm(false);
    setShowReplace(false);
    setError(null);
    setSuccess(null);

    const formSummary = allForms.find((f) => f.company_id === companyId && f.is_active);
    if (!formSummary) return;

    setLoadingDetail(true);
    try {
      const full = await clientInfoAIService.adminGetFormWithQuestions(formSummary.id);
      setDetailForm(full);
      if (full && !full.locked_at) {
        setDraftName(full.name);
        setDraftDescription(full.description ?? '');
        setDraftQuestions(
          full.questions.length > 0
            ? full.questions.map((q, i) => ({
                question_text: q.question_text,
                help_text: q.help_text ?? '',
                answer_type: q.answer_type,
                target_field: q.target_field,
                options: q.options ?? [],
                is_required: q.is_required,
                order_index: i,
              }))
            : [createBlankQuestion()]
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar formulário');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleCreateForm() {
    if (!newName.trim() || !selectedCompanyId) return;
    setSaving(true);
    setError(null);
    try {
      const created = await clientInfoAIService.adminCreateForm({
        companyId: selectedCompanyId,
        name: newName.trim(),
        description: newDescription.trim() || null,
      });
      setNewName('');
      setNewDescription('');
      setShowNewForm(false);
      setSuccess('Formulário criado com sucesso.');
      await loadList();
      const full = await clientInfoAIService.adminGetFormWithQuestions(created.id);
      setDetailForm(full);
      if (full) {
        setDraftName(full.name);
        setDraftDescription(full.description ?? '');
        setDraftQuestions([createBlankQuestion()]);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar formulário');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMeta() {
    if (!detailForm || !draftName.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await clientInfoAIService.adminUpdateFormMetadata({
        formId: detailForm.id,
        name: draftName.trim(),
        description: draftDescription.trim() || null,
      });
      setSuccess('Metadados atualizados.');
      setEditingMeta(false);
      const full = await clientInfoAIService.adminGetFormWithQuestions(detailForm.id);
      setDetailForm(full);
      await loadList();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar metadados');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveQuestions() {
    if (!detailForm) return;
    if (draftQuestions.some((q) => !q.question_text.trim())) {
      setError('Todas as perguntas precisam de texto.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await clientInfoAIService.adminSaveFormQuestions(
        detailForm.id,
        draftQuestions.map((q, i) => ({
          ...q,
          question_text: q.question_text.trim(),
          help_text: q.help_text?.trim() || null,
          order_index: i,
        }))
      );
      setSuccess('Perguntas salvas.');
      setEditingQuestions(false);
      const full = await clientInfoAIService.adminGetFormWithQuestions(detailForm.id);
      setDetailForm(full);
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar perguntas');
    } finally {
      setSaving(false);
    }
  }

  async function handleReplaceForm() {
    if (!replaceName.trim() || !detailForm || !selectedCompanyId) return;
    if (!confirm(`Arquivar "${detailForm.name}" e criar "${replaceName.trim()}"? As respostas existentes são preservadas.`)) return;
    setSaving(true);
    setError(null);
    try {
      await clientInfoAIService.adminArchiveForm(detailForm.id);
      const created = await clientInfoAIService.adminCreateForm({
        companyId: selectedCompanyId,
        name: replaceName.trim(),
        description: replaceDescription.trim() || null,
      });
      setReplaceName('');
      setReplaceDescription('');
      setShowReplace(false);
      setSuccess('Formulário substituído com sucesso.');
      await loadList();
      const full = await clientInfoAIService.adminGetFormWithQuestions(created.id);
      setDetailForm(full);
      if (full) {
        setDraftName(full.name);
        setDraftDescription(full.description ?? '');
        setDraftQuestions([createBlankQuestion()]);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao substituir formulário');
    } finally {
      setSaving(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<ClientInfoQuestionDraft>) {
    setDraftQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= draftQuestions.length) return;
    setDraftQuestions((prev) => {
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr.map((q, i) => ({ ...q, order_index: i }));
    });
  }

  const selectedCompany = companies.find((c) => c.company_id === selectedCompanyId);
  const activeFormSummary = selectedCompanyId
    ? allForms.find((f) => f.company_id === selectedCompanyId && f.is_active)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-white">Formulários de Coleta</h2>
        <p className="text-sm text-slate-400 mt-1">Gerencie os formulários da IA de cadastro por empresa.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">error</span>
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-start gap-2">
          <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">check_circle</span>
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company list */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-sm font-bold text-white">Empresas</h3>
          </div>
          {loadingList ? (
            <div className="py-12 flex items-center justify-center">
              <div className="size-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
              {companies.map((company) => {
                const form = allForms.find((f) => f.company_id === company.company_id && f.is_active);
                const isSelected = selectedCompanyId === company.company_id;
                return (
                  <button
                    key={company.company_id}
                    onClick={() => selectCompany(company.company_id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      isSelected
                        ? 'bg-violet-600/15 border-l-2 border-violet-500'
                        : 'hover:bg-slate-700/30 border-l-2 border-transparent'
                    }`}
                  >
                    <p className={`text-sm font-bold ${isSelected ? 'text-violet-200' : 'text-white'}`}>
                      {company.company_name}
                    </p>
                    <div className="mt-1">
                      {form ? (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          form.locked_at ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          <span className="material-symbols-outlined text-sm">
                            {form.locked_at ? 'lock' : 'edit'}
                          </span>
                          {form.locked_at ? 'Travado' : 'Draft'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <span className="material-symbols-outlined text-sm">remove_circle</span>
                          Sem formulário
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selectedCompanyId ? (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-5xl block mb-3">dynamic_form</span>
              <p>Selecione uma empresa para gerenciar seu formulário.</p>
            </div>
          ) : loadingDetail ? (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 flex items-center justify-center">
              <div className="size-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !activeFormSummary && !detailForm ? (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white">{selectedCompany?.company_name}</h3>
                <p className="text-xs text-slate-500 mt-1">Nenhum formulário ativo.</p>
              </div>
              <div className="p-6">
                {!showNewForm ? (
                  <button
                    onClick={() => setShowNewForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-600/20 transition-colors"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Criar formulário
                  </button>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white">Novo formulário</h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome *</label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                        placeholder="Cadastro inicial"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
                      <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                        placeholder="Uso interno"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowNewForm(false); setNewName(''); setNewDescription(''); }}
                        className="h-10 px-4 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-700 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCreateForm}
                        disabled={saving || !newName.trim()}
                        className="h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition-all"
                      >
                        {saving && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Criar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : detailForm ? (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              {/* Form header */}
              <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{detailForm.name}</h3>
                    {detailForm.locked_at ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        Travado desde {new Date(detailForm.locked_at).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Draft
                      </span>
                    )}
                  </div>
                  {detailForm.description && (
                    <p className="text-sm text-slate-400 mt-0.5">{detailForm.description}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{selectedCompany?.company_name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!detailForm.locked_at && !editingMeta && !editingQuestions && (
                    <button
                      onClick={() => { setEditingMeta(true); setDraftName(detailForm.name); setDraftDescription(detailForm.description ?? ''); }}
                      className="h-9 px-3 rounded-xl border border-slate-600 text-slate-400 text-sm hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      Editar
                    </button>
                  )}
                  {detailForm.locked_at && !showReplace && (
                    <button
                      onClick={() => { setShowReplace(true); setReplaceName(''); setReplaceDescription(''); }}
                      className="h-9 px-3 rounded-xl border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/10 transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">swap_horiz</span>
                      Substituir
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Meta edit panel */}
                {editingMeta && (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome *</label>
                        <input
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
                        <input
                          type="text"
                          value={draftDescription}
                          onChange={(e) => setDraftDescription(e.target.value)}
                          className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingMeta(false)} className="h-9 px-4 rounded-xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-700 transition-all">Cancelar</button>
                      <button onClick={handleSaveMeta} disabled={saving} className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition-all">
                        {saving && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {/* Replace form panel */}
                {showReplace && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-400">warning</span>
                      <p className="text-sm font-bold text-amber-300">Substituir formulário</p>
                    </div>
                    <p className="text-xs text-amber-200/70">
                      O formulário atual será arquivado. As respostas dos clientes são preservadas.
                      O novo formulário começa como draft até receber a primeira resposta.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do novo formulário *</label>
                        <input
                          type="text"
                          value={replaceName}
                          onChange={(e) => setReplaceName(e.target.value)}
                          className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Cadastro 2026"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
                        <input
                          type="text"
                          value={replaceDescription}
                          onChange={(e) => setReplaceDescription(e.target.value)}
                          className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowReplace(false)} className="h-9 px-4 rounded-xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-700 transition-all">Cancelar</button>
                      <button onClick={handleReplaceForm} disabled={saving || !replaceName.trim()} className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition-all">
                        {saving && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Substituir
                      </button>
                    </div>
                  </div>
                )}

                {/* Questions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Perguntas ({detailForm.questions.length})
                    </p>
                    {!detailForm.locked_at && !editingQuestions && (
                      <button
                        onClick={() => {
                          setEditingQuestions(true);
                          setDraftQuestions(
                            detailForm.questions.length > 0
                              ? detailForm.questions.map((q, i) => ({
                                  question_text: q.question_text,
                                  help_text: q.help_text ?? '',
                                  answer_type: q.answer_type,
                                  target_field: q.target_field,
                                  options: q.options ?? [],
                                  is_required: q.is_required,
                                  order_index: i,
                                }))
                              : [createBlankQuestion()]
                          );
                        }}
                        className="h-8 px-3 rounded-xl border border-slate-600 text-slate-400 text-xs hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Editar perguntas
                      </button>
                    )}
                  </div>

                  {editingQuestions ? (
                    <div className="space-y-3">
                      {draftQuestions.map((question, index) => (
                        <div key={index} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-xs text-slate-500 w-5 text-right mt-3 flex-shrink-0">{index + 1}.</span>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={question.question_text}
                                onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                placeholder="Texto da pergunta"
                              />
                              <input
                                type="text"
                                value={question.help_text ?? ''}
                                onChange={(e) => updateQuestion(index, { help_text: e.target.value })}
                                className="w-full h-9 bg-slate-800 border border-slate-700 rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                placeholder="Instrução para a IA (opcional)"
                              />
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <select
                                  value={question.answer_type}
                                  onChange={(e) => updateQuestion(index, { answer_type: e.target.value as ClientInfoAnswerType })}
                                  className="h-9 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                >
                                  {ANSWER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <select
                                  value={question.target_field}
                                  onChange={(e) => updateQuestion(index, { target_field: e.target.value as ClientInfoTargetField })}
                                  className="h-9 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                >
                                  {TARGET_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                                <label className="h-9 px-3 rounded-xl border border-slate-700 bg-slate-800 flex items-center gap-2 text-sm text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={question.is_required}
                                    onChange={(e) => updateQuestion(index, { is_required: e.target.checked })}
                                    className="rounded bg-slate-900 border-slate-700 text-violet-600"
                                  />
                                  Obrigatória
                                </label>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button onClick={() => moveQuestion(index, -1)} disabled={index === 0} className="size-8 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-all">
                                <span className="material-symbols-outlined text-base">arrow_upward</span>
                              </button>
                              <button onClick={() => moveQuestion(index, 1)} disabled={index === draftQuestions.length - 1} className="size-8 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-all">
                                <span className="material-symbols-outlined text-base">arrow_downward</span>
                              </button>
                              <button onClick={() => setDraftQuestions((prev) => prev.filter((_, i) => i !== index))} disabled={draftQuestions.length <= 1} className="size-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 disabled:opacity-30 transition-all">
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => setDraftQuestions((prev) => [...prev, createBlankQuestion(prev.length)])}
                        className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        Adicionar pergunta
                      </button>

                      <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
                        <button onClick={() => setEditingQuestions(false)} className="h-10 px-5 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-700 transition-all">
                          Cancelar
                        </button>
                        <button onClick={handleSaveQuestions} disabled={saving} className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2 transition-all">
                          {saving && <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                          Salvar perguntas
                        </button>
                      </div>
                    </div>
                  ) : detailForm.questions.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-4 text-center">
                      Sem perguntas.{!detailForm.locked_at && ' Clique em "Editar perguntas" para adicionar.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detailForm.questions.map((question, idx) => (
                        <div key={question.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-xs font-bold text-slate-500 w-5 flex-shrink-0 mt-0.5">{idx + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">{question.question_text}</p>
                              {question.help_text && (
                                <p className="text-xs text-slate-500 mt-0.5">{question.help_text}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300">
                                  {ANSWER_TYPES.find((t) => t.value === question.answer_type)?.label ?? question.answer_type}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300">
                                  {TARGET_FIELDS.find((f) => f.value === question.target_field)?.label ?? question.target_field}
                                </span>
                                {question.is_required && (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                    Obrigatória
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as adminService from '../../services/attendanceTypesAdminService';
import type { GlobalAttendanceType } from '../../services/attendanceTypesAdminService';
import type { AttendanceTypeField } from '../../services/attendancesService';
import * as globalAdminService from '../../services/globalAdminService';
import type { GlobalAdminCompany } from '../../services/globalAdminService';
import { formatSupabaseError } from '../../lib/errors';

const FIELD_TYPES: { id: string; label: string }[] = [
  { id: 'text', label: 'Texto' },
  { id: 'textarea', label: 'Texto longo' },
  { id: 'number', label: 'Número' },
  { id: 'date', label: 'Data' },
  { id: 'select', label: 'Seleção' },
  { id: 'section_client', label: 'Seção — Cliente' },
  { id: 'section_appointment', label: 'Seção — Agendamento' },
  { id: 'section_costs', label: 'Seção — Custos' },
];

const inputCls =
  'w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all';
const labelCls = 'block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2';

const slugify = (v: string): string =>
  v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

interface TypeForm {
  id?: string | null;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  position: number;
}

interface FieldForm {
  id?: string | null;
  key: string;
  label: string;
  field_type: string;
  is_required: boolean;
  position: number;
  is_active: boolean;
  options_text: string;
}

const emptyTypeForm: TypeForm = {
  id: null,
  name: '',
  slug: '',
  description: '',
  is_active: true,
  position: 0,
};

const emptyFieldForm: FieldForm = {
  id: null,
  key: '',
  label: '',
  field_type: 'text',
  is_required: false,
  position: 0,
  is_active: true,
  options_text: '',
};

export const GlobalAttendanceTypesTab: React.FC = () => {
  const [types, setTypes] = useState<GlobalAttendanceType[]>([]);
  const [companies, setCompanies] = useState<GlobalAdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'fields' | 'companies' | null>(null);

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeForm, setTypeForm] = useState<TypeForm>(emptyTypeForm);
  const [savingType, setSavingType] = useState(false);

  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState<FieldForm>(emptyFieldForm);
  const [fieldContextTypeId, setFieldContextTypeId] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);

  const [companiesByType, setCompaniesByType] = useState<
    Record<string, { company_id: string; company_name: string; is_linked: boolean; company_type_id: string; link_is_active: boolean }[]>
  >({});
  const [busyLink, setBusyLink] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await adminService.getGlobalAttendanceTypes();
      setTypes([...list].sort((a, b) => a.position - b.position));
    } catch (e) {
      setError(formatSupabaseError(e, 'Erro ao carregar tipos de atendimento.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTypes();
    globalAdminService
      .getAllCompanies()
      .then(setCompanies)
      .catch((e) => setError(formatSupabaseError(e, 'Erro ao carregar empresas.')));
  }, [loadTypes]);

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(null), 3500);
  };

  const openCreateType = () => {
    setTypeForm({ ...emptyTypeForm, position: types.length + 1 });
    setTypeModalOpen(true);
  };

  const openEditType = (t: GlobalAttendanceType) => {
    setTypeForm({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description ?? '',
      is_active: t.is_active,
      position: t.position,
    });
    setTypeModalOpen(true);
  };

  const saveType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingType(true);
      await adminService.upsertGlobalAttendanceType({
        id: typeForm.id ?? null,
        name: typeForm.name.trim(),
        slug: slugify(typeForm.slug || typeForm.name),
        description: typeForm.description.trim() || null,
        isActive: typeForm.is_active,
        position: typeForm.position,
      });
      setTypeModalOpen(false);
      flashSuccess(typeForm.id ? 'Tipo atualizado.' : 'Tipo criado.');
      await loadTypes();
    } catch (err) {
      setError(formatSupabaseError(err, 'Erro ao salvar tipo.'));
    } finally {
      setSavingType(false);
    }
  };

  const toggleExpand = (typeId: string, section: 'fields' | 'companies') => {
    if (expandedTypeId === typeId && expandedSection === section) {
      setExpandedTypeId(null);
      setExpandedSection(null);
      return;
    }
    setExpandedTypeId(typeId);
    setExpandedSection(section);
    if (section === 'companies' && !companiesByType[typeId]) {
      adminService
        .getCompaniesForAttendanceType(typeId)
        .then((list) => setCompaniesByType((prev) => ({ ...prev, [typeId]: list })))
        .catch((e) => setError(formatSupabaseError(e, 'Erro ao carregar empresas do tipo.')));
    }
  };

  const openCreateField = (typeId: string) => {
    const t = types.find((x) => x.id === typeId);
    setFieldContextTypeId(typeId);
    setFieldForm({ ...emptyFieldForm, position: (t?.fields.length ?? 0) + 1 });
    setFieldModalOpen(true);
  };

  const openEditField = (typeId: string, f: AttendanceTypeField) => {
    setFieldContextTypeId(typeId);
    setFieldForm({
      id: f.id,
      key: f.key,
      label: f.label,
      field_type: f.field_type,
      is_required: f.is_required,
      position: f.position,
      is_active: f.is_active,
      options_text: Array.isArray(f.options) ? (f.options as unknown[]).map(String).join('\n') : '',
    });
    setFieldModalOpen(true);
  };

  const saveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldContextTypeId) return;
    try {
      setSavingField(true);
      const options: unknown =
        fieldForm.field_type === 'select' && fieldForm.options_text.trim()
          ? fieldForm.options_text
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : null;
      await adminService.upsertAttendanceTypeField({
        typeId: fieldContextTypeId,
        fieldId: fieldForm.id ?? null,
        key: slugify(fieldForm.key || fieldForm.label),
        label: fieldForm.label.trim(),
        fieldType: fieldForm.field_type,
        required: fieldForm.is_required,
        options,
        position: fieldForm.position,
        isActive: fieldForm.is_active,
      });
      setFieldModalOpen(false);
      flashSuccess(fieldForm.id ? 'Campo atualizado.' : 'Campo criado.');
      await loadTypes();
    } catch (err) {
      setError(formatSupabaseError(err, 'Erro ao salvar campo.'));
    } finally {
      setSavingField(false);
    }
  };

  const deleteField = async (fieldId: string) => {
    if (!window.confirm('Remover este campo? Os valores já gravados em atendimentos permanecerão, mas deixarão de ser exibidos.')) return;
    try {
      await adminService.deleteAttendanceTypeField(fieldId);
      flashSuccess('Campo removido.');
      await loadTypes();
    } catch (err) {
      setError(formatSupabaseError(err, 'Erro ao remover campo.'));
    }
  };

  const refreshTypeCompanies = async (typeId: string) => {
    const list = await adminService.getCompaniesForAttendanceType(typeId);
    setCompaniesByType((prev) => ({ ...prev, [typeId]: list }));
  };

  const toggleCompanyLink = async (typeId: string, companyId: string, linked: boolean) => {
    try {
      setBusyLink(`${typeId}:${companyId}`);
      if (linked) {
        await adminService.unlinkAttendanceTypeFromCompany(companyId, typeId);
      } else {
        await adminService.linkAttendanceTypeToCompany({ companyId, typeId, isActive: true, position: 0 });
      }
      await refreshTypeCompanies(typeId);
    } catch (err) {
      setError(formatSupabaseError(err, 'Erro ao alterar vínculo.'));
    } finally {
      setBusyLink(null);
    }
  };

  const companiesLinkState = useMemo(() => {
    return (typeId: string) => {
      const linked = companiesByType[typeId] ?? [];
      const linkedIds = new Set(linked.map((l) => l.company_id));
      return companies.map((c) => {
        const match = linked.find((l) => l.company_id === c.company_id);
        return {
          company_id: c.company_id,
          company_name: c.company_name,
          is_linked: linkedIds.has(c.company_id),
          link_is_active: match?.link_is_active ?? false,
        };
      });
    };
  }, [companies, companiesByType]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 text-sm text-red-300 flex items-start gap-2">
          <span className="material-symbols-outlined text-base mt-0.5">error</span>
          <span className="flex-1 whitespace-pre-line">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-300/70 hover:text-red-100">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 text-sm text-emerald-300">{success}</div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/20 border-b border-slate-700 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-white font-semibold">Catálogo global de tipos</h2>
            <p className="text-xs text-slate-500 mt-0.5">Tipos disponíveis para toda a plataforma. Cada empresa habilita em Atendimento → Ajustes.</p>
          </div>
          <button
            type="button"
            onClick={openCreateType}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Novo tipo
          </button>
        </div>

        <div className="divide-y divide-slate-700/60">
          {loading ? (
            <div className="p-12 flex justify-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="size-5 border-2 border-slate-500/30 border-t-violet-400 rounded-full animate-spin" />
                Carregando…
              </div>
            </div>
          ) : types.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Nenhum tipo cadastrado. Clique em &quot;Novo tipo&quot; para começar.
            </div>
          ) : (
            types.map((t) => {
              const isOpen = expandedTypeId === t.id;
              return (
                <div key={t.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold truncate">{t.name}</p>
                        {!t.is_active && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-700 text-slate-300 text-[10px] uppercase tracking-widest">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500 font-mono truncate">{t.slug}</span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500">pos {t.position}</span>
                        <span className="text-xs text-slate-600">·</span>
                        <span className="text-xs text-slate-500">{t.fields.length} campo{t.fields.length !== 1 ? 's' : ''}</span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{t.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleExpand(t.id, 'fields')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                          isOpen && expandedSection === 'fields'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">view_list</span>
                          Campos
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(t.id, 'companies')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                          isOpen && expandedSection === 'companies'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">business</span>
                          Empresas
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditType(t)}
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">edit</span>
                          Editar
                        </span>
                      </button>
                    </div>
                  </div>

                  {isOpen && expandedSection === 'fields' && (
                    <div className="mt-4 bg-slate-900/60 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          Campos do tipo
                        </p>
                        <button
                          type="button"
                          onClick={() => openCreateField(t.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          Novo campo
                        </button>
                      </div>
                      {t.fields.length === 0 ? (
                        <p className="text-xs text-slate-500">Nenhum campo configurado.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {t.fields.map((f) => (
                            <li
                              key={f.id}
                              className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                            >
                              <span className="text-slate-500 text-xs w-6 text-right">{f.position}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-white text-sm truncate">{f.label}</p>
                                  {f.is_required && (
                                    <span className="text-[10px] text-amber-300 uppercase">obrig.</span>
                                  )}
                                  {!f.is_active && (
                                    <span className="text-[10px] text-slate-400 uppercase">inativo</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono truncate">
                                  {f.key} · {f.field_type}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => openEditField(t.id, f)}
                                className="text-slate-400 hover:text-white"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteField(f.id)}
                                className="text-slate-500 hover:text-red-400"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {isOpen && expandedSection === 'companies' && (
                    <div className="mt-4 bg-slate-900/60 border border-slate-700 rounded-xl p-4">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Empresas vinculadas
                      </p>
                      {!companiesByType[t.id] ? (
                        <p className="text-xs text-slate-500">Carregando…</p>
                      ) : companies.length === 0 ? (
                        <p className="text-xs text-slate-500">Nenhuma empresa cadastrada.</p>
                      ) : (
                        <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                          {companiesLinkState(t.id).map((c) => {
                            const busy = busyLink === `${t.id}:${c.company_id}`;
                            return (
                              <li
                                key={c.company_id}
                                className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm truncate">{c.company_name}</p>
                                  {c.is_linked && !c.link_is_active && (
                                    <p className="text-[10px] text-slate-500">vinculado — inativo na empresa</p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => toggleCompanyLink(t.id, c.company_id, c.is_linked)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    c.is_linked
                                      ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-600/30'
                                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {busy ? '...' : c.is_linked ? 'Vinculado' : 'Vincular'}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {typeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={saveType}
            className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {typeForm.id ? 'Editar tipo' : 'Novo tipo'}
              </h3>
              <button
                type="button"
                onClick={() => setTypeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className={labelCls}>Nome</label>
              <input
                required
                value={typeForm.name}
                onChange={(e) =>
                  setTypeForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                    slug: prev.slug || slugify(e.target.value),
                  }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <input
                required
                value={typeForm.slug}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls}>Descrição</label>
              <textarea
                value={typeForm.description}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                className={`${inputCls} h-auto py-2`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Posição</label>
                <input
                  type="number"
                  value={typeForm.position}
                  onChange={(e) =>
                    setTypeForm((prev) => ({ ...prev, position: Number(e.target.value) || 0 }))
                  }
                  className={inputCls}
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-slate-200 h-11">
                  <input
                    type="checkbox"
                    checked={typeForm.is_active}
                    onChange={(e) =>
                      setTypeForm((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="size-4 accent-violet-500"
                  />
                  Ativo
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTypeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingType}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-50"
              >
                {savingType ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {fieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={saveField}
            className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {fieldForm.id ? 'Editar campo' : 'Novo campo'}
              </h3>
              <button
                type="button"
                onClick={() => setFieldModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Rótulo</label>
                <input
                  required
                  value={fieldForm.label}
                  onChange={(e) =>
                    setFieldForm((prev) => ({
                      ...prev,
                      label: e.target.value,
                      key: prev.key || slugify(e.target.value),
                    }))
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Chave</label>
                <input
                  required
                  value={fieldForm.key}
                  onChange={(e) =>
                    setFieldForm((prev) => ({ ...prev, key: slugify(e.target.value) }))
                  }
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo</label>
                <select
                  value={fieldForm.field_type}
                  onChange={(e) =>
                    setFieldForm((prev) => ({ ...prev, field_type: e.target.value }))
                  }
                  className={inputCls}
                >
                  {FIELD_TYPES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Posição</label>
                <input
                  type="number"
                  value={fieldForm.position}
                  onChange={(e) =>
                    setFieldForm((prev) => ({ ...prev, position: Number(e.target.value) || 0 }))
                  }
                  className={inputCls}
                />
              </div>
            </div>

            {fieldForm.field_type === 'select' && (
              <div>
                <label className={labelCls}>Opções (uma por linha)</label>
                <textarea
                  value={fieldForm.options_text}
                  onChange={(e) =>
                    setFieldForm((prev) => ({ ...prev, options_text: e.target.value }))
                  }
                  rows={4}
                  className={`${inputCls} h-auto py-2 font-mono text-xs`}
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={fieldForm.is_required}
                  onChange={(e) =>
                    setFieldForm((prev) => ({ ...prev, is_required: e.target.checked }))
                  }
                  className="size-4 accent-violet-500"
                />
                Obrigatório
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={fieldForm.is_active}
                  onChange={(e) =>
                    setFieldForm((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="size-4 accent-violet-500"
                />
                Ativo
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFieldModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingField}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold disabled:opacity-50"
              >
                {savingField ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

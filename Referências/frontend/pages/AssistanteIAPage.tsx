import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { supabase } from '../lib/supabase';
import * as svc from '../services/assistanteIAService';
import type {
  AiForm,
  AiFormQuestion,
  AiTranscriptionAnswer,
  AiTranscriptionAnswerEdit,
  TranscricaoResult,
  ClientOption,
  AttendanceOption,
  TranscriptionListItem,
  AllAnswerEdit,
  AiTranscriptionEdit,
} from '../services/assistanteIAService';
import { getCompanyUsers } from '../services/companyUsersService';
import * as attendancesService from '../services/attendancesService';
import { EntityShortId } from '../components/EntityShortId';

type Tab = 'transcricao' | 'historico' | 'formularios';

/** Mesmo formato do seletor em «Editar vínculos»: DD/MM/AAAA, HH:mm — Tipo */
function formatAttendanceDateAndType(params: {
  attended_at?: string | null;
  created_at?: string | null;
  type_name?: string | null;
}): string {
  const referenceDate = params.attended_at ?? params.created_at ?? null;
  const dateLabel = referenceDate
    ? new Date(referenceDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : 'Sem data';
  const typeName = (params.type_name ?? '').trim();
  return `${dateLabel}${typeName ? ` — ${typeName}` : ''}`;
}

function formatAttendanceOption(a: AttendanceOption): string {
  return formatAttendanceDateAndType({
    attended_at: a.attended_at,
    created_at: a.created_at,
    type_name: a.type_name,
  });
}

// ─── Formulários ────────────────────────────────────────────────────────────

interface QuestionDraft {
  id?: string;
  question_text: string;
}

function FormsTab({ companyId }: { companyId: string }) {
  const [forms, setForms] = useState<AiForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingForm, setEditingForm] = useState<AiForm | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[]>([]);
  const [isNew, setIsNew] = useState(false);

  const loadForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setForms(await svc.listForms(companyId));
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar formulários');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { loadForms(); }, [loadForms]);

  function openNew() {
    setIsNew(true);
    setEditingForm(null);
    setDraftName('');
    setDraftDescription('');
    setDraftQuestions([{ question_text: '' }]);
    setError(null);
    setSuccess(null);
  }

  async function openEdit(form: AiForm) {
    setIsNew(false);
    setEditingForm(form);
    setDraftName(form.name);
    setDraftDescription(form.description ?? '');
    setError(null);
    setSuccess(null);
    try {
      const full = await svc.getFormWithQuestions(form.id);
      setDraftQuestions(
        full?.questions.map(q => ({ id: q.id, question_text: q.question_text })) ?? []
      );
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar perguntas');
    }
  }

  function cancelEdit() {
    setEditingForm(null);
    setIsNew(false);
    setDraftQuestions([]);
    setError(null);
    setSuccess(null);
  }

  async function handleDelete(formId: string) {
    if (!confirm('Desativar este formulário?')) return;
    try {
      await svc.deleteForm(formId);
      await loadForms();
      if (editingForm?.id === formId) cancelEdit();
    } catch (e: any) {
      setError(e.message ?? 'Erro ao remover formulário');
    }
  }

  async function handleSave() {
    if (!draftName.trim()) { setError('O nome é obrigatório.'); return; }
    if (draftQuestions.some(q => !q.question_text.trim())) {
      setError('Todas as perguntas devem ter texto.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let formId: string;
      if (isNew) {
        const created = await svc.createForm({
          companyId,
          name: draftName.trim(),
          description: draftDescription.trim() || undefined,
        });
        formId = created.id;
      } else {
        formId = editingForm!.id;
        await svc.updateForm({
          formId,
          name: draftName.trim(),
          description: draftDescription.trim() || null,
        });
      }
      await svc.saveFormQuestions(
        formId,
        draftQuestions.map((q, i) => ({ question_text: q.question_text.trim(), order_index: i }))
      );
      setSuccess('Formulário salvo com sucesso.');
      await loadForms();
      cancelEdit();
    } catch (e: any) {
      setError(e.message ?? 'Erro ao salvar formulário');
    } finally {
      setSaving(false);
    }
  }

  function addQuestion() {
    setDraftQuestions(prev => [...prev, { question_text: '' }]);
  }

  function removeQuestion(idx: number) {
    setDraftQuestions(prev => prev.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, text: string) {
    setDraftQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question_text: text } : q));
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    const to = idx + dir;
    if (to < 0 || to >= draftQuestions.length) return;
    const next = [...draftQuestions];
    [next[idx], next[to]] = [next[to], next[idx]];
    setDraftQuestions(next);
  }

  const showEditor = isNew || editingForm !== null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <span className="material-symbols-outlined text-xl">error</span>
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span className="text-sm">{success}</span>
        </div>
      )}

      {!showEditor && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Formulários de perguntas</h2>
            <button
              onClick={openNew}
              className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Novo formulário
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
              Carregando…
            </div>
          ) : forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
              <span className="material-symbols-outlined text-4xl">description</span>
              <p className="text-sm">Nenhum formulário cadastrado ainda.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-700">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Criado em</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form, i) => (
                    <tr
                      key={form.id}
                      className={`border-b border-slate-700/50 ${i % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'} hover:bg-slate-700/30 transition-colors`}
                    >
                      <td className="px-4 py-3 text-sm text-white font-medium">{form.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{form.description ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(form.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEdit(form)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-all"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(form.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all"
                            title="Desativar"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showEditor && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {isNew ? 'Novo formulário' : `Editando: ${editingForm?.name}`}
            </h2>
            <button
              onClick={cancelEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Nome *</label>
            <input
              type="text"
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              placeholder="Nome do formulário"
              className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Descrição</label>
            <input
              type="text"
              value={draftDescription}
              onChange={e => setDraftDescription(e.target.value)}
              placeholder="Descrição opcional"
              className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Perguntas</label>
            {draftQuestions.map((q, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-5 text-right shrink-0">{idx + 1}.</span>
                <input
                  type="text"
                  value={q.question_text}
                  onChange={e => updateQuestion(idx, e.target.value)}
                  placeholder={`Pergunta ${idx + 1}`}
                  className="flex-1 h-10 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveQuestion(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">arrow_upward</span>
                  </button>
                  <button
                    onClick={() => moveQuestion(idx, 1)}
                    disabled={idx === draftQuestions.length - 1}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">arrow_downward</span>
                  </button>
                  <button
                    onClick={() => removeQuestion(idx)}
                    disabled={draftQuestions.length <= 1}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 disabled:opacity-30 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addQuestion}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Adicionar pergunta
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700">
            <button
              onClick={cancelEdit}
              className="h-10 px-5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
            >
              {saving && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
              Salvar formulário
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transcrição ─────────────────────────────────────────────────────────────

interface AnswerWithEdits extends AiTranscriptionAnswer {
  edits: AiTranscriptionAnswerEdit[];
  editValue: string;
  editOpen: boolean;
  loadingEdits: boolean;
}

function TranscricaoTab({ companyId, userId }: { companyId: string; userId: string }) {
  const [forms, setForms] = useState<AiForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState('');

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [attendances, setAttendances] = useState<AttendanceOption[]>([]);
  const [attendancesLoading, setAttendancesLoading] = useState(false);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState('');
  const [linkedAppointmentDate, setLinkedAppointmentDate] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transcribing, setTranscribing] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [transcriptionText, setTranscriptionText] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerWithEdits[]>([]);

  useEffect(() => {
    svc.listForms(companyId).then(setForms).catch(() => {});
    svc.listClientsForSelect(companyId).then(setClients).catch(() => {});
  }, [companyId]);

  useEffect(() => {
    setSelectedAttendanceId('');
    setLinkedAppointmentDate(null);
    if (!selectedClientId) {
      setAttendances([]);
      setAttendancesLoading(false);
      return;
    }
    setAttendancesLoading(true);
    svc.listAttendancesForSelect(companyId, selectedClientId)
      .then(setAttendances)
      .catch(() => setAttendances([]))
      .finally(() => setAttendancesLoading(false));
  }, [companyId, selectedClientId]);

  async function handleAttendanceChange(attendanceId: string) {
    setSelectedAttendanceId(attendanceId);
    setLinkedAppointmentDate(null);
    if (!attendanceId) return;
    const att = attendances.find(a => a.id === attendanceId);
    if (att?.appointment_id) {
      try {
        const scheduledAt = await svc.getAppointmentScheduledAt(att.appointment_id);
        setLinkedAppointmentDate(scheduledAt);
      } catch {
        // silencia — appointment pode não estar acessível ainda
      }
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function toggleEdits(idx: number) {
    const ans = answers[idx];
    if (ans.editOpen) {
      setAnswers(prev => prev.map((a, i) => i === idx ? { ...a, editOpen: false } : a));
      return;
    }
    if (ans.edits.length > 0) {
      setAnswers(prev => prev.map((a, i) => i === idx ? { ...a, editOpen: true } : a));
      return;
    }
    setAnswers(prev => prev.map((a, i) => i === idx ? { ...a, loadingEdits: true, editOpen: true } : a));
    try {
      const edits = await svc.getAnswerEdits(ans.id);
      setAnswers(prev => prev.map((a, i) => i === idx ? { ...a, edits, loadingEdits: false } : a));
    } catch {
      setAnswers(prev => prev.map((a, i) => i === idx ? { ...a, loadingEdits: false, editOpen: false } : a));
    }
  }

  async function handleTranscribe() {
    if (!selectedFormId) { setError('Selecione um formulário.'); return; }
    if (!selectedClientId) { setError('Selecione um cliente.'); return; }
    if (!file) { setError('Selecione um arquivo de áudio.'); return; }

    // Limite de 500 MB para upload (a transcrição via Gemini suporta até 2 GB)
    if (file.size > 500 * 1024 * 1024) {
      setError('O arquivo é muito grande. O limite de upload é de 500 MB.');
      return;
    }

    setTranscribing(true);
    setError(null);
    setSuccess(null);
    setTranscriptionText(null);
    setAnswers([]);

    try {
      const transcription = await svc.createTranscription({
        companyId,
        userId,
        formId: selectedFormId,
        audioFilename: file.name,
        clientId: selectedClientId || null,
        attendanceId: selectedAttendanceId || null,
      });

      const audioUrl = await svc.uploadAudio(companyId, transcription.id, file);

      const result: TranscricaoResult = await svc.transcribeAudio({
        audioUrl,
        transcriptionId: transcription.id,
        formId: selectedFormId,
        companyId,
        mimeType: file.type || null,
      });

      setTranscriptionText(result.transcription_text);

      const rawAnswers = await svc.getTranscriptionAnswers(transcription.id);
      setAnswers(
        rawAnswers.map(a => ({
          ...a,
          edits: [],
          editValue: a.current_answer ?? '',
          editOpen: false,
          loadingEdits: false,
        }))
      );
      setSuccess('Transcrição concluída com sucesso.');
    } catch (e: any) {
      setError(e.message ?? 'Erro durante transcrição.');
    } finally {
      setTranscribing(false);
    }
  }

  async function saveEdits() {
    const dirty = answers.filter(a => a.editValue !== (a.current_answer ?? ''));
    if (dirty.length === 0) { setSuccess('Nenhuma alteração para salvar.'); return; }

    setSavingEdits(true);
    setError(null);
    setSuccess(null);
    try {
      for (const a of dirty) {
        await svc.saveAnswerEdit({
          answerId: a.id,
          previousValue: a.current_answer ?? '',
          newValue: a.editValue,
          userId,
        });
      }
      setAnswers(prev =>
        prev.map(a => ({ ...a, current_answer: a.editValue, edits: [] }))
      );
      setSuccess(`${dirty.length} resposta(s) salva(s) com sucesso.`);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao salvar edições.');
    } finally {
      setSavingEdits(false);
    }
  }

  const ACCEPTED = '.mp3,.m4a,.ogg,.wav,.webm,audio/*';



  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <span className="material-symbols-outlined text-xl">error</span>
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span className="text-sm">{success}</span>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
        <h2 className="text-lg font-semibold text-white">Nova transcrição</h2>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-300">Formulário *</label>
          <select
            value={selectedFormId}
            onChange={e => setSelectedFormId(e.target.value)}
            className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
          >
            <option value="">Selecione um formulário…</option>
            {forms.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              Cliente *
            </label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
            >
              <option value="">Selecione um cliente…</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">
              Atendimento <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <select
              value={selectedAttendanceId}
              onChange={e => handleAttendanceChange(e.target.value)}
              disabled={!selectedClientId || attendancesLoading}
              className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
            >
              <option value="">
                {!selectedClientId
                  ? 'Selecione um cliente primeiro'
                  : attendancesLoading
                  ? 'Carregando atendimentos…'
                  : 'Nenhum atendimento selecionado'}
              </option>
              {attendances.map(a => (
                <option key={a.id} value={a.id}>
                  {formatAttendanceOption(a)}
                </option>
              ))}
            </select>
            {selectedClientId && !attendancesLoading && attendances.length === 0 && (
              <p className="text-xs text-slate-500 mt-1.5">
                Nenhum atendimento encontrado para este cliente.
              </p>
            )}
            {linkedAppointmentDate && (
              <div className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <span className="material-symbols-outlined text-sm text-violet-400">calendar_month</span>
                <span className="text-xs text-violet-300">
                  Agendamento: {new Date(linkedAppointmentDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-300">Arquivo de áudio *</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              dragOver
                ? 'border-blue-500 bg-blue-500/10'
                : file
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-700/30'
            }`}
          >
            <span className="material-symbols-outlined text-3xl text-slate-400">
              {file ? 'audio_file' : 'upload_file'}
            </span>
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-green-400">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-400">Arraste o áudio aqui ou <span className="text-blue-400">clique para selecionar</span></p>
                <p className="text-xs text-slate-500 mt-1">MP3, M4A, OGG, WAV, WEBM · até 500 MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {file && (
            <button
              onClick={e => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors mt-1"
            >
              Remover arquivo
            </button>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleTranscribe}
            disabled={transcribing || !selectedFormId || !selectedClientId || !file}
            className="flex items-center gap-2 h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            {transcribing
              ? <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Transcrevendo…</>
              : <><span className="material-symbols-outlined text-lg">mic</span> Enviar e Transcrever</>
            }
          </button>
        </div>
      </div>

      {transcriptionText !== null && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-400">transcribe</span>
            Texto transcrito
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/60 rounded-xl p-4 border border-slate-700">
            {transcriptionText}
          </p>
        </div>
      )}

      {answers.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">quiz</span>
            Respostas do formulário
          </h2>

          <div className="space-y-4">
            {answers.map((ans, idx) => (
              <div key={ans.id} className="bg-slate-900/60 rounded-xl border border-slate-700 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {idx + 1}. {ans.question_text}
                </p>

                <textarea
                  value={ans.editValue}
                  onChange={e => {
                    const val = e.target.value;
                    setAnswers(prev => prev.map((a, i) => i === idx ? { ...a, editValue: val } : a));
                  }}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"
                />

                {ans.editValue !== (ans.current_answer ?? '') && (
                  <p className="text-xs text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Alterado — clique em "Salvar alterações" para confirmar
                  </p>
                )}

                <button
                  onClick={() => toggleEdits(idx)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">history</span>
                  {ans.editOpen ? 'Ocultar histórico' : 'Ver histórico de edições'}
                  {ans.loadingEdits && (
                    <span className="material-symbols-outlined animate-spin text-sm ml-1">progress_activity</span>
                  )}
                </button>

                {ans.editOpen && !ans.loadingEdits && (
                  <div className="mt-1 space-y-2">
                    {ans.edits.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">Nenhuma edição registrada.</p>
                    ) : (
                      ans.edits.map(ed => (
                        <div key={ed.id} className="text-xs text-slate-500 bg-slate-800 rounded-lg p-3 border border-slate-700">
                          <p className="text-slate-600 mb-1">
                            {new Date(ed.edited_at).toLocaleString('pt-BR')}
                          </p>
                          <p><span className="text-red-400/70">−</span> {ed.previous_value ?? '(vazio)'}</p>
                          <p><span className="text-green-400/70">+</span> {ed.new_value ?? '(vazio)'}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-700">
            <button
              onClick={saveEdits}
              disabled={savingEdits}
              className="flex items-center gap-2 h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-blue-600/20 transition-all"
            >
              {savingEdits
                ? <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Salvando…</>
                : <><span className="material-symbols-outlined text-lg">save</span> Salvar alterações</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Histórico ───────────────────────────────────────────────────────────────

interface DetailAnswerDraft {
  id: string;
  question_text: string;
  current_answer: string | null;
  editValue: string;
}

function HistoricoTab({
  companyId,
  userId,
  focusTranscriptionId,
  onFocusHandled,
}: {
  companyId: string;
  userId: string;
  focusTranscriptionId?: string | null;
  onFocusHandled?: () => void;
}) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});

  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterClientId, setFilterClientId] = useState('');

  const [transcriptions, setTranscriptions] = useState<TranscriptionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail view
  const [selected, setSelected] = useState<TranscriptionListItem | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [detailAnswers, setDetailAnswers] = useState<DetailAnswerDraft[]>([]);
  const [allEdits, setAllEdits] = useState<AllAnswerEdit[]>([]);
  const [transcriptionEdits, setTranscriptionEdits] = useState<AiTranscriptionEdit[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailSuccess, setDetailSuccess] = useState<string | null>(null);
  /** Rótulo do atendimento vinculado (data + tipo, igual ao dropdown de vínculos) */
  const [detailAttendanceLabel, setDetailAttendanceLabel] = useState<string | null>(null);

  // Link editing
  const [linkEditMode, setLinkEditMode] = useState(false);
  const [editClientId, setEditClientId] = useState('');
  const [editAttendanceId, setEditAttendanceId] = useState('');
  const [editAttendances, setEditAttendances] = useState<AttendanceOption[]>([]);
  const [editAttendancesLoading, setEditAttendancesLoading] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);

  const loadList = useCallback(async (dateFrom: string, dateTo: string, clientId: string) => {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      setTranscriptions(await svc.listTranscriptions(companyId, {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        clientId: clientId || undefined,
      }));
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar transcrições');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    svc.listClientsForSelect(companyId).then(setClients).catch(() => {});
    getCompanyUsers(companyId).then(users => {
      const map: Record<string, string> = {};
      users.forEach(u => {
        if (u.user_id) map[u.user_id] = u.full_name || u.user_name || u.user_email || u.user_id;
      });
      setUserNameMap(map);
    }).catch(() => {});
    loadList('', '', '');
  }, [companyId, loadList]);

  const loadDetailForTranscription = useCallback(async (t: TranscriptionListItem) => {
    setSelected(t);
    setAudioUrl(null);
    setDetailAnswers([]);
    setAllEdits([]);
    setTranscriptionEdits([]);
    setDetailAttendanceLabel(null);
    setDetailError(null);
    setDetailSuccess(null);
    setLinkEditMode(false);
    setLoadingDetail(true);
    try {
      const attendanceLabelPromise: Promise<string | null> = t.attendance_id
        ? attendancesService
            .getAttendanceById(t.attendance_id, companyId)
            .then((d) =>
              formatAttendanceDateAndType({
                attended_at: d.attendance.attended_at as string | null,
                created_at: d.attendance.created_at as string | null,
                type_name: d.attendance.type_name as string | null,
              })
            )
            .catch(() => null)
        : Promise.resolve(null);

      const [answers, signedUrl, answerEdits, tEdits, attLabel] = await Promise.all([
        svc.getTranscriptionAnswers(t.id),
        svc.getAudioSignedUrl(t.company_id, t.id),
        svc.getAllEditsForTranscription(t.id),
        svc.getTranscriptionEdits(t.id),
        attendanceLabelPromise,
      ]);
      setDetailAnswers(answers.map(a => ({
        id: a.id,
        question_text: a.question_text,
        current_answer: a.current_answer,
        editValue: a.current_answer ?? '',
      })));
      setAudioUrl(signedUrl);
      setAllEdits(answerEdits);
      setTranscriptionEdits(tEdits);
      setDetailAttendanceLabel(attLabel);
    } catch (e: unknown) {
      setDetailError(e instanceof Error ? e.message : 'Erro ao carregar detalhes');
    } finally {
      setLoadingDetail(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (!focusTranscriptionId) return;
    let cancelled = false;
    (async () => {
      try {
        const t = await svc.getTranscriptionById(focusTranscriptionId, companyId);
        if (!cancelled && t) {
          await loadDetailForTranscription(t);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) onFocusHandled?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [focusTranscriptionId, companyId, loadDetailForTranscription, onFocusHandled]);

  async function openDetail(t: TranscriptionListItem) {
    await loadDetailForTranscription(t);
  }

  async function saveDetailEdits() {
    const dirty = detailAnswers.filter(a => a.editValue !== (a.current_answer ?? ''));
    if (dirty.length === 0) { setDetailSuccess('Nenhuma alteração para salvar.'); return; }
    setSavingEdits(true);
    setDetailError(null);
    setDetailSuccess(null);
    try {
      for (const a of dirty) {
        await svc.saveAnswerEdit({
          answerId: a.id,
          previousValue: a.current_answer ?? '',
          newValue: a.editValue,
          userId,
        });
      }
      const updatedEdits = await svc.getAllEditsForTranscription(selected!.id);
      setAllEdits(updatedEdits);
      setDetailAnswers(prev => prev.map(a => ({ ...a, current_answer: a.editValue })));
      setDetailSuccess(`${dirty.length} resposta(s) salva(s) com sucesso.`);
    } catch (e: any) {
      setDetailError(e.message ?? 'Erro ao salvar edições.');
    } finally {
      setSavingEdits(false);
    }
  }

  function openLinkEdit() {
    setEditClientId(selected?.client_id ?? '');
    setEditAttendanceId(selected?.attendance_id ?? '');
    setEditAttendances([]);
    if (selected?.client_id) {
      setEditAttendancesLoading(true);
      svc.listAttendancesForSelect(companyId, selected.client_id)
        .then(setEditAttendances)
        .catch(() => {})
        .finally(() => setEditAttendancesLoading(false));
    }
    setLinkEditMode(true);
  }

  async function handleEditClientChange(clientId: string) {
    setEditClientId(clientId);
    setEditAttendanceId('');
    setEditAttendances([]);
    if (!clientId) return;
    setEditAttendancesLoading(true);
    svc.listAttendancesForSelect(companyId, clientId)
      .then(setEditAttendances)
      .catch(() => {})
      .finally(() => setEditAttendancesLoading(false));
  }

  async function saveLinks() {
    if (!selected) return;
    const newClientId = editClientId || null;
    const newAttendanceId = editAttendanceId || null;
    if (newClientId === selected.client_id && newAttendanceId === selected.attendance_id) {
      setLinkEditMode(false);
      return;
    }
    const newClientLabel = newClientId ? (clients.find(c => c.id === newClientId)?.name ?? null) : null;
    const newAttLabel = newAttendanceId
      ? (editAttendances.find(a => a.id === newAttendanceId)
          ? `${editAttendances.find(a => a.id === newAttendanceId)!.type_name} — ${editAttendances.find(a => a.id === newAttendanceId)!.client_display}`
          : null)
      : null;
    const prevClientLabel = selected.client_id ? (clients.find(c => c.id === selected.client_id)?.name ?? null) : null;

    const confirmed = window.confirm(
      `Confirmar alteração de vínculos?\n\nCliente: ${prevClientLabel ?? '(nenhum)'} → ${newClientLabel ?? '(nenhum)'}`
    );
    if (!confirmed) return;

    setSavingLinks(true);
    setDetailError(null);
    setDetailSuccess(null);
    try {
      await svc.updateTranscriptionLinks({
        transcriptionId: selected.id,
        userId,
        clientId: newClientId,
        clientLabel: newClientLabel,
        attendanceId: newAttendanceId,
        attendanceLabel: newAttLabel,
        prevClientId: selected.client_id,
        prevClientLabel,
        prevAttendanceId: selected.attendance_id,
        prevAttendanceLabel: null,
      });
      setSelected(prev => prev ? { ...prev, client_id: newClientId, attendance_id: newAttendanceId } : null);
      let nextAttLabel: string | null = null;
      if (newAttendanceId) {
        try {
          const d = await attendancesService.getAttendanceById(newAttendanceId, companyId);
          nextAttLabel = formatAttendanceDateAndType({
            attended_at: d.attendance.attended_at as string | null,
            created_at: d.attendance.created_at as string | null,
            type_name: d.attendance.type_name as string | null,
          });
        } catch {
          nextAttLabel = null;
        }
      }
      setDetailAttendanceLabel(nextAttLabel);
      const tEdits = await svc.getTranscriptionEdits(selected.id);
      setTranscriptionEdits(tEdits);
      setLinkEditMode(false);
      setDetailSuccess('Vínculos atualizados com sucesso.');
    } catch (e: any) {
      setDetailError(e.message ?? 'Erro ao salvar vínculos.');
    } finally {
      setSavingLinks(false);
    }
  }

  function clientName(clientId: string | null) {
    if (!clientId) return '—';
    return clients.find(c => c.id === clientId)?.name ?? '—';
  }

  function resolveUserName(uid: string | null) {
    if (!uid) return 'Sistema';
    return userNameMap[uid] ?? `Usuário …${uid.slice(-4)}`;
  }

  function fieldLabel(fieldName: string) {
    return fieldName === 'client_id' ? 'Cliente' : 'Atendimento';
  }

  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
      pending:    { label: 'Pendente',    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
      processing: { label: 'Processando', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
      done:       { label: 'Concluído',   cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
      error:      { label: 'Erro',        cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    };
    const s = map[status] ?? { label: status, cls: 'bg-slate-700 text-slate-400 border-slate-600' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
        {s.label}
      </span>
    );
  }

  // ── List view ──
  if (!selected) {
    return (
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <span className="material-symbols-outlined text-xl">error</span>
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">De</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">Até</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-400">Cliente</label>
              <select
                value={filterClientId}
                onChange={e => setFilterClientId(e.target.value)}
                className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
              >
                <option value="">Todos os clientes</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => loadList(filterDateFrom, filterDateTo, filterClientId)}
                disabled={loading}
                className="flex items-center gap-2 h-10 w-full justify-center rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
              >
                {loading
                  ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  : <span className="material-symbols-outlined text-base">search</span>
                }
                Buscar
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Carregando…
          </div>
        ) : transcriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <span className="material-symbols-outlined text-4xl">history</span>
            <p className="text-sm">Nenhuma transcrição encontrada.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-700">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Formulário</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {transcriptions.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-slate-700/50 ${i % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'} hover:bg-slate-700/30 transition-colors`}
                  >
                    <td className="px-4 py-3 align-top">
                      <EntityShortId kind="transcription" id={t.id} className="text-slate-400" />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(t.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      <span className="block">{clientName(t.client_id)}</span>
                      {t.client_id ? (
                        <span className="mt-0.5 inline-block">
                          <EntityShortId kind="client" id={t.client_id} className="text-slate-500" />
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{t.form_name ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(t)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Detail view ──
  return (
    <div className="space-y-6">
      <button
        onClick={() => setSelected(null)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Voltar ao histórico
      </button>

      {detailError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          <span className="material-symbols-outlined text-xl">error</span>
          <span className="text-sm">{detailError}</span>
        </div>
      )}
      {detailSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span className="text-sm">{detailSuccess}</span>
        </div>
      )}

      {loadingDetail ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          Carregando transcrição…
        </div>
      ) : (
        <>
          {/* Meta */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Transcrição</p>
                <p className="text-white">
                  <EntityShortId kind="transcription" id={selected.id} className="text-slate-300" />
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Data</p>
                <p className="text-white">
                  {new Date(selected.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Cliente</p>
                <p className="text-white">{clientName(selected.client_id)}</p>
                {selected.client_id ? (
                  <p className="mt-1">
                    <EntityShortId kind="client" id={selected.client_id} className="text-slate-500" />
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Formulário</p>
                <p className="text-white">{selected.form_name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Atendimento</p>
                <p className="text-white">
                  {selected.attendance_id ? (detailAttendanceLabel ?? '—') : '—'}
                </p>
                {selected.attendance_id ? (
                  <p className="mt-1">
                    <EntityShortId kind="attendance" id={selected.attendance_id} className="text-slate-500" />
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {!linkEditMode ? (
              <button
                onClick={openLinkEdit}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-blue-400 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar vínculos (cliente / atendimento)
              </button>
            ) : (
              <div className="border-t border-slate-700 pt-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Editar vínculos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-400">Cliente</label>
                    <select
                      value={editClientId}
                      onChange={e => handleEditClientChange(e.target.value)}
                      className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                    >
                      <option value="">Nenhum cliente</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-400">Atendimento</label>
                    <select
                      value={editAttendanceId}
                      onChange={e => setEditAttendanceId(e.target.value)}
                      disabled={!editClientId || editAttendancesLoading}
                      className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="">Nenhum atendimento</option>
                      {editAttendances.map(a => (
                        <option key={a.id} value={a.id}>{formatAttendanceOption(a)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveLinks}
                    disabled={savingLinks}
                    className="flex items-center gap-2 h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all"
                  >
                    {savingLinks
                      ? <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Salvando…</>
                      : <><span className="material-symbols-outlined text-sm">save</span> Confirmar</>
                    }
                  </button>
                  <button
                    onClick={() => setLinkEditMode(false)}
                    disabled={savingLinks}
                    className="h-9 px-4 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 text-xs font-medium transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Answers: após metadados, antes de áudio/texto (Histórico) */}
          {detailAnswers.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-base">quiz</span>
                Respostas do formulário
              </h3>
              <div className="space-y-4">
                {detailAnswers.map((ans, idx) => (
                  <div key={ans.id} className="bg-slate-900/60 rounded-xl border border-slate-700 p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {idx + 1}. {ans.question_text}
                    </p>
                    <textarea
                      value={ans.editValue}
                      onChange={e => {
                        const val = e.target.value;
                        setDetailAnswers(prev => prev.map((a, i) => i === idx ? { ...a, editValue: val } : a));
                      }}
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"
                    />
                    {ans.editValue !== (ans.current_answer ?? '') && (
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Alterado — clique em "Salvar alterações" para confirmar
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-700">
                <button
                  onClick={saveDetailEdits}
                  disabled={savingEdits}
                  className="flex items-center gap-2 h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
                >
                  {savingEdits
                    ? <><span className="material-symbols-outlined animate-spin text-base">progress_activity</span> Salvando…</>
                    : <><span className="material-symbols-outlined text-base">save</span> Salvar alterações</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Audio */}
          {audioUrl && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-400 text-base">headphones</span>
                Áudio original
              </h3>
              <audio controls className="w-full" src={audioUrl}>
                Seu navegador não suporta reprodução de áudio.
              </audio>
            </div>
          )}

          {/* Transcription text */}
          {selected.transcription_text && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-violet-400 text-base">transcribe</span>
                Texto transcrito
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/60 rounded-xl p-4 border border-slate-700">
                {selected.transcription_text}
              </p>
            </div>
          )}

          {/* Unified edit history */}
          {(() => {
            type UnifiedEdit =
              | { kind: 'answer'; id: string; edited_at: string; edited_by: string | null; label: string; prev: string | null; next: string | null }
              | { kind: 'link';   id: string; edited_at: string; edited_by: string | null; label: string; prev: string | null; next: string | null };

            const unified: UnifiedEdit[] = [
              ...allEdits.map(e => ({
                kind: 'answer' as const,
                id: e.id,
                edited_at: e.edited_at,
                edited_by: e.edited_by,
                label: e.question_text,
                prev: e.previous_value,
                next: e.new_value,
              })),
              ...transcriptionEdits.map(e => ({
                kind: 'link' as const,
                id: e.id,
                edited_at: e.edited_at,
                edited_by: e.edited_by,
                label: fieldLabel(e.field_name),
                prev: e.previous_value_label,
                next: e.new_value_label,
              })),
            ].sort((a, b) => new Date(b.edited_at).getTime() - new Date(a.edited_at).getTime());

            return (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-base">history</span>
                  Histórico de edições
                </h3>
                {unified.length === 0 ? (
                  <p className="text-sm text-slate-600 italic">Nenhuma edição registrada para esta transcrição.</p>
                ) : (
                  <div className="space-y-3">
                    {unified.map(ed => (
                      <div key={ed.id} className="bg-slate-900/60 rounded-xl border border-slate-700 p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined text-sm">person</span>
                          <span className="font-medium text-slate-400">{resolveUserName(ed.edited_by)}</span>
                          <span>·</span>
                          <span>{new Date(ed.edited_at).toLocaleString('pt-BR')}</span>
                          {ed.kind === 'link' && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20 text-[10px]">vínculo</span>
                          )}
                        </div>
                        <p className="text-slate-400 font-semibold">{ed.label}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5">
                            <p className="text-red-400/70 mb-1">Anterior</p>
                            <p className="text-slate-300 whitespace-pre-wrap">{ed.prev ?? '(nenhum)'}</p>
                          </div>
                          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2.5">
                            <p className="text-green-400/70 mb-1">Novo</p>
                            <p className="text-slate-300 whitespace-pre-wrap">{ed.next ?? '(nenhum)'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AssistanteIAPage: React.FC<{
  focusTranscriptionId?: string | null;
  onTranscriptionFocusHandled?: () => void;
}> = ({ focusTranscriptionId, onTranscriptionFocusHandled }) => {
  const { currentCompany } = useCompany();
  const [activeTab, setActiveTab] = useState<Tab>('transcricao');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (focusTranscriptionId) setActiveTab('historico');
  }, [focusTranscriptionId]);

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <span className="material-symbols-outlined mr-2">business</span>
        Selecione uma empresa para continuar.
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'transcricao', label: 'Transcrição', icon: 'mic' },
    { id: 'historico',   label: 'Histórico',   icon: 'history' },
    { id: 'formularios', label: 'Formulários', icon: 'description' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-3xl text-violet-400">smart_toy</span>
        <div>
          <h1 className="text-2xl font-bold text-white">Assistente IA</h1>
          <p className="text-sm text-slate-400">Transcrição de áudio e preenchimento automático de formulários</p>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-800 border border-slate-700 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'transcricao' && userId && (
        <TranscricaoTab companyId={currentCompany.id} userId={userId} />
      )}
      {activeTab === 'historico' && userId && (
        <HistoricoTab
          companyId={currentCompany.id}
          userId={userId}
          focusTranscriptionId={focusTranscriptionId}
          onFocusHandled={onTranscriptionFocusHandled}
        />
      )}
      {(activeTab === 'transcricao' || activeTab === 'historico') && !userId && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
          Carregando sessão…
        </div>
      )}
      {activeTab === 'formularios' && (
        <FormsTab companyId={currentCompany.id} />
      )}
    </div>
  );
};

export default AssistanteIAPage;

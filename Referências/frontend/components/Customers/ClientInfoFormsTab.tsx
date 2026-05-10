import React, { useEffect, useMemo, useState } from 'react';
import * as clientInfoAIService from '../../services/clientInfoAIService';
import type {
  ClientInfoAnswer,
  ClientInfoForm,
  ClientInfoTargetField,
} from '../../services/clientInfoAIService';

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

const ANSWER_TYPE_LABELS: Record<string, string> = {
  text: 'Texto', number: 'Número', boolean: 'Sim/Não', email: 'E-mail',
  uf: 'UF', instagram: 'Instagram', client_type: 'Tipo de cliente',
  sports_json: 'Esportes JSON', select: 'Seleção', multi_select: 'Múltipla seleção',
};

function formatAnswerValue(answer: ClientInfoAnswer): string {
  if (answer.normalized_value !== null && answer.normalized_value !== undefined) {
    if (typeof answer.normalized_value === 'string') return answer.normalized_value;
    return JSON.stringify(answer.normalized_value);
  }
  return answer.raw_answer ?? '—';
}

export function ClientInfoAnswersCard({ clientId }: { clientId: string }) {
  const [answers, setAnswers] = useState<ClientInfoAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const answersByForm = useMemo(() => {
    return answers.reduce<Record<string, { formName: string; answers: ClientInfoAnswer[] }>>((acc, answer) => {
      acc[answer.form_id] = acc[answer.form_id] ?? { formName: answer.form_name, answers: [] };
      acc[answer.form_id].answers.push(answer);
      return acc;
    }, {});
  }, [answers]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    clientInfoAIService.getClientInfoAnswers(clientId)
      .then((loaded) => { if (isMounted) setAnswers(loaded); })
      .catch((err: any) => { if (isMounted) setError(err?.message || 'Erro ao carregar respostas extraídas'); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [clientId]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <span className="material-symbols-outlined text-violet-400">fact_check</span>
        <div>
          <h3 className="text-xl font-bold text-white">Respostas extraídas deste cliente</h3>
          <p className="text-xs text-slate-500">Preenchidas automaticamente pelo agente de cadastro.</p>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="size-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : answers.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <span className="material-symbols-outlined text-4xl block mb-2">fact_check</span>
          Nenhuma resposta extraída ainda.
        </div>
      ) : (
        <div className="divide-y divide-slate-700">
          {Object.entries(answersByForm).map(([formId, group]) => (
            <div key={formId} className="p-6 space-y-3">
              <h4 className="text-sm font-bold text-white">{group.formName}</h4>
              <div className="space-y-2">
                {group.answers.map((answer) => (
                  <div key={answer.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-white">{answer.question_text}</p>
                        <p className="text-xs text-slate-500">
                          {TARGET_FIELDS.find((f) => f.value === answer.target_field)?.label ?? answer.target_field}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                        {answer.updated_by === 'ai' ? 'IA' : 'Usuário'} · {new Date(answer.updated_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{formatAnswerValue(answer)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClientInfoFormsTab({ companyId }: { companyId: string }) {
  const [forms, setForms] = useState<ClientInfoForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    clientInfoAIService.listClientInfoForms(companyId)
      .then((loaded) => { if (isMounted) setForms(loaded); })
      .catch((err: any) => { if (isMounted) setError(err?.message || 'Erro ao carregar formulários'); })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [companyId]);

  const activeForm = forms.find((f) => f.is_active) ?? null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl flex items-start gap-3">
        <span className="material-symbols-outlined text-violet-400 text-lg mt-0.5 flex-shrink-0">info</span>
        <p className="text-sm text-violet-300">
          Formulários são gerenciados em{' '}
          <span className="font-bold">Administração Global → Formulários de Coleta</span>.
          Esta aba é somente leitura.
        </p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-400">dynamic_form</span>
          <div>
            <h3 className="text-xl font-bold text-white">Formulário de coleta ativo</h3>
            <p className="text-xs text-slate-500">Perguntas carregadas pelo agente de cadastro desta empresa.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="size-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !activeForm ? (
          <div className="py-12 text-center text-slate-500">
            <span className="material-symbols-outlined text-4xl block mb-2">dynamic_form</span>
            Nenhum formulário ativo para esta empresa.
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h4 className="text-lg font-bold text-white">{activeForm.name}</h4>
                {activeForm.description && (
                  <p className="text-sm text-slate-400">{activeForm.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {activeForm.locked_at ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Travado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Draft
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {activeForm.questions.length} pergunta{activeForm.questions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {activeForm.questions.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Sem perguntas cadastradas.</p>
            ) : (
              <div className="space-y-2">
                {activeForm.questions.map((question, idx) => (
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
                            {ANSWER_TYPE_LABELS[question.answer_type] ?? question.answer_type}
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
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import * as appointmentsService from '../../services/appointmentsService';
import type { Appointment } from '../../services/appointmentsService';

interface Props {
  companyId: string;
  template: string;
  timezone: string;
  advanceHoursList: number[];
  onClose: () => void;
}

interface PreviewSubject {
  client_name: string;
  client_phone: string;
  service_name: string;
  service_duration: number;
  professional_name: string;
  scheduled_at: string;
  is_mock: boolean;
}

const MOCK_SUBJECT: PreviewSubject = {
  client_name: 'Maria Silva',
  client_phone: '5545999990001',
  service_name: 'Corte de Cabelo',
  service_duration: 60,
  professional_name: 'João Costa',
  scheduled_at: new Date(Date.now() + 26 * 3600_000).toISOString(),
  is_mock: true,
};

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatInTz(iso: string, timezone: string): { date: string; time: string } {
  try {
    const dt = new Date(iso);
    const dateFmt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFmt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return { date: dateFmt.format(dt), time: timeFmt.format(dt) };
  } catch {
    const dt = new Date(iso);
    return {
      date: `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`,
      time: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
    };
  }
}

function renderTemplate(
  template: string,
  subject: PreviewSubject,
  companyName: string,
  advanceHours: number,
  timezone: string,
): string {
  const { date, time } = formatInTz(subject.scheduled_at, timezone);
  const map: Record<string, string> = {
    '{cliente}': subject.client_name || 'Cliente',
    '{servico}': subject.service_name || 'Serviço',
    '{data}': date,
    '{hora}': time,
    '{profissional}': subject.professional_name || '—',
    '{empresa}': companyName || '',
    '{duracao}': String(subject.service_duration ?? 0),
    '{horas_antes}': String(advanceHours),
  };
  let out = template;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  return out;
}

export const TemplatePreviewModal: React.FC<Props> = ({
  companyId,
  template,
  timezone,
  advanceHoursList,
  onClose,
}) => {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<PreviewSubject>(MOCK_SUBJECT);
  const [selectedAdvance, setSelectedAdvance] = useState<number>(
    advanceHoursList[0] ?? 24,
  );

  useEffect(() => {
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const futureIso = new Date(today.getTime() + 30 * 24 * 3600_000)
      .toISOString()
      .slice(0, 10);

    appointmentsService
      .getAppointments({
        companyId,
        dateFrom: todayIso,
        dateTo: futureIso,
      })
      .then((appts: Appointment[]) => {
        const candidate = appts
          .filter(a => a.client_id && a.client_name && new Date(a.scheduled_at) > today)
          .filter(a => !['cancelled', 'no_show', 'completed'].includes(a.status))
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

        if (candidate) {
          setSubject({
            client_name: candidate.client_name || 'Cliente',
            client_phone: '— (telefone não exposto na agenda)',
            service_name: candidate.service_name || 'Serviço',
            service_duration: candidate.service_duration ?? 60,
            professional_name: candidate.professional_name || '—',
            scheduled_at: candidate.scheduled_at,
            is_mock: false,
          });
        }
      })
      .catch(() => { /* silencia: cai no mock */ })
      .finally(() => setLoading(false));
  }, [companyId]);

  const renderedText = useMemo(
    () => renderTemplate(template, subject, currentCompany?.name || '', selectedAdvance, timezone),
    [template, subject, currentCompany, selectedAdvance, timezone],
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Pré-visualização do lembrete</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mensagem renderizada com {subject.is_mock ? 'dados de exemplo' : 'o próximo agendamento real'}.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="text-slate-400 text-sm">Buscando próximo agendamento...</div>
          ) : (
            <>
              {subject.is_mock && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs">
                  Não há agendamento futuro elegível (com cliente vinculado). Mostrando exemplo com dados fictícios.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Row label="Cliente" value={subject.client_name} />
                <Row label="Telefone" value={subject.client_phone} />
                <Row label="Serviço" value={subject.service_name} />
                <Row label="Profissional" value={subject.professional_name} />
                <Row
                  label="Agendamento"
                  value={(() => {
                    const f = formatInTz(subject.scheduled_at, timezone);
                    return `${f.date} às ${f.time}`;
                  })()}
                />
                <Row label="Duração" value={`${subject.service_duration} min`} />
              </div>

              {advanceHoursList.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Simular antecedência</label>
                  <div className="flex gap-2 flex-wrap">
                    {advanceHoursList.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setSelectedAdvance(h)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          selectedAdvance === h
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-blue-500'
                        }`}
                      >
                        {h}h antes
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Mensagem que será enviada</label>
                <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-2xl p-4">
                  <div className="text-emerald-50 text-sm whitespace-pre-wrap leading-relaxed">
                    {renderedText}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Caracteres: {renderedText.length} • Linhas: {renderedText.split('\n').length}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-700 flex justify-end">
          <button onClick={onClose} className="h-10 px-5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl text-sm">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2">
    <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wide">{label}</div>
    <div className="text-slate-200 mt-0.5 truncate" title={value}>{value}</div>
  </div>
);

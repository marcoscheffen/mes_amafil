import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { Appointment } from '../../services/appointmentsService';
import type { BusinessHour } from '../../services/agendaService';
import { formatEntityShortId, fullEntityIdTooltip } from '../../lib/shortId';

const PX_PER_HOUR    = 64;
const MIN_CARD_PX    = 20;
const DRAG_THRESH_PX = 6;   // pixels para ativar drag
const TIME_COL_W     = 'w-12 shrink-0';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.round(m % 60)).padStart(2, '0')}`;
}

function computeLabelRange(weekDays: Date[], businessHours: BusinessHour[]) {
  let start = 24 * 60, end = 0, anyOpen = false;
  for (const day of weekDays) {
    const bh = businessHours[day.getDay()];
    if (!bh?.is_open) continue;
    anyOpen = true;
    start = Math.min(start, parseTimeToMinutes(bh.start_time));
    end   = Math.max(end,   parseTimeToMinutes(bh.end_time));
  }
  if (!anyOpen) { start = 8 * 60; end = 18 * 60; }
  const labelStart = Math.floor(start / 60) * 60;
  let   labelEnd   = Math.ceil(end / 60) * 60;
  if (labelEnd <= labelStart) labelEnd = labelStart + 60;
  return { labelStartMin: labelStart, labelEndMin: labelEnd };
}

function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

function appointmentDurationMinutes(a: Appointment): number {
  if (a.ends_at) {
    const ms = new Date(a.ends_at).getTime() - new Date(a.scheduled_at).getTime();
    return Math.max(5, Math.round(ms / 60_000));
  }
  return Math.max(5, a.service_duration ?? 60);
}

function buildLocalIso(day: Date, totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0).toISOString();
}

function snapMinutes(m: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi - 15, Math.round(m / 15) * 15));
}

// ─── Colunas paralelas ─────────────────────────────────────────────────────────

type ColAssign = { col: number; maxCols: number };

function assignParallelColumns(aps: Appointment[]): Map<string, ColAssign> {
  const sorted = [...aps].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );
  const colEnds: number[] = [];
  const map = new Map<string, ColAssign>();
  for (const a of sorted) {
    const start = new Date(a.scheduled_at).getTime();
    const end   = start + appointmentDurationMinutes(a) * 60_000;
    let c = 0;
    while (c < colEnds.length && colEnds[c] > start) c++;
    if (c >= colEnds.length) colEnds.push(end); else colEnds[c] = end;
    map.set(a.id, { col: c, maxCols: 0 });
  }
  const maxCols = Math.max(1, colEnds.length);
  map.forEach((v, id) => map.set(id, { col: v.col, maxCols }));
  return map;
}

// ─── Ícones de sync ────────────────────────────────────────────────────────────

const SYNC_ICON: Record<string, { icon: string; cls: string; title: string }> = {
  synced:        { icon: 'cloud_done', cls: 'text-emerald-400', title: 'Sincronizado com Google Calendar' },
  pending:       { icon: 'sync',      cls: 'text-amber-400 animate-spin', title: 'Sincronizando...' },
  error:         { icon: 'cloud_off', cls: 'text-red-400',     title: 'Falha na sincronização' },
  not_connected: { icon: '',          cls: '',                 title: '' },
};

const CONFIRMATION_ICON: Record<string, { icon: string; cls: string; title: string }> = {
  not_requested: { icon: '',              cls: '',                 title: '' },
  requested:     { icon: 'schedule_send', cls: 'text-blue-400',    title: 'Aguardando confirmação do cliente' },
  confirmed:     { icon: 'check_circle',  cls: 'text-emerald-400', title: 'Confirmado pelo cliente' },
  declined:      { icon: 'cancel',        cls: 'text-red-400',     title: 'Cancelado pelo cliente' },
  no_response:   { icon: 'help',          cls: 'text-slate-400',   title: 'Sem resposta do cliente' },
};

// ─── Tipos de drag interno ─────────────────────────────────────────────────────

type DragState =
  | { mode: 'create'; startMin: number; endMin: number; movedPx: number }
  | { mode: 'move';   appt: Appointment; curStartMin: number; duration: number; offsetMin: number; movedPx: number };

// ─── Props públicas ────────────────────────────────────────────────────────────

export interface WeekTimeGridProps {
  weekDays:                Date[];
  appointments:            Appointment[];
  businessHours:           BusinessHour[];
  onSlotClick:             (day: Date, scheduledAtIso: string) => void;
  onAppointmentClick:      (appt: Appointment) => void;
  onAppointmentReschedule: (appt: Appointment, newScheduledAtIso: string) => void;
  isSameDay:               (a: Date, b: Date) => boolean;
}

// ─── WeekTimeGrid ──────────────────────────────────────────────────────────────

export const WeekTimeGrid: React.FC<WeekTimeGridProps> = ({
  weekDays, appointments, businessHours,
  onSlotClick, onAppointmentClick, onAppointmentReschedule, isSameDay,
}) => {
  const { labelStartMin, labelEndMin } = useMemo(
    () => computeLabelRange(weekDays, businessHours),
    [weekDays, businessHours]
  );

  const totalMinutes = labelEndMin - labelStartMin;
  const gridHeight   = totalMinutes * (PX_PER_HOUR / 60);
  const pxPerMinute  = PX_PER_HOUR / 60;

  const hourIndices = useMemo(() => {
    const list: number[] = [];
    for (let m = labelStartMin; m < labelEndMin; m += 60) list.push(m);
    return list;
  }, [labelStartMin, labelEndMin]);

  // Linha de "agora"
  const [nowMinutes, setNowMinutes] = useState(() => minutesSinceMidnight(new Date()));
  useEffect(() => {
    const tick = setInterval(() => setNowMinutes(minutesSinceMidnight(new Date())), 60_000);
    return () => clearInterval(tick);
  }, []);
  const today = new Date();

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-700/80 bg-slate-900 shadow-xl">
      <div className="min-w-[760px]">

        {/* Cabeçalho */}
        <div className="flex sticky top-0 z-30 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-sm">
          <div className={`${TIME_COL_W} sticky left-0 z-40 border-r border-slate-700/60 bg-slate-900/95`} aria-hidden />
          {weekDays.map(day => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className={`flex min-w-0 flex-1 flex-col items-center border-l py-2 ${
                  isToday ? 'border-blue-500/30 bg-blue-950/30' : 'border-slate-800'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wide ${isToday ? 'text-blue-400' : 'text-slate-500'}`}>
                  {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                </span>
                <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                  isToday ? 'bg-blue-500 text-white' : 'text-slate-300'
                }`}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex">
          {/* Eixo de horas */}
          <div
            className={`${TIME_COL_W} relative sticky left-0 z-20 border-r border-slate-700/60 bg-slate-900`}
            style={{ height: gridHeight }}
          >
            {hourIndices.map(min => (
              <div
                key={min}
                className="absolute left-0 right-0 flex justify-end pr-2 pt-0.5"
                style={{ top: (min - labelStartMin) * pxPerMinute }}
              >
                <span className="text-[10px] font-medium text-slate-500 tabular-nums">
                  {formatMin(min)}
                </span>
              </div>
            ))}
          </div>

          {/* Colunas */}
          <div className="relative flex min-w-0 flex-1">
            {weekDays.map(day => {
              const isToday  = isSameDay(day, today);
              const dayAppts = appointments.filter(
                a => isSameDay(new Date(a.scheduled_at), day) && a.status !== 'cancelled'
              );
              const nowPx = isToday
                ? (nowMinutes - labelStartMin) * pxPerMinute
                : null;

              return (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  bh={businessHours[day.getDay()]}
                  isToday={isToday}
                  dayAppts={dayAppts}
                  colAssign={assignParallelColumns(dayAppts)}
                  labelStartMin={labelStartMin}
                  labelEndMin={labelEndMin}
                  gridHeight={gridHeight}
                  pxPerMinute={pxPerMinute}
                  hourIndices={hourIndices}
                  nowPx={nowPx}
                  onSlotClick={onSlotClick}
                  onAppointmentClick={onAppointmentClick}
                  onAppointmentReschedule={onAppointmentReschedule}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DayColumn ────────────────────────────────────────────────────────────────

interface DayColumnProps {
  day:                     Date;
  bh:                      BusinessHour | undefined;
  isToday:                 boolean;
  dayAppts:                Appointment[];
  colAssign:               Map<string, ColAssign>;
  labelStartMin:           number;
  labelEndMin:             number;
  gridHeight:              number;
  pxPerMinute:             number;
  hourIndices:             number[];
  nowPx:                   number | null;
  onSlotClick:             (day: Date, iso: string) => void;
  onAppointmentClick:      (appt: Appointment) => void;
  onAppointmentReschedule: (appt: Appointment, newIso: string) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  day, bh, isToday, dayAppts, colAssign,
  labelStartMin, labelEndMin, gridHeight, pxPerMinute, hourIndices,
  nowPx, onSlotClick, onAppointmentClick, onAppointmentReschedule,
}) => {
  const openStart  = bh?.is_open ? parseTimeToMinutes(bh.start_time) : null;
  const openEnd    = bh?.is_open ? parseTimeToMinutes(bh.end_time)   : null;
  const breakStart = bh?.break_start ? parseTimeToMinutes(bh.break_start) : null;
  const breakEnd   = bh?.break_end   ? parseTimeToMinutes(bh.break_end)   : null;

  const containerRef  = useRef<HTMLDivElement>(null);
  const pointerStartY = useRef(0);
  const [drag, setDrag] = useState<DragState | null>(null);

  const minutesFromY = (clientY: number): number => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return labelStartMin;
    const y = Math.max(0, Math.min(gridHeight, clientY - rect.top));
    return labelStartMin + y / pxPerMinute;
  };

  // ─── Pointer down: detecta se é criação ou arraste de card ────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    const minsAtPointer = minutesFromY(e.clientY);
    pointerStartY.current = e.clientY;

    // Detecta se o ponteiro está sobre um card existente
    const cardEl = (e.target as HTMLElement).closest('[data-appt-id]');

    if (cardEl) {
      const apptId = cardEl.getAttribute('data-appt-id');
      const appt   = dayAppts.find(a => a.id === apptId);
      if (appt && !appt.is_external) {
        e.currentTarget.setPointerCapture(e.pointerId);
        const origStartMin = minutesSinceMidnight(new Date(appt.scheduled_at));
        const offsetMin    = minsAtPointer - origStartMin; // posição do mouse dentro do card
        const duration     = appointmentDurationMinutes(appt);
        setDrag({ mode: 'move', appt, curStartMin: origStartMin, duration, offsetMin, movedPx: 0 });
        return;
      }
      // card externo ou não encontrado → deixa o click funcionar normalmente
      return;
    }

    // Background → drag de criação
    e.currentTarget.setPointerCapture(e.pointerId);
    const startMin = snapMinutes(minsAtPointer, labelStartMin, labelEndMin);
    setDrag({ mode: 'create', startMin, endMin: startMin + 30, movedPx: 0 });
  };

  // ─── Pointer move ──────────────────────────────────────────────────────────
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const movedPx     = Math.abs(e.clientY - pointerStartY.current);
    const minsAtMouse = minutesFromY(e.clientY);

    if (drag.mode === 'create') {
      const endMin = snapMinutes(
        Math.max(drag.startMin + 15, minsAtMouse),
        labelStartMin, labelEndMin
      );
      setDrag({ ...drag, endMin, movedPx });
    } else {
      const newStart = snapMinutes(
        minsAtMouse - drag.offsetMin,
        labelStartMin,
        labelEndMin - drag.duration
      );
      setDrag({ ...drag, curStartMin: newStart, movedPx });
    }
  };

  // ─── Pointer up: decide click vs drag ─────────────────────────────────────
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const wasDrag = drag.movedPx >= DRAG_THRESH_PX;

    if (drag.mode === 'create') {
      setDrag(null);
      onSlotClick(day, buildLocalIso(day, drag.startMin));
    } else {
      const { appt, curStartMin } = drag;
      setDrag(null);
      if (wasDrag) {
        onAppointmentReschedule(appt, buildLocalIso(day, curStartMin));
      } else {
        onAppointmentClick(appt);
      }
    }
  };

  const handlePointerCancel = () => setDrag(null);

  // ─── Zona helper ───────────────────────────────────────────────────────────
  const zone = (fromMin: number, toMin: number) => ({
    top:    Math.max(0, (fromMin - labelStartMin) * pxPerMinute),
    height: Math.max(0, (toMin - fromMin) * pxPerMinute),
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  const movingApptId = drag?.mode === 'move' ? drag.appt.id : null;

  return (
    <div className={`relative min-w-[96px] flex-1 select-none border-l ${
      isToday ? 'border-blue-500/20' : 'border-slate-800'
    }`}>
      <div
        ref={containerRef}
        className="relative cursor-crosshair"
        style={{ height: gridHeight }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >

        {/* Fora do expediente */}
        <div className="pointer-events-none absolute inset-0 bg-slate-800/40" aria-hidden />

        {/* Janela de atendimento */}
        {openStart != null && openEnd != null && openEnd > openStart && (
          <div
            className={`pointer-events-none absolute inset-x-0 ${
              isToday ? 'bg-blue-950/20' : 'bg-slate-900/90'
            }`}
            style={zone(Math.max(openStart, labelStartMin), Math.min(openEnd, labelEndMin))}
            aria-hidden
          />
        )}

        {/* Intervalo */}
        {breakStart != null && breakEnd != null && openStart != null && openEnd != null && breakEnd > breakStart && (
          <div
            className="pointer-events-none absolute inset-x-0 bg-slate-700/20 [background-image:repeating-linear-gradient(135deg,transparent,transparent_4px,rgb(71_85_105/0.3)_4px,rgb(71_85_105/0.3)_8px)]"
            style={zone(
              Math.max(breakStart, openStart, labelStartMin),
              Math.min(breakEnd,   openEnd,   labelEndMin),
            )}
            aria-hidden
          />
        )}

        {/* Linhas de hora e meia-hora */}
        {hourIndices.map(min => (
          <React.Fragment key={min}>
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-slate-700/60"
              style={{ top: (min - labelStartMin) * pxPerMinute }}
            />
            {(min - labelStartMin + 30) * pxPerMinute < gridHeight && (
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-700/30"
                style={{ top: (min - labelStartMin + 30) * pxPerMinute }}
              />
            )}
          </React.Fragment>
        ))}

        {/* Ghost: criação */}
        {drag?.mode === 'create' && drag.movedPx >= DRAG_THRESH_PX && (
          <div
            className="pointer-events-none absolute inset-x-1 z-20 flex flex-col justify-start overflow-hidden rounded-lg border border-blue-400/60 bg-blue-500/20 p-1.5 backdrop-blur-sm"
            style={{
              top:    (drag.startMin - labelStartMin) * pxPerMinute,
              height: Math.max(MIN_CARD_PX, (drag.endMin - drag.startMin) * pxPerMinute),
            }}
            aria-hidden
          >
            <span className="text-[10px] font-bold text-blue-300">
              {formatMin(drag.startMin)} – {formatMin(drag.endMin)}
            </span>
          </div>
        )}

        {/* Ghost: arraste de card */}
        {drag?.mode === 'move' && drag.movedPx >= DRAG_THRESH_PX && (() => {
          const color = drag.appt.service_color ?? '#3B82F6';
          return (
            <div
              className="pointer-events-none absolute inset-x-1 z-20 flex flex-col justify-start overflow-hidden rounded-lg p-1.5 shadow-xl ring-2 ring-white/20"
              style={{
                top:             (drag.curStartMin - labelStartMin) * pxPerMinute,
                height:          Math.max(MIN_CARD_PX, drag.duration * pxPerMinute),
                backgroundColor: `${color}40`,
                borderLeft:      `3px solid ${color}`,
              }}
              aria-hidden
            >
              <span className="text-[10px] font-bold" style={{ color }}>
                {formatMin(drag.curStartMin)} – {formatMin(drag.curStartMin + drag.duration)}
              </span>
              <span className="truncate text-[10px] text-slate-200">{drag.appt.service_name}</span>
            </div>
          );
        })()}

        {/* Agendamentos */}
        {dayAppts.map(appt => {
          const start     = new Date(appt.scheduled_at);
          const startMin  = drag?.mode === 'move' && drag.appt.id === appt.id && drag.movedPx >= DRAG_THRESH_PX
            ? drag.curStartMin  // fantasma no lugar original = não mover o card, mostrar no lugar original como fantasma
            : minutesSinceMidnight(start);
          const useOrig   = minutesSinceMidnight(start); // posição visual original
          const dur       = appointmentDurationMinutes(appt);
          const top       = (useOrig - labelStartMin) * pxPerMinute;
          const height    = Math.max(MIN_CARD_PX, dur * pxPerMinute);
          const isMoving  = movingApptId === appt.id && drag?.mode === 'move' && (drag.movedPx ?? 0) >= DRAG_THRESH_PX;
          const sync      = SYNC_ICON[appt.sync_status];
          
          const maxCols   = colAssign.get(appt.id)?.maxCols ?? 1;
          const col       = colAssign.get(appt.id)?.col ?? 0;
          const widthPct  = 100 / maxCols;
          const leftPct   = col * widthPct;
          
          // Use the confirmation_status directly on appt object if populated from backend, default to not_requested
          const confStatus = appt.confirmation_status || 'not_requested';
          const confConfig = CONFIRMATION_ICON[confStatus];
          
          let titlePrefix = confConfig?.title ? `${confConfig.title}` : '';
          if (confStatus === 'confirmed' && appt.confirmation_responded_at) {
             titlePrefix = `Confirmado em ${new Date(appt.confirmation_responded_at).toLocaleString('pt-BR')}`;
          } else if (confStatus === 'declined' && appt.confirmation_responded_at) {
             titlePrefix = `Cancelado em ${new Date(appt.confirmation_responded_at).toLocaleString('pt-BR')}`;
          }

          const endLabel  = appt.ends_at
            ? new Date(appt.ends_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : null;

          if (appt.is_external) {
            return (
              <div
                key={appt.id}
                data-appt-id={appt.id}
                title={fullEntityIdTooltip(appt.id) ? `${formatEntityShortId('appointment', appt.id)} — ${appt.id}` : undefined}
                className="absolute z-10 box-border cursor-pointer overflow-hidden rounded-lg border border-dashed border-slate-500/70 bg-slate-800/90 p-1.5 shadow-sm transition-all hover:brightness-110 hover:z-[11]"
                style={{
                  top, height,
                  left:    `calc(${leftPct}% + 2px)`,
                  width:   `calc(${widthPct}% - 4px)`,
                  opacity: isMoving ? 0.35 : 1,
                }}
              >
                <p className="text-[10px] font-bold text-slate-400 leading-tight">
                  {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="truncate text-[10px] text-slate-500">{appt.notes || 'Google Calendar'}</p>
              </div>
            );
          }

          const color = appt.service_color ?? undefined;

          return (
            <div
              key={appt.id}
              data-appt-id={appt.id}
              title={fullEntityIdTooltip(appt.id) ? `${formatEntityShortId('appointment', appt.id)} — ${appt.id}` : undefined}
              className={`absolute z-10 box-border overflow-hidden rounded-lg p-1.5 shadow-md transition-opacity hover:z-[11] hover:brightness-110 hover:shadow-lg ${
                isMoving ? 'cursor-grabbing' : 'cursor-pointer'
              }`}
              style={{
                top, height,
                left:            `calc(${leftPct}% + 2px)`,
                width:           `calc(${widthPct}% - 4px)`,
                backgroundColor: color ? `${color}28` : 'rgb(30 41 59 / 0.9)',
                borderLeft:      `3px solid ${color ?? '#3B82F6'}`,
                borderTop:       `1px solid ${color ? color + '44' : 'transparent'}`,
                borderRight:     `1px solid ${color ? color + '22' : 'transparent'}`,
                borderBottom:    `1px solid ${color ? color + '22' : 'transparent'}`,
                opacity:         isMoving ? 0.35 : 1,
              }}
            >
              <div className="flex items-start justify-between gap-0.5">
                <p className="text-[10px] font-bold leading-tight" style={{ color: color ?? '#93c5fd' }}>
                  {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  {endLabel && height >= 36 && (
                    <span className="font-normal text-slate-400"> – {endLabel}</span>
                  )}
                </p>
                <div className="flex items-center gap-1">
                  {confConfig?.icon && (
                    <span className={`material-symbols-outlined shrink-0 text-[11px] ${confConfig.cls}`} title={titlePrefix}>
                      {confConfig.icon}
                    </span>
                  )}
                  {sync?.icon && (
                    <span className={`material-symbols-outlined shrink-0 text-[11px] ${sync.cls}`} title={sync.title}>
                      {sync.icon}
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-200 leading-tight">
                {appt.service_name}
              </p>
              {appt.client_name && height >= 44 && (
                <p className="truncate text-[10px] text-slate-400 leading-tight">{appt.client_name}</p>
              )}
            </div>
          );
        })}

        {/* Linha de agora */}
        {nowPx != null && nowPx >= 0 && nowPx <= gridHeight && (
          <div
            className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
            style={{ top: nowPx - 1 }}
            aria-hidden
          >
            <div className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
            <div className="h-px flex-1 bg-red-400/80" />
          </div>
        )}

      </div>
    </div>
  );
};

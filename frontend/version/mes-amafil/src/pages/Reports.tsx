import React, { useState } from 'react';
import { FileBarChart, Download, Plus, Settings2, Calendar, LayoutList, ArrowUpDown, FileText, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Field {
  id: string;
  label: string;
  category: string;
}

const AVAILABLE_FIELDS: Field[] = [
  { id: 'data', label: 'Data/Hora', category: 'Geral' },
  { id: 'op', label: 'Ordem de Produção', category: 'Produção' },
  { id: 'maquina', label: 'Equipamento', category: 'Produção' },
  { id: 'produto', label: 'Produto', category: 'Produção' },
  { id: 'operador', label: 'Operador', category: 'Geral' },
  { id: 'yield', label: 'Rendimento (Kg/h)', category: 'Métricas' },
  { id: 'oee', label: 'OEE %', category: 'Métricas' },
  { id: 'refugo', label: 'Refugo (Kg)', category: 'Métricas' },
  { id: 'tempo_parada', label: 'Tempo Parado', category: 'Paradas' },
  { id: 'motivo_parada', label: 'Motivo da Parada', category: 'Paradas' },
];

export function Reports() {
  const [selectedFields, setSelectedFields] = useState<string[]>(['data', 'op', 'yield', 'oee']);
  const [sortBy, setSortBy] = useState('data');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reportName, setReportName] = useState('');

  const toggleField = (id: string) => {
    setSelectedFields(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-bento-border pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900">Advanced<span className="text-amafil-blue">.Reporting</span></h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">BI & Analytics - Custom Insights Engine</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-amafil-green text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-amafil-green/90 transition-all shadow-md flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar XLSX/PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Report Builder Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="card-mes shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-5 h-5 text-amafil-blue" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Configurador</h3>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nome do Relatório</label>
              <input 
                type="text" 
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Ex: Performance Turno A - Semanal"
                className="w-full bg-gray-50 border border-bento-border rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-amafil-blue/10"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Selecionar Campos Visíveis</label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {AVAILABLE_FIELDS.map((field) => (
                  <button
                    key={field.id}
                    onClick={() => toggleField(field.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left",
                      selectedFields.includes(field.id) 
                        ? "bg-blue-50 border-amafil-blue/30 text-amafil-blue" 
                        : "bg-white border-bento-border text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-black">{field.label}</span>
                      <span className="text-[9px] font-bold uppercase opacity-60">{field.category}</span>
                    </div>
                    {selectedFields.includes(field.id) && <LayoutList className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-bento-border">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Ordenação Padrão</label>
              <div className="flex gap-2">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 bg-gray-50 border border-bento-border rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none"
                >
                  {AVAILABLE_FIELDS.filter(f => selectedFields.includes(f.id)).map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
              Gerar Relatório Dinâmico
            </button>
          </div>

          {/* Recent/Saved Reports */}
          <div className="card-mes bg-gray-50 shadow-inner border-dashed border-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Relatórios Salvos</h3>
            <div className="space-y-3">
              {[
                { name: 'OEE Global Unidade 01', date: 'Visto há 2h' },
                { name: 'Histórico de Paradas Mecânicas', date: 'Ontem' },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-bento-border rounded-xl group hover:border-amafil-blue/50 cursor-pointer transition-all">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-400 group-hover:text-amafil-blue" />
                    <div>
                      <p className="text-[11px] font-bold text-gray-900">{r.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{r.date}</p>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-gray-300" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="card-mes p-0 overflow-hidden shadow-sm">
            <div className="px-4 sm:px-8 py-5 border-b border-bento-border flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white gap-4">
              <div className="min-w-0">
                <h3 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest leading-tight">
                  Visualização <br className="sm:hidden" /> Prévia
                </h3>
                <p className="text-xs sm:text-sm font-bold text-gray-900 italic mt-1 leading-tight max-w-[200px] sm:max-w-none">
                  Mostrando 15 de 1,240 registros baseados nos filtros
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 sm:py-1 bg-gray-50 border border-bento-border rounded-full">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-tighter">Maio 01 - Maio 08</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-bento-border">
                  <tr>
                    {selectedFields.map(fId => {
                      const field = AVAILABLE_FIELDS.find(af => af.id === fId);
                      return (
                        <th key={fId} className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {field?.label}
                            {sortBy === fId && <ArrowUpDown className="w-3 h-3 text-amafil-blue" />}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors font-bold text-xs text-gray-700">
                      {selectedFields.map(fId => (
                        <td key={fId} className="px-6 py-4 whitespace-nowrap">
                          {fId === 'data' && `08/05/2026 1${i > 9 ? i % 10 : i}:00`}
                          {fId === 'op' && `M013${70 + i}`}
                          {fId === 'maquina' && `NODE-${10 + i}`}
                          {fId === 'produto' && 'Fécula Mandioca 1Kg'}
                          {fId === 'operador' && 'C. Oliveira'}
                          {fId === 'yield' && `${1200 + (i * 10)}`}
                          {fId === 'oee' && `${85 + (i % 3)}%`}
                          {fId === 'refugo' && `${i * 2}kg`}
                          {fId === 'tempo_parada' && '0m'}
                          {fId === 'motivo_parada' && '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 border-t border-bento-border flex justify-center">
               <button className="text-[10px] font-black text-gray-400 hover:text-amafil-blue uppercase tracking-widest transition-all">
                 Carregar mais resultados...
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

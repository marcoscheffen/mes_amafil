import React, { useState, useRef } from 'react';
import { Play, ClipboardList, Package, Clock, ShieldAlert, ArrowLeft, CheckCircle2, ChevronRight, User, AlertTriangle, FileText, Save, Info, Camera, Upload, Scan, Loader2, X, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

// Mock data based on the provided document
const releasedOrders = [
  {
    id: 'M01376.01.001',
    produtoCode: '10.206.219',
    produtoDesc: 'FECULA HIDRATADA AMAFIL CX 21*500 PL',
    barCode: '7896035990101',
    emissao: '28/04/2026',
    fabricacao: '29/04/2026',
    qtde: 1500,
    und: 'CX',
    maquina: '30',
    lote: '086 LC',
    validade: '11/2026',
    pallet: '72 CX',
    prioridade: '500',
    status: 'LIBERADA'
  },
  {
    id: 'M01377.01.001',
    produtoCode: '10.206.220',
    produtoDesc: 'POLVILHO DOCE AMAFIL 1KG',
    barCode: '7896035990202',
    emissao: '30/04/2026',
    fabricacao: '01/05/2026',
    qtde: 1200,
    und: 'CX',
    maquina: '32',
    lote: 'HS250',
    validade: '01/12/2026',
    pallet: '60 CX',
    prioridade: '300',
    status: 'LIBERADA'
  }
];

const components = [
  { codigo: '7101021', descricao: 'BOB. MASSA PARA TAPIOCA AMAFIL 500 G', lote: 'Sem Rastreabilidade', qtde: '210,000' },
  { codigo: '7110032', descricao: 'CX MASSA TAPIOCA HIDRATA AMAFIL 21X500G (NOVA)', lote: 'Sem Rastreabilidade', qtde: '1.500,000' },
  { codigo: '7114024', descricao: 'RIBBON RESINA 55 X 600 NET', lote: 'Sem Rastreabilidade', qtde: '0,750' },
];

export function ProductionExecution() {
  const [selectedOP, setSelectedOP] = useState<typeof releasedOrders[0] | null>(null);
  const [view, setView] = useState<'LIST' | 'EXECUTION'>('LIST');
  const [activeShift, setActiveShift] = useState(1);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeSupportForm, setActiveSupportForm] = useState<null | 'MNT' | 'ALM' | 'PCP'>(null);
  
  // Records State
  const [records, setRecords] = useState<any[]>([]);
  const [currentRecord, setCurrentRecord] = useState({
    dateInit: '',
    dateEnd: '',
    timeInit: '',
    timeEnd: '',
    quantity: '',
    stopInit: '',
    stopEnd: '',
    lossPackaging: '',
    lossRepackaging: '',
    stopReason: '',
    auxiliaries: '',
    trackId: ''
  });
  
  // OCR Validation State
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isManualRelease, setIsManualRelease] = useState(false);
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{ lote: string, validade: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeSupportForm = () => setActiveSupportForm(null);

  const handleManualRelease = () => {
    if (!showManualConfirm) {
      setShowManualConfirm(true);
      return;
    }
    
    setIsVerified(true);
    setIsManualRelease(true);
    setShowManualConfirm(false);
    setOcrResult({ lote: "LIBERAÇÃO MANUAL", validade: "LIBERAÇÃO MANUAL" });
    console.log(`[NON-CONFORMITY LOG] OP: ${selectedOP?.id} | Liberado sem imagem por: Operador Padrão | Data: ${new Date().toLocaleString('pt-BR')}`);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCapturedImage(base64);
      runOCRValidation(base64);
    };
    reader.readAsDataURL(file);
  };

  const runOCRValidation = async (base64Image: string) => {
    if (!selectedOP) return;
    
    setIsVerifying(true);
    setVerificationError(null);
    setOcrResult(null);

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      setVerificationError(
        'Validação por IA indisponível: defina GEMINI_API_KEY no .env do frontend e reinicie o Vite. Use liberação manual se precisar seguir sem foto.'
      );
      setIsVerifying(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = base64Image.split(',')[1];
      const prompt = `Você é um inspetor de qualidade industrial. Analise esta imagem de um rótulo de produto.
      Extraia o 'Lote' e a 'Data de Validade'.
      Retorne APENAS um JSON no formato: { "lote": "valor", "validade": "valor" }.
      Se houver horários junto ao lote (ex: 13:30), ignore-os, pegue apenas a identificação do lote principal.
      Se o texto for 'VAL: 11/2026', a validade é '11/2026'.
      Exemplo de retorno esperado: { "lote": "086 LC", "validade": "11/2026" }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);
      setOcrResult(result);

      // Compare with OP
      const loteMatches = result.lote.toUpperCase().includes(selectedOP.lote.toUpperCase()) || selectedOP.lote.toUpperCase().includes(result.lote.toUpperCase());
      const validadeMatches = result.validade.includes(selectedOP.validade) || selectedOP.validade.includes(result.validade);

      if (loteMatches && validadeMatches) {
        setIsVerified(true);
      } else {
        setIsVerified(false);
        setVerificationError(`Divergência detectada! Esperado Lote: ${selectedOP.lote}, Validade: ${selectedOP.validade}. Detectado Lote: ${result.lote}, Validade: ${result.validade}.`);
      }
    } catch (err) {
      console.error("OCR Error:", err);
      setVerificationError("Erro ao processar imagem. Tente novamente com uma foto mais nítida.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveRecord = () => {
    if (!currentRecord.quantity || !currentRecord.dateInit) {
      alert("Por favor, preencha ao menos a Data Inicial e a Quantidade.");
      return;
    }

    const newRecord = {
      ...currentRecord,
      id: Date.now().toString(),
      shift: activeShift,
      lote: selectedOP?.lote,
      validade: selectedOP?.validade,
      timestamp: new Date().toLocaleString('pt-BR')
    };

    setRecords([newRecord, ...records]);
    
    // Reset partial form
    setCurrentRecord({
      ...currentRecord,
      quantity: '',
      timeInit: '',
      timeEnd: '',
      stopInit: '',
      stopEnd: '',
      lossPackaging: '',
      lossRepackaging: '',
      stopReason: '',
    });

    alert("Registro de produção salvo com sucesso! Você pode iniciar um novo registro ou finalizar a OP.");
  };

  const SupportFormModal = ({
    type,
    title,
    children,
  }: {
    type: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <span className="text-[10px] font-black text-amafil-blue uppercase tracking-widest">{type}</span>
            <h3 className="text-xl font-black text-gray-900 italic tracking-tighter">{title}</h3>
          </div>
          <button onClick={closeSupportForm} className="text-gray-400 hover:text-gray-600 font-black text-xl">
            ×
          </button>
        </div>
        <div className="p-8 space-y-4">
          {children}
          <div className="pt-4 flex gap-3">
            <button
              onClick={closeSupportForm}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                alert('Solicitação enviada com sucesso!');
                closeSupportForm();
                setShowQuickActions(false);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-amafil-blue text-white text-xs font-black uppercase tracking-widest shadow-md hover:bg-amafil-blue/90 transition-all"
            >
              Enviar Solicitação
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (view === 'LIST') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-bento-border pb-6 gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-gray-900 italic">OP<span className="text-amafil-green">.Execution</span></h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-1">Ordens de Produção Liberadas para Início</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {releasedOrders.map((op) => (
            <div key={op.id} className="card-mes group hover:border-amafil-green/30 flex flex-col p-0 overflow-hidden relative shadow-sm">
              <div className="h-2 w-full bg-amafil-green" />
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">REQ ID: {op.id}</span>
                    <h3 className="text-xl font-bold text-gray-900 italic leading-tight">{op.produtoDesc}</h3>
                  </div>
                  <div className="bg-green-50 text-amafil-green p-2 rounded-xl">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-2 rounded-lg border border-bento-border">
                    <p className="text-[8px] font-black text-gray-400 uppercase">Quantidade</p>
                    <p className="text-sm font-black text-gray-900">{op.qtde} {op.und}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-bento-border">
                    <p className="text-[8px] font-black text-gray-400 uppercase">Máquina</p>
                    <p className="text-sm font-black text-gray-900">{op.maquina}</p>
                  </div>
                </div>

                <button 
                  onClick={() => { 
                    setSelectedOP(op); 
                    setView('EXECUTION'); 
                    setIsVerified(false);
                    setCapturedImage(null);
                    setVerificationError(null);
                  }}
                  className="mt-auto h-12 w-full bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-amafil-green transition-all shadow-md active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Produção
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeSupportForm === 'MNT' && (
        <SupportFormModal type="Solicitação MNT" title="Chamar Manutenção">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Máquina / Equipamento</label>
              <input
                type="text"
                defaultValue={selectedOP?.maquina ? `Linha ${selectedOP.maquina}` : ''}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Descrição do Defeito</label>
              <textarea
                placeholder="Relate o problema observado..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold h-24 resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Prioridade</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold">
                <option>Média (Padrão)</option>
                <option>Alta (Parada de Máquina)</option>
                <option>Urgente (Risco de Segurança)</option>
              </select>
            </div>
          </div>
        </SupportFormModal>
      )}

      {activeSupportForm === 'ALM' && (
        <SupportFormModal type="Solicitação ALM" title="Pedido Almoxarifado">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Item Solicitado</label>
              <input
                type="text"
                placeholder="Fita, Filme, EPI..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Quantidade / Medida</label>
              <input
                type="text"
                placeholder="Ex: 2 unidades"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Motivo</label>
              <input
                type="text"
                placeholder="Reposição de estoque"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold"
              />
            </div>
          </div>
        </SupportFormModal>
      )}

      {activeSupportForm === 'PCP' && (
        <SupportFormModal type="Suporte PCP" title="Dúvida PCP / Apontamento">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Número da OP</label>
              <input
                type="text"
                defaultValue={selectedOP?.id || ''}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Descreva sua Dúvida</label>
              <textarea
                placeholder="Dúvida sobre quantidade, refugo, lote..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold h-24 resize-none"
              />
            </div>
          </div>
        </SupportFormModal>
      )}

      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 lg:p-6 rounded-3xl border border-bento-border shadow-sm gap-4">
        <div className="flex items-center gap-3 lg:gap-4">
          <button 
            onClick={() => setView('LIST')}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all border border-bento-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg lg:text-xl font-black text-gray-900 italic tracking-tighter">Executando OP: {selectedOP?.id}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] lg:text-[10px] font-bold text-amafil-green uppercase tracking-widest">{selectedOP?.produtoDesc}</p>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-300" />
              <p className="text-[9px] lg:text-[10px] font-black text-amafil-blue uppercase tracking-widest">{records.length} Registros Salvos</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <button 
             onClick={handleSaveRecord}
             disabled={!isVerified}
             className={cn(
               "flex-1 sm:flex-none px-6 py-3 lg:py-2.5 rounded-xl lg:rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-95",
               isVerified ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"
             )}
           >
             <Save className="w-4 h-4" />
             Finalizar Registro
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Data Entry */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* OCR COMPLIANCE STEP */}
          {!isVerified ? (
            <div className="card-mes border-2 border-amafil-blue/20 bg-amafil-blue/5 p-8 shadow-lg space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amafil-blue flex items-center justify-center text-white shrink-0 shadow-lg">
                  <Scan className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 italic">Validação de Conformidade</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Carregue uma imagem do rótulo (Lote/Validade) para liberar a produção
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Upload Zone */}
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all min-h-[240px] relative overflow-hidden",
                    capturedImage ? "border-amafil-green bg-white" : "border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  )}
                  onClick={() => !isVerifying && fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                  />
                  
                  {capturedImage ? (
                    <div className="absolute inset-0 w-full h-full">
                      <img src={capturedImage} alt="Captured" className="w-full h-full object-cover opacity-20" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        {isVerifying ? (
                          <>
                            <Loader2 className="w-10 h-10 text-amafil-blue animate-spin mb-4" />
                            <p className="text-sm font-black text-gray-900 uppercase">Analisando OCR...</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Extraindo Lote e Validade</p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-4 text-amafil-blue border border-bento-border">
                              <RefreshCw className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-black text-gray-900 uppercase">Substituir Imagem</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest italic">Aguardando validação correta</p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-gray-400 border border-bento-border group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-black text-gray-900 uppercase">Tirar Foto ou Carregar</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Lote e Validade visíveis</p>
                    </>
                  )}
                </div>

                {/* Status Zone */}
                <div className="flex flex-col justify-center space-y-4">
                  {verificationError ? (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-left-2">
                       <AlertTriangle className="w-5 h-5 text-amafil-red shrink-0" />
                       <div>
                         <p className="text-xs font-black text-amafil-red uppercase italic">Erro de Validação</p>
                         <p className="text-[11px] font-bold text-red-600 leading-tight mt-1">{verificationError}</p>
                       </div>
                    </div>
                  ) : capturedImage && !isVerifying ? (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 animate-pulse">
                       <Info className="w-5 h-5 text-amafil-blue shrink-0" />
                       <div>
                         <p className="text-xs font-black text-amafil-blue uppercase italic">Verificando dados</p>
                         <p className="text-[11px] font-bold text-amafil-blue/80 leading-tight mt-1">O sistema está processando os dados extraídos da imagem.</p>
                       </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-100/50 border border-gray-200 rounded-2xl flex gap-3 opacity-60">
                       <ShieldAlert className="w-5 h-5 text-gray-400 shrink-0" />
                       <div>
                         <p className="text-xs font-black text-gray-500 uppercase italic">Aguardando Imagem</p>
                         <p className="text-[11px] font-bold text-gray-400 leading-tight mt-1">A produção só será liberada após a leitura correta dos dados.</p>
                       </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-white rounded-xl border border-bento-border shadow-sm">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lote Esperado</span>
                      <span className="text-xs font-black text-gray-900">{selectedOP?.lote}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-xl border border-bento-border shadow-sm">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Validade Esperada</span>
                      <span className="text-xs font-black text-gray-900">{selectedOP?.validade}</span>
                    </div>
                    
                    <button 
                      onClick={handleManualRelease}
                      className={cn(
                        "w-full py-3 px-4 border-2 border-dashed transition-all rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]",
                        showManualConfirm 
                          ? "bg-amafil-red text-white border-amafil-red animate-pulse" 
                          : "bg-white border-gray-300 text-gray-700 hover:text-amafil-red hover:border-amafil-red/30 hover:bg-red-50/10"
                      )}
                    >
                      <AlertTriangle className={cn("w-4 h-4 shrink-0", showManualConfirm ? "text-white" : "text-amafil-red")} />
                      <span className="text-center">{showManualConfirm ? "CONFIRMAR NÃO CONFORMIDADE" : "Liberar sem Imagem (Não Conformidade)"}</span>
                    </button>
                    
                    {showManualConfirm && (
                      <button 
                        onClick={() => setShowManualConfirm(false)}
                        className="w-full text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all text-center mt-1"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn(
              "card-mes border-2 shadow-lg p-6 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-500",
              isManualRelease ? "border-status-danger bg-red-50/30" : "border-amafil-green bg-amafil-green/10"
            )}>
               <div className={cn(
                 "w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl",
                 isManualRelease ? "bg-status-danger" : "bg-amafil-green"
               )}>
                 {isManualRelease ? <AlertTriangle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
               </div>
               <div>
                 <h3 className="text-2xl font-black text-gray-900 italic uppercase">
                   {isManualRelease ? "Produção Liberada com Restrição" : "Produção Liberada!"}
                 </h3>
                 <p className={cn(
                   "text-sm font-bold mt-1",
                   isManualRelease ? "text-status-danger" : "text-amafil-green"
                 )}>
                   {isManualRelease 
                     ? "ALERTA: Registrado como NÃO CONFORMIDADE no LOG do sistema." 
                     : "Os dados do rótulo conferem com a Ordem de Produção."}
                 </p>
               </div>
               <div className="grid grid-cols-2 gap-3 w-full max-w-lg pt-2">
                 <div className="bg-white/80 py-3 px-1 rounded-2xl border border-bento-border shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Lote {isManualRelease ? "Sistêmico" : "Detectado"}</p>
                    <p className={cn("text-[11px] font-black uppercase break-all leading-tight", isManualRelease ? "text-status-danger" : "text-amafil-green")}>
                      {isManualRelease ? "BYPASS_MANUAL" : ocrResult?.lote}
                    </p>
                 </div>
                 <div className="bg-white/80 py-3 px-1 rounded-2xl border border-bento-border shadow-sm flex flex-col items-center justify-center text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Status Liberação</p>
                    <p className={cn("text-[11px] font-black uppercase break-all leading-tight", isManualRelease ? "text-status-danger" : "text-amafil-green")}>
                      {isManualRelease ? "NÃO CONFORME" : "DADOS_VERIFICADOS"}
                    </p>
                 </div>
               </div>
               <button 
                onClick={() => {
                  setCapturedImage(null);
                  setIsVerified(false);
                  setIsManualRelease(false);
                }}
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all flex items-center gap-1"
               >
                 <RefreshCw className="w-3 h-3" />
                 Refazer Verificação
               </button>
            </div>
          )}

          {/* Shift Selector */}
          <div className={cn(
            "flex gap-2 bg-gray-100 p-1 rounded-2xl border border-bento-border w-fit transition-opacity",
            !isVerified && "opacity-30 pointer-events-none"
          )}>
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => setActiveShift(s)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  activeShift === s ? "bg-white text-amafil-blue shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                Turno {s}
              </button>
            ))}
          </div>

          <div className={cn(
            "card-mes shadow-sm space-y-8 transition-all duration-500",
            !isVerified && "opacity-30 blur-sm pointer-events-none grayscale scale-95"
          )}>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 italic">
               <FileText className="w-5 h-5 text-amafil-blue" />
               Registro de Produção - Turno {activeShift}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Date & Time Grid */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Datas & Horários</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400">Data Inicial</label>
                    <input 
                      type="date" 
                      value={currentRecord.dateInit}
                      onChange={(e) => setCurrentRecord({...currentRecord, dateInit: e.target.value})}
                      className="w-full bg-gray-50 border border-bento-border rounded-lg px-3 py-2 text-xs font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400">Data Final</label>
                    <input 
                      type="date" 
                      value={currentRecord.dateEnd}
                      onChange={(e) => setCurrentRecord({...currentRecord, dateEnd: e.target.value})}
                      className="w-full bg-gray-50 border border-bento-border rounded-lg px-3 py-2 text-xs font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400">Hora Inicial</label>
                    <input 
                      type="time" 
                      value={currentRecord.timeInit}
                      onChange={(e) => setCurrentRecord({...currentRecord, timeInit: e.target.value})}
                      className="w-full bg-gray-50 border border-bento-border rounded-lg px-3 py-2 text-xs font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400">Hora Final</label>
                    <input 
                      type="time" 
                      value={currentRecord.timeEnd}
                      onChange={(e) => setCurrentRecord({...currentRecord, timeEnd: e.target.value})}
                      className="w-full bg-gray-50 border border-bento-border rounded-lg px-3 py-2 text-xs font-bold" 
                    />
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Produção Realizada</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400">Máquina</label>
                    <input type="text" value={selectedOP?.maquina} className="w-full bg-gray-200 border border-bento-border rounded-lg px-3 py-2 text-xs font-black text-gray-700" readOnly />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400">Quantidade (CX)</label>
                    <input 
                      type="number" 
                      placeholder="000" 
                      value={currentRecord.quantity}
                      onChange={(e) => setCurrentRecord({...currentRecord, quantity: e.target.value})}
                      className="w-full bg-white border border-amafil-blue/20 rounded-lg px-3 py-2 text-xs font-black text-amafil-blue focus:ring-2 focus:ring-amafil-blue/10" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400">Lote</label>
                    <input type="text" value={selectedOP?.lote} className="w-full bg-gray-200 border border-bento-border rounded-lg px-3 py-2 text-xs font-black text-gray-500" readOnly />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400">Validade</label>
                    <input type="text" value={selectedOP?.validade} className="w-full bg-gray-200 border border-bento-border rounded-lg px-3 py-2 text-xs font-black text-gray-500" readOnly />
                  </div>
                </div>
              </div>

              {/* Downtime & Losses */}
              <div className="space-y-4 col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-amafil-red uppercase tracking-widest border-b border-red-50 pb-1">Interrupções / Perdas</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400">Início Parada</label>
                        <input 
                          type="time" 
                          value={currentRecord.stopInit}
                          onChange={(e) => setCurrentRecord({...currentRecord, stopInit: e.target.value})}
                          className="w-full bg-gray-50 border border-bento-border rounded-lg px-3 py-2 text-xs font-bold" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400">Fim Parada</label>
                        <input 
                          type="time" 
                          value={currentRecord.stopEnd}
                          onChange={(e) => setCurrentRecord({...currentRecord, stopEnd: e.target.value})}
                          className="w-full bg-gray-50 border border-bento-border rounded-lg px-3 py-2 text-xs font-bold" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400">Perda Embalagem</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={currentRecord.lossPackaging}
                          onChange={(e) => setCurrentRecord({...currentRecord, lossPackaging: e.target.value})}
                          className="w-full bg-red-50/30 border border-red-100 rounded-lg px-3 py-2 text-xs font-bold text-red-600" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400">Perda Reembalagem</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={currentRecord.lossRepackaging}
                          onChange={(e) => setCurrentRecord({...currentRecord, lossRepackaging: e.target.value})}
                          className="w-full bg-red-50/30 border border-red-100 rounded-lg px-3 py-2 text-xs font-bold text-red-600" 
                        />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400">Motivo da Parada</label>
                      <textarea 
                        placeholder="Relate o ocorrido..." 
                        value={currentRecord.stopReason}
                        onChange={(e) => setCurrentRecord({...currentRecord, stopReason: e.target.value})}
                        className="w-full bg-gray-50 border border-bento-border rounded-lg px-3 py-2 text-xs font-bold h-20 resize-none" 
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Equipe & IDs</h4>
                   <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400">Operadores / Auxiliares</label>
                        <input 
                          type="text" 
                          placeholder="Nomes separados por vírgula" 
                          value={currentRecord.auxiliaries}
                          onChange={(e) => setCurrentRecord({...currentRecord, auxiliaries: e.target.value})}
                          className="w-full bg-gray-50 border border-bento-border rounded-lg px-3 py-2 text-xs font-bold" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400">ID de Rastreabilidade</label>
                        <input 
                          type="text" 
                          placeholder="Código ID interno" 
                          value={currentRecord.trackId}
                          onChange={(e) => setCurrentRecord({...currentRecord, trackId: e.target.value})}
                          className="w-full bg-gray-50 border border-bento-border rounded-lg px-3 py-2 text-xs font-bold" 
                        />
                      </div>
                   </div>
                   <div className="pt-4 space-y-4">
                      <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Validado Por:</h5>
                      <div className="flex gap-2">
                        <div className="h-10 w-full border border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50/30">
                           <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Lab/Qualidade</span>
                        </div>
                        <div className="h-10 w-full border border-dashed border-gray-200 rounded-xl flex items-center justify-center bg-gray-50/30">
                           <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Encarregado</span>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* History of Records */}
          {records.length > 0 && (
            <div className="card-mes shadow-sm mt-6 space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 italic pb-2 border-b border-gray-100">
                <Clock className="w-5 h-5 text-amafil-green" />
                Histórico de Apontamentos (Este Lote)
              </h3>
              <div className="space-y-3">
                {records.map((rec) => (
                  <div key={rec.id} className="p-4 bg-gray-50 rounded-2xl border border-bento-border flex justify-between items-center group hover:bg-white transition-all">
                    <div className="flex gap-4 items-center">
                      <div className="w-8 h-8 rounded-full bg-white border border-bento-border flex items-center justify-center text-[10px] font-black text-gray-400">
                        T{rec.shift}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-black text-gray-900">{rec.quantity} CX</span>
                           <span className="w-1 h-1 rounded-full bg-gray-300" />
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{rec.dateInit} {rec.timeInit}</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Operador: {rec.auxiliaries || 'Padrão'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-amafil-green uppercase italic">Salvo em: {rec.timestamp}</p>
                       {rec.lossPackaging && parseFloat(rec.lossPackaging) > 0 && <p className="text-[8px] font-bold text-amafil-red uppercase mt-0.5">Perdas: {rec.lossPackaging} EMB</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Reference & Controls */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Header Info Reference */}
          <div className="card-mes bg-gray-900 border-gray-800 text-white p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Package className="w-20 h-20" />
             </div>
             <div className="flex items-center gap-2 mb-4 relative z-10">
               <Info className="w-4 h-4 text-amafil-green" />
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ficha Técnica da OP</h3>
             </div>
             <div className="space-y-4 relative z-10">
               <div>
                 <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Código de Barra</p>
                 <p className="text-sm font-mono font-black tracking-widest text-amafil-green">{selectedOP?.barCode}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[9px] font-bold text-gray-500 uppercase">Prioridade</p>
                   <p className="text-xs font-black">{selectedOP?.prioridade}</p>
                 </div>
                 <div>
                   <p className="text-[9px] font-bold text-gray-500 uppercase">Padrão Pallet</p>
                   <p className="text-xs font-black">{selectedOP?.pallet}</p>
                 </div>
               </div>
               <div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase mb-2">Componentes / Insumos</p>
                  <div className="space-y-2">
                    {components.map((comp) => (
                      <div key={comp.codigo} className="bg-white/5 p-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] font-black text-amafil-green">{comp.codigo}</p>
                        <p className="text-[11px] font-bold leading-tight opacity-80">{comp.descricao}</p>
                        <div className="flex justify-between mt-1 pt-1 border-t border-white/5">
                          <span className="text-[8px] font-bold text-gray-500 uppercase">Qtd: {comp.qtde}</span>
                          <span className="text-[8px] font-bold text-gray-500 uppercase">Lote: {comp.lote}</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             </div>
          </div>

          {/* Action Pad */}
          <div className="card-mes p-6 space-y-4 shadow-sm">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status da Execução</h3>
             <div className="flex items-center gap-3 p-3 bg-green-50/50 border border-green-100 rounded-2xl">
               <div className={cn(
                 "w-10 h-10 rounded-full flex items-center justify-center text-white",
                 isVerified ? "bg-status-success animate-pulse" : "bg-gray-300"
               )}>
                 {isVerified ? <Activity className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
               </div>
               <div>
                 <p className={cn(
                   "text-xs font-black uppercase italic",
                   isVerified ? "text-status-success" : "text-gray-400"
                 )}>
                   {isVerified ? `Ativo na Linha ${selectedOP?.maquina}` : "Aguardando Liberação"}
                 </p>
                 <p className="text-[10px] font-bold text-gray-400 tracking-widest">
                   {isVerified ? `Início: Hoje, ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : "OCR Pendente"}
                 </p>
               </div>
             </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQuickActions((prev) => !prev)}
                className="h-12 bg-white border-2 border-bento-border text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Solicitar Ajuda
              </button>
               <button className={cn(
                 "h-12 bg-white border-2 border-bento-border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                 isVerified ? "text-amafil-red hover:bg-red-50" : "text-gray-300 pointer-events-none"
               )}>
                 Finalizar OP
               </button>
             </div>

            {showQuickActions && (
              <div className="pt-2 border-t border-bento-border space-y-3 animate-in fade-in duration-200">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações Rápidas</h4>
                <button
                  onClick={() => setActiveSupportForm('MNT')}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl flex items-center gap-3 px-4 transition-all text-xs font-bold border border-bento-border shadow-sm group"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-status-danger">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  Chamar Manutenção (MNT)
                </button>
                <button
                  onClick={() => setActiveSupportForm('ALM')}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl flex items-center gap-3 px-4 transition-all text-xs font-bold border border-bento-border shadow-sm group"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-amafil-blue">
                    <Package className="w-4 h-4" />
                  </div>
                  Pedido Almoxarifado (ALM)
                </button>
                <button
                  onClick={() => setActiveSupportForm('PCP')}
                  className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl flex items-center gap-3 px-4 transition-all text-xs font-bold border border-bento-border shadow-sm group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  Dúvida PCP / Apontamento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Activity({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>; }

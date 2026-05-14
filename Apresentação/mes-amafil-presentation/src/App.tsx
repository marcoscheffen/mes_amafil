import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  Settings, 
  Database, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  ArrowRightLeft, 
  BarChart3, 
  Zap,
  ClipboardList,
  MessageSquare,
  Wrench,
  Boxes,
  Eye,
  ScanLine,
  Focus,
  ScanBarcode,
  FileText,
  Scale,
  Droplets,
  Bell,
  Lock,
  ExternalLink
} from 'lucide-react';

const COLORS = {
  primary: '#00AA4D', // Amafil Green
  secondary: '#2B57A3', // Institutional Blue
  accent: '#2563EB',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  bg: '#F5F6FA',
  card: '#FFFFFF',
  text: '#111827',
  textMuted: '#6B7280',
  hikrobot: '#FF6A00'
};

const SC3000_IMAGE_URL = 'https://multipix.com/wp-content/uploads/2020/05/SC3000.png';

const HikrobotLogo = ({ className = 'h-8' }: { className?: string }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <svg viewBox="0 0 24 24" className="h-full w-auto" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#FF6A00" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="4" fill="#FF6A00" />
    </svg>
    <span className="font-black tracking-tight text-[#FF6A00] text-[15px] leading-none">
      HIKROBOT
    </span>
  </div>
);

// --- Slides Components ---

const CoverSlide = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-12">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-[#00AA4D] rounded-lg flex items-center justify-center text-white font-bold text-2xl">A</div>
        <h1 className="text-4xl font-bold tracking-tighter text-[#111827]">
          MES.<span className="text-[#00AA4D]">Amafil</span>
        </h1>
      </div>
    </motion.div>
    
    <motion.h2 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="text-5xl md:text-7xl font-bold text-[#111827] mb-6 leading-tight"
    >
      Manufacturing <br />
      <span className="text-[#2B57A3]">Execution System</span>
    </motion.h2>
    
    <motion.p 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="text-xl text-[#6B7280] max-w-2xl"
    >
      Transformando o chão de fábrica em um ecossistema digital de alta performance, 
      eliminando o papel e centralizando a inteligência produtiva em tempo real.
    </motion.p>
    
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
      className="mt-16 flex gap-4"
    >
      <div className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-500 shadow-sm">
        Versão 1.0
      </div>
      <div className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-500 shadow-sm">
        Integração TOTVS Protheus
      </div>
    </motion.div>
  </div>
);

const SOMA_URL = 'https://www.somasolution.com.br/';
const SOMA_LOGO_URL =
  'https://c5gwmsmjx1.execute-api.us-east-1.amazonaws.com/prod/dados_processo_seletivo/logo_empresa/47661/logo_somasolution_PNG.png_name_20220608-14663-74io6.png';

/** Cores alinhadas à identidade visual do site somasolution.com.br */
const SOMA_NAVY = '#003355';
const SOMA_ORANGE = '#FF7700';

const SomaSolutionSlide = () => {
  const brands = [
    'Markem-Imaje',
    'Datec',
    'Retreeva',
    'Balluff',
    'Soma Inspection Solution',
    'Hikrobot'
  ];

  const pillars = [
    'Codificação industrial',
    'Visão e leitura de códigos',
    'Automação industrial',
    'Inspeção e pesagem'
  ];

  const stats = [
    { value: '25+', label: 'anos de mercado' },
    { value: '7', label: 'unidades de negócio' },
    { value: '5', label: 'estados (Brasil)' }
  ];

  return (
    <div className="flex flex-col h-full pb-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
      {/* Hero — referência: destaque de marca no site */}
      <div
        className="shrink-0 px-8 pt-8 pb-6 text-center border-b border-slate-200/80"
        style={{
          background: `linear-gradient(180deg, rgba(0,51,85,0.06) 0%, rgba(255,255,255,0.92) 100%)`
        }}
      >
        <div
          className="mx-auto mb-5 h-1 w-20 rounded-full"
          style={{ background: `linear-gradient(90deg, ${SOMA_NAVY}, ${SOMA_ORANGE})` }}
        />
        <motion.img
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          src={SOMA_LOGO_URL}
          alt="Soma Solution"
          className="mx-auto h-[5.5rem] sm:h-32 md:h-36 lg:h-40 w-auto max-w-[min(100%,440px)] object-contain drop-shadow-sm"
          referrerPolicy="no-referrer"
        />
        <p
          className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: SOMA_NAVY }}
        >
          Distribuidor e integrador
        </p>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl mx-auto leading-snug">
          Soluções completas em equipamentos para{' '}
          <span className="font-semibold text-slate-800">codificação, visão, automação e inspeção</span> — alinhado ao portfólio{' '}
          <a
            href={SOMA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: SOMA_ORANGE }}
          >
            somasolution.com.br
          </a>
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {pillars.map((p, i) => (
            <span
              key={p}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/90 border border-slate-200 text-slate-600 shadow-sm"
            >
              {p}
            </span>
          ))}
        </div>
        <a
          href={SOMA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 hover:shadow-lg"
          style={{ backgroundColor: SOMA_ORANGE }}
        >
          <ExternalLink size={16} />
          Visite o site
        </a>
      </div>

      <div className="flex-grow min-h-0 px-8 pt-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 shrink-0">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-center shadow-sm"
              >
                <div className="text-lg font-black tabular-nums" style={{ color: SOMA_ORANGE }}>
                  {s.value}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500 leading-tight mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3.5"
            style={{ boxShadow: '0 1px 0 0 rgba(0,51,85,0.04)' }}
          >
            <p className="text-sm text-slate-600 leading-relaxed">
              A <strong style={{ color: SOMA_NAVY }}>Soma Solution</strong> possui experiência consolidada no mercado de equipamentos
              industriais, fornecendo soluções em codificação industrial, inspeção de produtos, embalagem e automação industrial.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              A empresa oferece equipamentos de alta tecnologia, reconhecidos em âmbito nacional e internacional, com agilidade e
              transparência nas relações com clientes.
            </p>
          </div>
        </div>

        <div className="lg:w-[360px] shrink-0 flex flex-col min-h-0">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col h-full min-h-0">
            <h4
              className="text-[13px] font-black uppercase tracking-wide mb-4 pb-3 border-b border-slate-100 text-center lg:text-left"
              style={{ color: SOMA_NAVY }}
            >
              As melhores marcas do mercado
            </h4>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start content-start overflow-y-auto">
              {brands.map((brand, i) => (
                <motion.span
                  key={brand}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="px-3 py-2 rounded-lg text-[11px] font-bold border bg-slate-50/80 text-slate-700 transition hover:border-slate-300"
                  style={{ borderColor: `${SOMA_NAVY}20` }}
                >
                  {brand}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProblemSlide = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full p-12">
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#2B57A3] mb-4">O Desafio</h3>
      <h2 className="text-4xl font-bold text-[#111827] mb-6">O Gargalo do Papel</h2>
      <p className="text-lg text-gray-600 mb-8">
        Hoje, o controle da produção depende de formulários físicos, gerando um ciclo lento, 
        sujeito a erros e com baixíssima visibilidade.
      </p>
      
      <ul className="space-y-4">
        {[
          { icon: <Zap className="text-amber-500" />, text: "Retrabalho massivo de digitação no ERP" },
          { icon: <AlertCircle className="text-red-500" />, text: "Risco de perda ou ilegibilidade de dados" },
          { icon: <BarChart3 className="text-blue-500" />, text: "Gestão 'no escuro' durante o turno" },
          { icon: <Settings className="text-gray-500" />, text: "Dificuldade de rastreabilidade rápida" }
        ].map((item, i) => (
          <motion.li 
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            {item.icon}
            <span className="font-medium text-gray-700">{item.text}</span>
          </motion.li>
        ))}
      </ul>
    </div>
    
    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <ClipboardList size={200} />
      </div>
      <div className="space-y-6 relative">
        <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        </div>
        <div className="flex justify-center">
          <ArrowRightLeft className="text-gray-400 rotate-90" />
        </div>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Settings className="text-blue-600" />
          </div>
          <div>
            <div className="h-4 w-32 bg-blue-200 rounded mb-1"></div>
            <div className="h-3 w-48 bg-blue-200/50 rounded"></div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 font-mono italic">
          Fluxo Analógico ➔ Digital (Processo Lento)
        </p>
      </div>
    </div>
  </div>
);

const SolutionSlide = () => (
  <div className="flex flex-col h-full p-12">
    <div className="mb-10">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#00AA4D] mb-2">A Solução</h3>
      <h2 className="text-4xl font-bold text-[#111827]">O Ecossistema MES.Amafil</h2>
    </div>
    
    <div className="flex-grow flex flex-col justify-center max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
        {[
          { 
            title: "Importação Inteligente", 
            desc: "O MES consome OPs do Protheus automaticamente, eliminando a impressão de mapas físicos.",
            icon: <Database className="text-blue-500" size={32} />,
            color: "blue"
          },
          { 
            title: "Execução Digital", 
            desc: "Operadores registram turnos, paradas e perdas em tablets, painéis PC e celulares intuitivos.",
            icon: <Activity className="text-[#00AA4D]" size={32} />,
            color: "green"
          },
          { 
            title: "Sincronização Real", 
            desc: "Apontamentos retornam ao ERP instantaneamente após o fechamento eletrônico da OP.",
            icon: <CheckCircle2 className="text-indigo-500" size={32} />,
            color: "indigo"
          }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow"
          >
            <div className={`w-20 h-20 bg-${item.color}-50 rounded-3xl flex items-center justify-center mb-8`}>
              {item.icon}
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h4>
            <p className="text-gray-600 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Flow Illustration Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center gap-12"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-gray-400" />
            <ArrowRightLeft size={14} className="text-gray-300" />
            <motion.div 
              animate={{ opacity: [1, 0.4, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-blue-500" 
            />
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Entrada (OP)</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-px bg-gray-200 w-16 relative">
            <ChevronRight size={16} className="text-gray-300 absolute -top-[7.5px] -right-2" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
              <Activity size={24} className="text-[#00AA4D]" />
            </motion.div>
            <div className="w-px h-6 bg-gray-200 self-center" />
            <div className="flex gap-2">
              <Zap size={18} className="text-amber-500" />
              <ClipboardList size={18} className="text-[#2B57A3]" />
            </div>
          </div>
          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest">Processamento (App MES)</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-px bg-gray-200 w-16 relative">
            <ChevronRight size={16} className="text-gray-300 absolute -top-[7.5px] -right-2" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-indigo-500" 
            />
            <ArrowRightLeft size={14} className="text-gray-300" />
            <CheckCircle2 size={22} className="text-indigo-500" />
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Saída (Apontamento)</p>
        </div>
      </motion.div>
    </div>
  </div>
);

const DashboardMockup = () => (
  <div className="flex flex-col h-full min-h-0 p-8 pt-6 pb-28 bg-[#F5F6FA] overflow-hidden">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Activity className="text-[#00AA4D] shrink-0" size={22} />
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">
          Runtime.<span className="text-[#00AA4D]">Dashboard</span>
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <div className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-bold rounded-full uppercase">
          OP: M01376-Active
        </div>
        <button
          type="button"
          className="px-3 py-1 bg-[#00AA4D] text-white text-[10px] sm:text-xs font-bold rounded-lg"
        >
          EXPORTAR DADOS
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 shrink-0">
      {[
        { label: "OEE GLOBAL", val: "84.2%", status: "NORMAL", trend: "+2.4%", trendLabel: "ÍNDICE DE PERFORMANCE" },
        { label: "DISPONIBILIDADE", val: "91.5%", status: "INSTÁVEL", trend: "-1.2%", trendLabel: "TAXA DE OPERAÇÃO", warning: true },
        { label: "PERFORMANCE", val: "94.8%", status: "NORMAL", trend: "+0.5%", trendLabel: "RENDIMENTO" },
        { label: "QUALIDADE", val: "98.2%", status: "NORMAL", trend: "+0.1%", trendLabel: "TAXA DE QUALIDADE" }
      ].map((card, i) => (
        <div key={i} className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm min-w-0">
          <div className="flex justify-between items-start gap-1 mb-2 sm:mb-3">
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase leading-tight">{card.label}</p>
              <p className="text-[9px] text-gray-400">Métricas</p>
            </div>
            <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${card.warning ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
              {card.status}
            </span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-3">{card.val}</div>
          <div className={`text-[9px] sm:text-[10px] font-bold flex flex-wrap items-center gap-x-1 ${card.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            <span>{card.trend.startsWith('+') ? '▲' : '▼'} {card.trend}</span>
            <span className="text-gray-400 uppercase">{card.trendLabel}</span>
          </div>
        </div>
      ))}
    </div>

    <div className="flex-1 min-h-0 min-w-0 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col min-h-0">
        <div className="flex justify-between items-start gap-2 mb-3 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Eficiência de Produção</h3>
          <div className="text-right shrink-0">
            <span className="text-xl sm:text-2xl font-bold text-[#00AA4D]">12.4ms</span>
            <p className="text-[9px] text-gray-400 uppercase">Latência Média</p>
          </div>
        </div>
        <div className="flex-1 min-h-[100px] flex items-end gap-0.5 sm:gap-1 px-1 sm:px-2 pb-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${40 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%` }}
              transition={{ delay: i * 0.02, duration: 1 }}
              className="flex-1 min-w-0 bg-[#00AA4D]/10 rounded-t-sm relative group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#00AA4D] opacity-40" />
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-1 sm:mt-2 px-1 sm:px-2 text-[9px] sm:text-[10px] text-gray-400 font-mono shrink-0">
          <span>06:00</span>
          <span>10:00</span>
          <span>14:00</span>
          <span>18:00</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 flex flex-col min-h-0 lg:min-h-0 overflow-y-auto">
        <h3 className="text-xs sm:text-sm font-bold text-gray-400 uppercase mb-3 shrink-0">Categorias de Erro</h3>
        <div className="space-y-3 sm:space-y-4">
          {[
            { label: "Mecânica", val: 80, color: "bg-red-500", time: "45m" },
            { label: "Elétrica", val: 40, color: "bg-amber-500", time: "30m" },
            { label: "Material", val: 20, color: "bg-blue-500", time: "15m" },
            { label: "Operação", val: 30, color: "bg-violet-500", time: "25m" },
            { label: "Planejada", val: 90, color: "bg-green-500", time: "60m" }
          ].map((bar, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-[10px] sm:text-[11px] font-bold gap-2">
                <span className="text-gray-600 truncate">{bar.label}</span>
                <span className="text-gray-900 shrink-0">{bar.time}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bar.val}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                  className={`h-full ${bar.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const IntegrationSlide = () => (
  <div className="flex flex-col items-center justify-center h-full p-12 overflow-hidden bg-white">
    <div className="text-center mb-16">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#2B57A3] mb-2">Integração</h3>
      <h2 className="text-4xl font-bold text-[#111827]">Sincronização Nativa com Protheus</h2>
    </div>
    
    <div className="flex items-center gap-12 relative">
      {/* TOTVS Protheus Side */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        className="w-64 p-8 bg-gray-50 border border-gray-200 rounded-3xl flex flex-col items-center text-center shadow-sm"
      >
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-gray-100">
          <Database className="text-blue-600" />
        </div>
        <h4 className="font-bold text-gray-900">ERP TOTVS PROTHEUS</h4>
        <p className="text-xs text-gray-500 mt-2">Módulo SIGAPCP (SC2)</p>
      </motion.div>
      
      {/* Connector Lines */}
      <div className="flex-grow flex flex-col gap-8 items-center w-64">
        <motion.div 
          animate={{ x: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="flex flex-col items-center"
        >
          <div className="text-[10px] font-bold text-blue-500 mb-1 uppercase tracking-tight">Importação De Ops</div>
          <div className="w-full h-1 bg-blue-100 rounded-full overflow-hidden relative">
            <motion.div 
              animate={{ left: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute top-0 h-full w-24 bg-blue-500"
            />
          </div>
        </motion.div>
        
        <motion.div 
          animate={{ x: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="flex flex-col items-center"
        >
          <div className="text-[10px] font-bold text-green-500 mb-1 uppercase tracking-tight">Apontamentos Reais</div>
          <div className="w-full h-1 bg-green-100 rounded-full overflow-hidden relative">
            <motion.div 
              animate={{ right: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute top-0 h-full w-24 bg-green-500"
            />
          </div>
        </motion.div>
      </div>

      {/* MES Amafil Side */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        className="w-64 p-8 bg-[#00AA4D]/5 border border-[#00AA4D]/20 rounded-3xl flex flex-col items-center text-center shadow-sm"
      >
        <div className="w-16 h-16 bg-[#00AA4D] rounded-2xl shadow-lg flex items-center justify-center mb-4">
          <Activity className="text-white" />
        </div>
        <h4 className="font-bold text-gray-900">SISTEMA MES AMAFIL</h4>
        <p className="text-xs text-gray-500 mt-2">Chão de Fábrica Digital</p>
      </motion.div>
    </div>
    
    <div className="grid grid-cols-2 gap-12 mt-16 text-center max-w-4xl">
      <div className="space-y-2">
        <h5 className="font-bold text-blue-600 uppercase text-xs">O MES Consome</h5>
        <p className="text-sm text-gray-600">No. OP, Produto, Lote Planejado, Validade, QTDE Planejada, BOM (Componentes)</p>
      </div>
      <div className="space-y-2">
        <h5 className="font-bold text-green-600 uppercase text-xs">O MES Devolve</h5>
        <p className="text-sm text-gray-600">Apontamento por Turno, Lote Real, QTDE Produzida, Perdas, Datas Reais de Início/Fim</p>
      </div>
    </div>
  </div>
);

const FeaturesSlide = () => (
  <div className="flex flex-col h-full p-12">
    <div className="mb-12">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#2B57A3] mb-2">Funcionalidades</h3>
      <h2 className="text-4xl font-bold text-[#111827]">Inteligência em Todos os Setores</h2>
    </div>
    
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { title: "Manutenção", icon: <Wrench />, desc: "Chamados técnicos via tablet ou celular." },
        { title: "Almoxarifado", icon: <Boxes />, desc: "Solicitação de insumos sem deslocamento." },
        { title: "PCP", icon: <BarChart3 />, desc: "Controle total e liberação de OPs." },
        { title: "Mensageria", icon: <MessageSquare />, desc: "Canais de comunicação interna por setor." },
        { title: "Offline-First", icon: <Zap />, desc: "Produção não para sem conexão Wi-Fi." },
        { title: "Multi-Empresa", icon: <Settings />, desc: "Uma plataforma para todas as unidades." },
        { title: "Rastreabilidade", icon: <CheckCircle2 />, desc: "Histórico completo por lote e operador." },
        { title: "OEE Automático", icon: <Activity />, desc: "Cálculo em tempo real por máquina." }
      ].map((feature, i) => (
        <motion.div 
          key={i}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-[#2B57A3] mb-4">
            {feature.icon}
          </div>
          <h4 className="font-bold text-gray-900 mb-2">{feature.title}</h4>
          <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
        </motion.div>
      ))}
    </div>
  </div>
);

const ArchitectureSlide = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full p-12">
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#2B57A3] mb-2">Arquitetura</h3>
      <h2 className="text-4xl font-bold text-[#111827] mb-6">Segurança On-Premises</h2>
      <p className="text-lg text-gray-600 mb-8 font-medium">
        Infraestrutura robusta desenhada para a realidade fabril, garantindo 
        disponibilidade máxima.
      </p>
      
      <div className="space-y-4">
        {[
          { label: "Servidor Local", desc: "Processamento dentro da fábrica (Supabase/PostgreSQL)." },
          { label: "Offline First", desc: "Operação garantida mesmo com instabilidade de rede." },
          { label: "PWA (Mobile)", desc: "Instalável em tablets e celulares sem dependência de apps store." },
          { label: "Segurança", desc: "Isolamento de dados por empresa (RLS) e TLS." }
        ].map((item, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle2 size={14} />
            </div>
            <div>
              <h5 className="font-bold text-gray-900 text-sm">{item.label}</h5>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    
    <div className="relative">
      <div className="bg-slate-900 rounded-3xl p-8 text-white font-mono text-xs shadow-2xl">
        <div className="flex gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="space-y-2 opacity-80">
          <p className="text-blue-400">// Stack Tecnológico</p>
          <p><span className="text-purple-400">const</span> <span className="text-yellow-400">frontend</span> = [<span className="text-green-400">"Next.js 15"</span>, <span className="text-green-400">"Tailwind"</span>];</p>
          <p><span className="text-purple-400">const</span> <span className="text-yellow-400">backend</span> = [<span className="text-green-400">"Node.js 22"</span>, <span className="text-green-400">"Fastify"</span>];</p>
          <p><span className="text-purple-400">const</span> <span className="text-yellow-400">database</span> = [<span className="text-green-400">"PostgreSQL 16"</span>, <span className="text-green-400">"Supabase"</span>];</p>
          <br />
          <p className="text-blue-400">// Deployment</p>
          <p><span className="text-yellow-400">containerRuntime</span>: <span className="text-green-400">"Docker Compose"</span>,</p>
          <p><span className="text-yellow-400">proxyServer</span>: <span className="text-green-400">"Nginx"</span>,</p>
          <p><span className="text-yellow-400">operatingSystem</span>: <span className="text-green-400">"Ubuntu Server 24.04"</span></p>
        </div>
      </div>
      
      {/* Decorative chips */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
        className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3"
      >
        <div className="p-2 bg-blue-50 rounded-lg"><Cpu className="text-blue-600" size={20} /></div>
        <div className="font-bold text-gray-800 text-sm">Industrial Edge</div>
      </motion.div>
    </div>
  </div>
);

const ColosArchitectureSlide = () => (
  <div className="flex flex-col h-full p-12 overflow-hidden bg-white">
    <div className="mb-8 flex justify-between items-start">
      <div className="text-left">
        <h3 className="text-sm font-semibold tracking-widest text-[#5B2C6F] mb-2 font-mono">Cenário CoLOS</h3>
        <h2 className="text-4xl font-bold text-[#111827]">Integração MES Amafil + CoLOS</h2>
      </div>
      <img 
        src="https://neutechpackaging.com/new2026/wp-content/uploads/2025/04/markem-imaje-logo-full-color.png" 
        alt="Markem-Imaje Logo" 
        className="h-12 object-contain"
        referrerPolicy="no-referrer"
      />
    </div>

    <div className="flex-grow flex flex-col justify-center max-w-5xl mx-auto w-full relative">
      <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 shadow-inner relative">
        <div className="space-y-3">
          {[
            { level: "Nível 4", title: "Empresa (ERP)", items: ["Gestão Corporativa / Protheus"], color: "bg-[#1B2631]" },
            { level: "Nível 3", title: "Fábrica (MES + WMS)", items: ["MES Amafil", "Gestão de Dados", "Banco de Dados Central"], color: "bg-[#00AA4D]" },
            { level: "Nível 2", title: "Linha (CoLOS)", items: ["Design de Mensagem", "Production", "Administrator"], color: "bg-[#5B2C6F]" },
            { level: "Nível 1", title: "Dispositivo", items: ["Scanners", "Codificadores", "Etiquetadores", "Visão", "CLP"], color: "bg-[#2E4053]" },
            { level: "Nível 0", title: "Esteira", items: ["Item", "Caixa", "Palete"], color: "bg-[#5D6D7E]" }
          ].map((lvl, index) => (
            <motion.div 
              key={lvl.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className={`w-28 shrink-0 flex items-center justify-center text-white font-bold text-[10px] py-3 rounded-xl shadow-sm ${lvl.color}`}>
                {lvl.level}
              </div>
              <div className="flex-grow bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-4 shadow-sm">
                <div className="font-bold text-gray-800 text-xs min-w-[140px] border-r border-gray-100 pr-4">{lvl.title}</div>
                <div className="flex flex-wrap gap-2">
                  {lvl.items.map((item, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-50 text-gray-500 text-[10px] rounded-md border border-gray-100">{item}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Flow Indicators */}
        <div className="absolute right-8 top-10 bottom-10 w-1 bg-gray-200/50 rounded-full flex flex-col justify-between py-10">
          <div className="w-3 h-3 bg-indigo-500 rounded-full -ml-1 border-2 border-white shadow-sm" />
          <div className="w-3 h-3 bg-green-500 rounded-full -ml-1 border-2 border-white shadow-sm" />
          <div className="w-3 h-3 bg-purple-500 rounded-full -ml-1 border-2 border-white shadow-sm" />
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-8">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><ArrowRightLeft className="text-purple-600" size={20} /></div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-tighter">Fluxo de Dados</h4>
            <p className="text-xs text-gray-500">Comandos automáticos e feedback de produção.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-50 rounded-lg"><Truck className="text-gray-400" size={20} /></div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-tighter">Fluxo de Produto</h4>
            <p className="text-xs text-gray-500">Movimentação física do item ao palete final.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ColosBenefitsSlide = () => (
  <div className="flex flex-col h-full p-12 bg-white">
    <div className="mb-12 flex justify-between items-end">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[#5B2C6F] mb-2 font-mono">Value Proposition</h3>
        <h2 className="text-4xl font-bold text-[#111827]">Vantagens da Sincronização MES + CoLOS</h2>
      </div>
      <div className="bg-[#5B2C6F] text-white px-6 py-2 rounded-xl font-black italic tracking-tighter text-2xl">
        CoLOS®
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center flex-grow">
      <div className="space-y-8">
        {[
          { 
            title: "Configuração Zero-Touch", 
            icon: <Zap className="text-amber-500" />, 
            desc: "Envio automático das informações para as impressoras sem necessidade de intervenção manual do operador." 
          },
          { 
            title: "Confiabilidade Total", 
            icon: <CheckCircle2 className="text-[#00AA4D]" />, 
            desc: "Redução drástica de erros humanos e garantia de que o lote/validade impresso é exatamente o da OP." 
          },
          { 
            title: "Monitoramento em Tempo Real", 
            icon: <Activity className="text-blue-500" />, 
            desc: "O MES obtém status das impressoras, quantidade de impressões e telemetria detalhada de funcionamento." 
          }
        ].map((benefit, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex gap-5"
          >
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100">
              {benefit.icon}
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h4>
              <p className="text-gray-600 leading-relaxed">{benefit.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#5B2C6F]/5 p-8 rounded-[3rem] border border-purple-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/50 rounded-full blur-2xl"></div>
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }} 
          transition={{ repeat: Infinity, duration: 4 }}
          className="mb-8"
        >
          <div className="w-40 h-40 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 relative p-5">
            <img 
              src="https://marksys.com.br/wp-content/uploads/2025/05/colos-flower-400x400-25.jpg" 
              alt="CoLOS Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback icon if image fails
                e.currentTarget.style.display = 'none';
              }}
            />
            <Settings size={48} className="text-[#5B2C6F] absolute opacity-20" />
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute -inset-4 border-2 border-dashed border-purple-200 rounded-full"
            />
          </div>
        </motion.div>
        <h4 className="text-lg font-bold text-[#5B2C6F] mb-4">Conectividade Bidirecional</h4>
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">MES ➔ CoLOS</div>
            <p className="text-[11px] font-medium text-gray-700">Setup Automático, Lote, Validade e Templates</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">CoLOS ➔ MES</div>
            <p className="text-[11px] font-medium text-gray-700">Status, Contagem de Impressão e Saúde do Ativo</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const MarkemImajeProductsSlide = () => (
  <div className="flex flex-col h-full p-12 bg-white">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-grow">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#5B2C6F] rounded-lg"></div>
          <div>
            <h3 className="text-sm font-bold text-[#5B2C6F] uppercase tracking-tighter">Markem-Imaje</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Soma Solution • Distribuidor Oficial</p>
          </div>
        </div>
        
        <h2 className="text-4xl font-bold text-[#111827] mb-8">Codificação e Marcação de Produtos</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            "Impressoras Inkjet",
            "Termotransferência",
            "Impressoras Laser",
            "Alta Resolução",
            "Jato de Tinta Térmico",
            "Grandes Caracteres",
            "Aplicadoras de Etiquetas",
            "Visão e Inspeção"
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100"
            >
              <CheckCircle2 size={16} className="text-[#5B2C6F] shrink-0" />
              <span className="text-sm font-medium text-gray-700">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-[#5B2C6F]/5 rounded-[3rem] blur-3xl group-hover:bg-[#5B2C6F]/10 transition-all duration-700"></div>
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5B2C6F]/5 rounded-bl-full"></div>
          <div className="flex flex-col items-center gap-6">
            <div className="grid grid-cols-2 gap-4 w-full">
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-5 bg-white rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center text-center"
              >
                <div className="text-xl font-black text-gray-900 mb-1">X30</div>
                <div className="text-[9px] text-[#5B2C6F] uppercase font-bold mb-2">SmartDate TTO</div>
                <p className="text-[10px] text-gray-500 leading-tight">Codificação térmica compacta para embalagens.</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="p-5 bg-white rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center text-center"
              >
                <div className="text-xl font-black text-gray-900 mb-1">X45</div>
                <div className="text-[9px] text-[#5B2C6F] uppercase font-bold mb-2">SmartDate TTO</div>
                <p className="text-[10px] text-gray-500 leading-tight">Alta performance e gerenciamento de fita.</p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-5 bg-white rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center text-center"
              >
                <div className="text-xl font-black text-gray-900 mb-1">9330</div>
                <div className="text-[9px] text-blue-600 uppercase font-bold mb-2">Inkjet (CIJ)</div>
                <p className="text-[10px] text-gray-500 leading-tight">Versatilidade e baixo custo operacional.</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="p-5 bg-white rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center text-center"
              >
                <div className="text-xl font-black text-gray-900 mb-1">2200</div>
                <div className="text-[9px] text-indigo-600 uppercase font-bold mb-2">Print & Apply</div>
                <p className="text-[10px] text-gray-500 leading-tight">Rotulagem automática de alta velocidade.</p>
              </motion.div>
            </div>
            
            <div className="w-full space-y-3 px-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                <span>Eficiência de Linha</span>
                <span className="text-[#00AA4D]">UP-TIME</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }} 
                  transition={{ delay: 1, duration: 2 }} 
                  className="h-full bg-gradient-to-r from-[#5B2C6F] to-[#00AA4D]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="mt-8 border-t border-gray-100 pt-6 flex justify-between items-center mb-12">
      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        Solution for Food & Beverage Coding
      </div>
      <div className="flex gap-4 items-center">
        <span className="text-[10px] font-bold text-[#5B2C6F]">MARKEM-IMAJE.COM</span>
        <span className="text-gray-300">|</span>
        <span className="text-[10px] font-bold text-[#2B57A3]">SOMASOLUTION.COM.BR</span>
      </div>
    </div>
  </div>
);

const DatecHardwareSlide = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full p-12">
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-widest text-[#EE7101] mb-2 font-mono">Hardware & Conectividade</h3>
      <h2 className="text-4xl font-bold text-[#111827] mb-6">DATEC: A Ponte para o IOT</h2>
      <p className="text-lg text-gray-600 mb-8">
        A Datec Solution fornece a camada física de automação, conectando sensores, 
        balanças e CLPs diretamente ao MES via Gateways Industriais.
      </p>
      
      <div className="space-y-6">
        {[
          { title: "Gateway Datec", desc: "Coleta e processamento de borda com buffer local (offline-ready).", icon: <Cpu className="text-[#EE7101]" /> },
          { title: "Monitoramento de Máquinas", desc: "Ciclos, status e alarmes capturados em tempo real (Modbus/OPC-UA).", icon: <Activity className="text-blue-500" /> },
          { title: "Infraestrutura Elétrica", desc: "Painéis, clausuras IP65 e suportes robustos para o ambiente industrial.", icon: <Settings className="text-gray-500" /> }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
    
    <div className="bg-[#111827] rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[400px]">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_#EE7101_0%,_transparent_70%)]"></div>
      <div className="relative flex flex-col items-center">
        {/* Simple Gateway Illustration */}
        <motion.div 
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-48 h-64 bg-gray-800 rounded-2xl border-4 border-gray-700 p-4 shadow-inner relative"
        >
          <div className="w-full h-8 bg-gray-700 rounded mb-4 flex items-center px-4 gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          </div>
          <div className="space-y-3">
            <div className="h-1 bg-gray-600 rounded-full w-full"></div>
            <div className="h-1 bg-gray-600 rounded-full w-3/4"></div>
            <div className="h-1 bg-gray-600 rounded-full w-full"></div>
            <div className="h-1 bg-gray-600 rounded-full w-1/2"></div>
          </div>
          <div className="absolute bottom-4 inset-x-4 flex justify-between">
            <div className="w-8 h-8 bg-gray-700 rounded-md border border-gray-600 flex items-center justify-center text-[8px] text-gray-400 font-bold">ETH</div>
            <div className="w-8 h-8 bg-gray-700 rounded-md border border-gray-600 flex items-center justify-center text-[8px] text-gray-400 font-bold">MBUS</div>
          </div>
        </motion.div>
        <div className="mt-8 text-center">
          <p className="text-[#EE7101] font-mono text-xs font-bold uppercase tracking-widest">Gateway Industrial Datec</p>
          <p className="text-gray-500 text-[10px] uppercase font-bold mt-1">Conectividade Robusta</p>
        </div>
      </div>
    </div>
  </div>
);

const DatecPartnershipSlide = () => (
  <div className="flex flex-col items-center justify-center h-full p-24 bg-white text-center">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mb-16 flex flex-col items-center"
    >
      <div className="relative p-8 bg-gray-950 rounded-3xl mb-8 shadow-2xl">
        <img 
          src="https://www.datecsolution.com/img/datec-solution.webp" 
          alt="Datec Solution Logo" 
          className="h-24 object-contain brightness-0 invert"
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="text-[#EE7101] font-bold uppercase tracking-[0.3em] text-sm">Parceiro Estratégico</span>
      <p className="text-gray-500 text-sm mt-4 max-w-lg leading-relaxed">
        A <strong className="font-semibold text-gray-700">Datec Solution</strong> faz parte do{' '}
        <strong className="font-semibold text-gray-800">Grupo Soma</strong>.
      </p>
    </motion.div>

    <div className="grid grid-cols-2 gap-16 max-w-4xl">
      <div className="text-left">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
           <Zap className="text-[#EE7101]" /> Eficiência de Campo
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Montagem de painéis, execução da infraestrutura e passagem de cabos com identificação e testes,
          integração dos equipamentos à rede industrial e condução de projetos — da engenharia de campo à
          entrada em operação, com rastreabilidade documental para o MES.
        </p>
      </div>
      <div className="text-left">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="text-blue-600" /> Soluções Completas
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          Dos suportes metálicos às clausuras elétricas, a Datec entrega 
          o "Turn-key" da conectividade industrial, 
          permitindo que a TI se foque na inteligência.
        </p>
      </div>
    </div>

    <div className="mt-20 flex items-center gap-12 grayscale opacity-50">
      <div className="text-sm font-black text-gray-400 font-mono tracking-tighter">DATEC.<span className="text-gray-300">SOLUTION</span></div>
    </div>
  </div>
);

const FlowSlide = () => (
  <div className="flex flex-col h-full min-h-0 p-8 pt-6 pb-28 bg-gray-50 overflow-hidden">
    <div className="mb-3 md:mb-4 text-center shrink-0">
      <h3 className="text-[11px] md:text-sm font-semibold uppercase tracking-widest text-[#00AA4D] mb-1 font-mono">
        Infraestrutura & Fluxo de Dados
      </h3>
      <h2 className="text-2xl md:text-3xl font-bold text-[#111827] leading-tight">
        Ecossistema MES.Amafil
      </h2>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 -mr-1">
      <div className="grid grid-cols-12 gap-3 md:gap-4 relative pb-1 min-h-0">
        <div className="col-span-12 flex justify-center mb-1 shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-2xl shadow-xl border border-gray-700 flex flex-col items-center"
          >
            <Database size={18} className="mb-0.5 text-blue-400" />
            <span className="text-[11px] font-black uppercase tracking-widest">TOTVS Protheus</span>
            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">
              ERP Corporativo (SIGAPCP)
            </span>
          </motion.div>
        </div>

        <div className="col-span-12 flex justify-center h-6 -mt-1 shrink-0">
          <div className="w-px border-l border-dashed border-gray-300 h-full relative">
            <ArrowRightLeft
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 rotate-90"
              size={12}
            />
          </div>
        </div>

        <div className="col-span-12 md:col-span-3 min-h-0">
          <div className="h-full min-h-0 bg-white rounded-2xl border border-gray-200 p-3 shadow-sm flex flex-col justify-start gap-2">
            <div className="px-2 py-1 bg-gray-100 rounded-full text-[8px] font-bold text-gray-400 text-center uppercase tracking-widest">
              Perfis (PWA)
            </div>
            {[
              { label: 'PCP', icon: <BarChart3 size={15} /> },
              { label: 'Operação', icon: <Boxes size={15} /> },
              { label: 'Manutenção', icon: <Wrench size={15} /> },
              { label: 'Gestão', icon: <Settings size={15} /> },
            ].map((u, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[#00AA4D] shadow-sm shrink-0">
                  {u.icon}
                </div>
                <span className="text-[11px] font-bold text-gray-700">{u.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 flex flex-col gap-3 min-h-0">
          <div className="bg-[#00AA4D] rounded-2xl p-4 text-white shadow-xl relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-bl-full" />
            <div className="relative flex justify-between items-start gap-3 mb-3">
              <div className="min-w-0">
                <h4 className="text-base font-black uppercase tracking-tighter">Servidor MES</h4>
                <p className="text-[9px] text-green-100 uppercase font-bold tracking-widest opacity-70">
                  On-Premises Runtime
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                <div className="px-2 py-0.5 bg-white/20 rounded text-[8px] font-bold">NODE.JS 22</div>
                <div className="px-2 py-0.5 bg-white/20 rounded text-[8px] font-bold">FASTIFY</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/10 p-2.5 rounded-xl flex flex-col items-center">
                <Activity size={18} className="mb-1" />
                <span className="text-[8px] font-bold uppercase">Realtime</span>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl flex flex-col items-center border border-white/20">
                <Database size={18} className="mb-1" />
                <span className="text-[8px] font-bold uppercase">Auth / DB</span>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl flex flex-col items-center">
                <ArrowRightLeft size={18} className="mb-1" />
                <span className="text-[8px] font-bold uppercase">Proxy</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex items-center gap-3 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                <Database className="text-blue-600" size={20} />
              </div>
              <div className="min-w-0">
                <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Central DB</h5>
                <p className="text-[11px] font-bold text-gray-800">PostgreSQL 16</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex items-center gap-3 min-w-0">
              <div className="p-2 bg-red-50 rounded-lg shrink-0">
                <Activity className="text-red-500" size={20} />
              </div>
              <div className="min-w-0">
                <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Queue & Cache</h5>
                <p className="text-[11px] font-bold text-gray-800">Redis / BullMQ</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-3 min-h-0">
          <div className="h-full min-h-0 bg-[#111827] rounded-2xl p-4 text-white flex flex-col">
            <h4 className="text-xs font-bold mb-3 flex items-center gap-2 shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              Dispositivos
            </h4>
            <div className="space-y-2 flex-1 min-h-0">
              {[
                { label: 'Painéis Industriais', type: 'HMI' },
                { label: 'Tablets Linha', type: 'Mobile' },
                { label: 'Smartphones', type: 'PWA' },
              ].map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center gap-2 bg-white/5 p-2.5 rounded-xl border border-white/5"
                >
                  <span className="text-[11px] font-medium text-gray-400 truncate">{d.label}</span>
                  <span className="text-[8px] font-black bg-white/10 px-1.5 py-0.5 rounded text-white italic shrink-0">
                    {d.type}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 text-center shrink-0">
              <p className="text-[8px] text-gray-500 uppercase tracking-[0.18em]">Interface Unificada</p>
            </div>
          </div>
        </div>

        <div className="col-span-12 mt-1 shrink-0">
          <div className="bg-gray-200/50 rounded-2xl p-4 border-t-2 border-gray-300 relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gray-900 border border-gray-700 text-white text-[8px] font-black uppercase rounded-full shadow-lg whitespace-nowrap">
              Hardware & Automação (IOT)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-2">
              <div className="sm:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {['Empacotadora', 'Balança', 'Costuradeira', 'Enfardadeira'].map((m, i) => (
                  <div
                    key={i}
                    className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center gap-1.5"
                  >
                    <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <Boxes size={18} />
                    </div>
                    <span className="text-[9px] font-bold text-gray-700 uppercase tracking-tighter text-center leading-tight">
                      {m}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#EE7101] rounded-xl p-3 text-white shadow-lg flex flex-col items-center justify-center text-center min-h-[100px]">
                <Cpu size={22} className="mb-1 shrink-0" />
                <h5 className="text-[9px] font-black uppercase mb-0.5">Gateway IoT</h5>
                <p className="text-[8px] leading-snug text-white/80">
                  Buffer Local <br /> Modbus/OPC
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** Linha de embalagem: gateway central consolidando sinais e liberando MES/DB e IO. Vem após o slide de fluxo geral do ecossistema. */
const PackagingLineGatewaySlide = () => {
  const equipment = [
    { label: 'Embaladora', sub: 'Indica unidade do produto', icon: <Boxes size={18} className="text-[#EE7101]" /> },
    { label: 'Dosagem', sub: 'Produto na embalagem', icon: <Droplets size={18} className="text-blue-500" /> },
    { label: 'Balança', sub: 'Confirma peso', icon: <Scale size={18} className="text-emerald-600" /> },
    { label: 'Enfardadeira', sub: 'Confirma o fardo', icon: <Boxes size={18} className="text-violet-600" /> },
    {
      label: 'Hikrobot SC3000',
      sub: 'OCR e leitura de código',
      icon: <ScanBarcode size={18} className="text-[#FF6A00]" />
    }
  ];

  return (
    <div className="flex flex-col h-full min-h-0 p-8 pt-6 pb-28 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      <div className="mb-4 md:mb-5 text-center shrink-0">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-[#EE7101] mb-1 font-mono">
          Automação de linha
        </h3>
        <h2 className="text-xl md:text-2xl font-bold text-[#111827] leading-tight">
          Gateway no centro: da embaladora ao fardo
        </h2>
        <p className="text-sm text-gray-500 mt-2 md:mt-3 max-w-3xl mx-auto leading-snug">
          Consolidação de eventos da linha, persistência auditável e ações de campo (alarme e intertravamento). O gateway também pode receber{' '}
          <strong className="font-semibold text-gray-700">OCR e leitura de código</strong> do sensor{' '}
          <strong className="font-semibold text-[#FF6A00]">SC3000 Hikrobot</strong>.
        </p>
      </div>

      <div className="flex flex-1 min-h-0 flex-col gap-3 overflow-hidden">
        {/* Área do diagrama: rolagem interna se faltar altura (evita sobrepor o bloco de regras) */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 -mr-1">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8 items-stretch justify-center max-w-6xl mx-auto w-full pb-1">
            {/* Entradas — equipamentos */}
            <div className="flex flex-col gap-2 justify-start lg:w-[220px] shrink-0 lg:pr-3">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center lg:text-left mb-1">
                Entradas (dados de campo)
              </p>
              {equipment.map((eq, i) => (
                <motion.div
                  key={eq.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm relative"
                >
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                    {eq.icon}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-bold text-gray-900">{eq.label}</div>
                    <div className="text-[10px] text-gray-500 leading-snug">{eq.sub}</div>
                  </div>
                  <ChevronRight className="absolute -right-1 top-1/2 -translate-y-1/2 text-gray-300 hidden lg:block pointer-events-none" size={14} />
                </motion.div>
              ))}
            </div>

            {/* Gateway + saídas */}
            <div className="flex flex-1 min-w-0 flex-col items-center justify-start gap-3 min-h-0">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="w-full max-w-sm bg-[#111827] rounded-2xl p-4 text-white shadow-2xl border border-gray-800 relative shrink-0"
              >
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#EE7101]/40 to-transparent opacity-50 pointer-events-none" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#EE7101] flex items-center justify-center mb-2 shadow-lg">
                    <Cpu size={24} className="text-white" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-tight">Gateway industrial</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed px-1">
                    Correlaciona contagens, dosagem, peso e fechamento do fardo; integra, quando disponível, resultados de{' '}
                    <span className="text-gray-300">OCR e leitura de código</span> do <span className="text-[#FF6A00]">SC3000</span> antes de registrar produção.
                  </p>
                </div>
              </motion.div>

              {/* Saídas digitais */}
              <div className="flex flex-wrap justify-center gap-2 w-full shrink-0">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm"
                >
                  <Database className="text-blue-600" size={20} />
                  <div className="text-left">
                    <div className="text-[10px] font-black text-gray-400 uppercase">Banco de dados</div>
                    <div className="text-xs font-bold text-gray-800">Histórico e telemetria</div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="flex items-center gap-2 px-3 py-2.5 bg-[#00AA4D]/10 rounded-xl border border-[#00AA4D]/25 shadow-sm"
                >
                  <Activity className="text-[#00AA4D]" size={20} />
                  <div className="text-left">
                    <div className="text-[10px] font-black text-[#00AA4D] uppercase">MES</div>
                    <div className="text-xs font-bold text-gray-800">Produção confirmada</div>
                  </div>
                </motion.div>
              </div>

              {/* Saídas IO */}
              <div className="w-full max-w-md shrink-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mb-1.5">
                  Saídas IO (campo)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200"
                  >
                    <Bell className="text-amber-600 shrink-0" size={18} />
                    <div className="text-left min-w-0">
                      <div className="text-[10px] font-bold text-amber-900 uppercase">Torre de alarme</div>
                      <div className="text-[10px] text-amber-800/90 leading-snug">Sinalização de inconformidade</div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42 }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-200"
                  >
                    <Lock className="text-slate-700 shrink-0" size={18} />
                    <div className="text-left min-w-0">
                      <div className="text-[10px] font-bold text-slate-800 uppercase">Intertravamento</div>
                      <div className="text-[10px] text-slate-600 leading-snug">Segurança e parada coordenada</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regras de reconciliação — shrink-0 para nunca ser coberto pelo diagrama */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="shrink-0 w-full max-w-7xl mx-auto bg-white rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm"
        >
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
            Lógica de reconciliação e perdas
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-[10px] md:text-[11px] text-gray-600 leading-snug">
          <li className="flex gap-2">
            <CheckCircle2 size={14} className="text-[#00AA4D] shrink-0 mt-0.5" />
            <span>
              A <strong className="text-gray-800">unidade do produto</strong> é indicada pela embaladora e{' '}
              <strong className="text-gray-800">confirmada</strong> pela balança e pela enfardadeira; o que sai da embaladora deve{' '}
              <strong className="text-gray-800">bater com a quantidade de produtos nos fardos</strong>.
            </span>
          </li>
          <li className="flex gap-2">
            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              Contagem na embaladora <strong className="text-gray-800">sem sinal de dosagem</strong>: embalagem retirada para ajuste{' '}
              <strong className="text-gray-800">sem produto</strong> → indicador de <strong className="text-gray-800">perda de embalagem</strong>.
            </span>
          </li>
          <li className="flex gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <span>
              Com dosagem ativa, o produto passou pela balança e <strong className="text-gray-800">não chegou à enfardadeira</strong>{' '}
              (retirado por peso) → indicador de <strong className="text-gray-800">perda de produto</strong>.
            </span>
          </li>
          <li className="flex gap-2">
            <CheckCircle2 size={14} className="text-[#2B57A3] shrink-0 mt-0.5" />
            <span>
              <strong className="text-gray-800">Produção confirmada no MES apenas com o fardo produzido</strong> — fechamento do ciclo na enfardadeira.
            </span>
          </li>
        </ul>
      </motion.div>
      </div>
    </div>
  );
};

const ConclusionSlide = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-white relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00AA4D] via-[#2B57A3] to-[#5B2C6F]"></div>
    <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-gray-50 rounded-full blur-3xl opacity-50"></div>
    
    <motion.div 
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 15 }}
      className="w-24 h-24 bg-[#00AA4D] rounded-[2rem] flex items-center justify-center text-white mb-10 shadow-2xl shadow-green-200 relative z-10"
    >
      <CheckCircle2 size={48} />
    </motion.div>
    
    <div className="relative z-10 max-w-3xl">
      <h2 className="text-5xl font-black text-[#111827] mb-6 leading-tight tracking-tighter">
        Eficiência que se vê <br />
        <span className="text-[#00AA4D]">na prática.</span>
      </h2>
      <p className="text-xl text-gray-500 mb-12 leading-relaxed">
        O MES Amafil é mais que um software, é a evolução da nossa maturidade produtiva. 
        Dados precisos, decisões rápidas e um chão de fábrica 100% conectado.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl relative z-10">
      {[
        { label: "Performance", val: "+15%", desc: "Ganho médio em OEE", color: "text-[#00AA4D]", bg: "bg-green-50" },
        { label: "Decisões Ágeis", val: "LIVE", desc: "Dados em tempo real", color: "text-[#2B57A3]", bg: "bg-blue-50" },
        { label: "Governança", val: "100%", desc: "Rastreabilidade Digital", color: "text-purple-600", bg: "bg-purple-50" }
      ].map((metric, i) => (
        <motion.div 
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all border-b-4 border-b-gray-100 hover:border-b-[#00AA4D]/30"
        >
          <div className={`text-4xl font-black ${metric.color} mb-2 tracking-tighter`}>{metric.val}</div>
          <div className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">{metric.label}</div>
          <div className="text-[10px] text-gray-400 font-medium uppercase">{metric.desc}</div>
        </motion.div>
      ))}
    </div>
    
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="mt-16 flex flex-col items-center"
    >
      <div className="h-px w-12 bg-gray-200 mb-6"></div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.4em]">Indústria 4.0 Amafil</p>
    </motion.div>
  </div>
);

const HikrobotIntroSlide = () => (
  <div className="flex flex-col h-full p-12 bg-white relative">
    <div className="absolute top-8 right-12 z-10">
      <HikrobotLogo className="h-7" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center flex-grow">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#FF6A00] rounded-lg flex items-center justify-center">
            <Eye size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#FF6A00] uppercase tracking-tighter">Hikrobot</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Vision Sensor • SC3000</p>
          </div>
        </div>

        <h2 className="text-4xl font-bold text-[#111827] mb-6 leading-tight">
          Visão na linha como <span className="text-[#FF6A00]">extensão do MES</span>
        </h2>

        <div className="space-y-4">
          {[
            {
              title: 'Hikrobot',
              desc: 'Fornecedora global de visão industrial e robótica móvel, com foco em IIoT, logística e manufatura inteligentes.',
              icon: <Boxes size={18} className="text-[#FF6A00]" />
            },
            {
              title: 'SC3000 — Vision Sensor',
              desc: 'Aquisição de imagem, processamento e comunicação integrados em formato compacto, com ferramentas de visão de alto desempenho.',
              icon: <Focus size={18} className="text-[#FF6A00]" />
            },
            {
              title: 'Olhos do sistema',
              desc: 'Dados em tempo real do que é produzido, com alto índice de acerto — inspeção de conformidade de todos os produtos, com eficiência.',
              icon: <Activity size={18} className="text-[#FF6A00]" />
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100"
            >
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0 border border-orange-100">
                {item.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                <p className="text-sm text-gray-500 leading-snug">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-[#FF6A00]/5 rounded-[3rem] blur-3xl group-hover:bg-[#FF6A00]/10 transition-all duration-700"></div>
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6A00]/5 rounded-bl-full"></div>
          <div className="flex flex-col items-center gap-6">
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              src={SC3000_IMAGE_URL}
              alt="Hikrobot SC3000 — sensor de visão"
              referrerPolicy="no-referrer"
              className="w-full max-w-[300px] h-auto object-contain drop-shadow-xl"
            />
            <div className="w-full grid grid-cols-3 gap-3 px-2">
              {[
                { label: 'Iluminação', value: 'LED' },
                { label: 'Indicação', value: 'OK / NG' },
                { label: 'Conector', value: 'M12' }
              ].map((spec, i) => (
                <div key={i} className="text-center p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                  <div className="text-[9px] text-[#FF6A00] uppercase font-bold tracking-wider">{spec.label}</div>
                  <div className="text-sm font-black text-gray-900 mt-1">{spec.value}</div>
                </div>
              ))}
            </div>
            <div className="w-full text-center pt-2 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vision Sensor SC3000</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-8 border-t border-gray-100 pt-6 flex justify-between items-center mb-12">
      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        Inspeção visual contínua alinhada ao MES
      </div>
      <div className="flex gap-4 items-center">
        <span className="text-[10px] font-bold text-[#FF6A00]">HIKROBOTICS.COM</span>
        <span className="text-gray-300">|</span>
        <span className="text-[10px] font-bold text-[#2B57A3]">CONFORMIDADE EM TEMPO REAL</span>
      </div>
    </div>
  </div>
);

const HikrobotErrorProofingSlide = () => (
  <div className="flex flex-col h-full min-h-0 p-8 pt-5 pb-28 bg-white relative overflow-hidden">
    <div className="absolute top-4 right-6 sm:right-10 z-10 pointer-events-none">
      <HikrobotLogo className="h-6 sm:h-7" />
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pr-1 -mr-1">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <div className="min-w-0 lg:pt-1">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#FF6A00] rounded-lg flex items-center justify-center shrink-0">
              <ScanLine size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[#FF6A00] uppercase tracking-tighter truncate">
                SC3000 Series
              </h3>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase leading-tight">
                Error-Proofing • Inspeção Antierro
              </p>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111827] mb-4 sm:mb-5 leading-tight">
            Sensor compacto, <span className="text-[#FF6A00]">inspeção à prova de erros</span>
          </h2>

          <div className="space-y-2 sm:space-y-3">
            {[
              {
                title: 'Série SC3000 + SCMVS',
                desc: 'Solução compacta com ferramentas de detecção de alto desempenho. SCMVS reduz o esforço de parametrização em campo — completa e custo-benefício.',
                icon: <Cpu size={18} className="text-[#FF6A00]" />
              },
              {
                title: 'Algoritmos antierro',
                desc: 'Presença/ausência, orientação (cima/baixo), posicionamento e contagem — error-proofing aplicado direto na linha.',
                icon: <AlertCircle size={18} className="text-[#FF6A00]" />
              },
              {
                title: 'OCR e leitura de código',
                desc: 'Reconhecimento de texto em etiquetas e decodificação de códigos (barras e matriciais) para validação automática na linha.',
                icon: <ScanBarcode size={18} className="text-[#FF6A00]" />
              },
              {
                title: 'Variedade de ferramentas',
                desc: 'Adequação a formatos diferentes de peças na mesma linha, simplificando a aplicação de visão no chão de fábrica.',
                icon: <Wrench size={18} className="text-[#FF6A00]" />
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-2 sm:gap-3 p-3 sm:p-3.5 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border border-orange-100">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-500 leading-snug mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative group min-w-0">
          <div className="absolute inset-0 bg-[#FF6A00]/5 rounded-3xl blur-2xl sm:blur-3xl group-hover:bg-[#FF6A00]/10 transition-all duration-700" />
          <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 lg:p-7 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-[#FF6A00]/5 rounded-bl-full" />
            <div className="relative flex flex-col items-center gap-4 sm:gap-5">
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                src={SC3000_IMAGE_URL}
                alt="Hikrobot SC3000 — sensor de visão"
                referrerPolicy="no-referrer"
                className="w-full max-w-[200px] sm:max-w-[240px] lg:max-w-[260px] h-auto object-contain drop-shadow-xl"
              />
              <div className="w-full grid grid-cols-2 gap-2 sm:gap-2.5 px-0 sm:px-1">
                {[
                  { label: 'Presença / Ausência', icon: <CheckCircle2 size={14} className="text-[#FF6A00] shrink-0" /> },
                  { label: 'Orientação U/D', icon: <ArrowRightLeft size={14} className="text-[#FF6A00] shrink-0" /> },
                  { label: 'Posicionamento', icon: <Focus size={14} className="text-[#FF6A00] shrink-0" /> },
                  { label: 'Contagem', icon: <Boxes size={14} className="text-[#FF6A00] shrink-0" /> },
                  { label: 'OCR', icon: <FileText size={14} className="text-[#FF6A00] shrink-0" /> },
                  { label: 'Leitura de código', icon: <ScanBarcode size={14} className="text-[#FF6A00] shrink-0" /> }
                ].map((tool, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 bg-orange-50/40 rounded-lg border border-orange-100 min-w-0"
                  >
                    {tool.icon}
                    <span className="text-[9px] sm:text-[11px] font-semibold text-gray-700 leading-tight">{tool.label}</span>
                  </motion.div>
                ))}
              </div>
              <div className="w-full space-y-1.5 pt-1">
                <div className="flex justify-between items-center gap-2 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase">
                  <span className="truncate">Aderência a geometrias</span>
                  <span className="text-[#FF6A00] shrink-0">Multi-formato</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '92%' }}
                    transition={{ delay: 0.8, duration: 1.6 }}
                    className="h-full bg-gradient-to-r from-[#FF6A00] to-[#00AA4D]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="shrink-0 mt-2 sm:mt-3 border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
      <div className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-snug">
        Mais ferramentas → menos retrabalho na troca de peça
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-[9px] sm:text-[10px]">
        <span className="font-bold text-[#FF6A00]">SCMVS • SC3000 SERIES</span>
        <span className="text-gray-300 hidden sm:inline">|</span>
        <span className="font-bold text-[#2B57A3]">ERROR-PROOFING</span>
      </div>
    </div>
  </div>
);

// --- Main Presentation Component ---

const slides = [
  { id: 'cover', component: <CoverSlide />, bg: 'bg-white' },
  { id: 'soma-solution', component: <SomaSolutionSlide />, bg: 'bg-slate-50' },
  { id: 'mi-products', component: <MarkemImajeProductsSlide />, bg: 'bg-white' },
  { id: 'colos-arch', component: <ColosArchitectureSlide />, bg: 'bg-white' },
  { id: 'colos-benefits', component: <ColosBenefitsSlide />, bg: 'bg-white' },
  { id: 'datec-partner', component: <DatecPartnershipSlide />, bg: 'bg-white' },
  { id: 'datec-hw', component: <DatecHardwareSlide />, bg: 'bg-white' },
  { id: 'hikrobot-intro', component: <HikrobotIntroSlide />, bg: 'bg-white' },
  { id: 'hikrobot-errorproofing', component: <HikrobotErrorProofingSlide />, bg: 'bg-white' },
  { id: 'problem', component: <ProblemSlide />, bg: 'bg-[#F9FAFB]' },
  { id: 'solution', component: <SolutionSlide />, bg: 'bg-white' },
  { id: 'dashboard', component: <DashboardMockup />, bg: 'bg-[#F5F6FA]' },
  { id: 'integration', component: <IntegrationSlide />, bg: 'bg-white' },
  { id: 'features', component: <FeaturesSlide />, bg: 'bg-[#F9FAFB]' },
  { id: 'architecture', component: <ArchitectureSlide />, bg: 'bg-white' },
  { id: 'flow', component: <FlowSlide />, bg: 'bg-gray-50' },
  { id: 'packaging-gateway', component: <PackagingLineGatewaySlide />, bg: 'bg-white' },
  { id: 'conclusion', component: <ConclusionSlide />, bg: 'bg-[#F9FAFB]' }
];

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  return (
    <div className="fixed inset-0 bg-[#111827] flex items-center justify-center font-sans overflow-hidden">
      <div className={`relative w-full max-w-[1280px] h-full max-h-[800px] overflow-hidden shadow-2xl transition-colors duration-500 ${slides[currentSlide].bg}`}>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 1000, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -1000, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-full h-full"
          >
            {slides[currentSlide].component}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Overlays */}
        <div className="absolute bottom-6 right-8 flex items-center gap-4 z-50">
          <div className="flex gap-2 mr-4">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-[#2B57A3]' : 'w-2 bg-gray-300'}`}
              />
            ))}
          </div>
          
          <button 
            onClick={prevSlide} 
            disabled={currentSlide === 0}
            className="p-3 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 disabled:opacity-30 transition-all text-[#2B57A3]"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide} 
            disabled={currentSlide === slides.length - 1}
            className="p-3 bg-[#2B57A3] text-white rounded-full shadow-lg hover:bg-[#1D4ED8] disabled:opacity-30 transition-all"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Logo and Context Branding */}
        <div className="absolute bottom-6 left-8 flex items-center gap-4 z-50">
          <div className="flex items-center gap-2 h-8 px-4 bg-white/80 backdrop-blur border border-gray-100 rounded-full shadow-sm">
            <div className="w-4 h-4 bg-[#00AA4D] rounded-sm"></div>
            <span className="text-[10px] font-bold text-gray-600 tracking-wider">MES.Amafil</span>
          </div>
          <div className="h-8 px-4 bg-gray-900 text-white flex items-center rounded-full shadow-lg font-mono text-xs font-bold ring-4 ring-gray-900/10">
            {String(currentSlide + 1).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#00AA4D]/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#2B57A3]/10 rounded-full blur-3xl -z-10"></div>
      
      {/* Footer Info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-500 text-[10px] font-medium tracking-tighter opacity-50 uppercase">
        Pressione SETAS para navegar · Esc para Sair · Apresentação Chão de Fábrica 4.0
      </div>
    </div>
  );
}

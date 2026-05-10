import { LayoutDashboard, Factory, AlertTriangle, FileText, Settings, Users, ClipboardList, PlayCircle, MessageSquare, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NavItem } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Operação', href: '/operacao', icon: PlayCircle },
  { label: 'Produção', href: '/producao', icon: Factory },
  { label: 'Ordens de Produção', href: '/ops', icon: ClipboardList },
  { label: 'Paradas', href: '/paradas', icon: AlertTriangle },
  { label: 'Solicitações', href: '/solicitacoes', icon: FileText },
  { label: 'Relatórios', href: '/relatorios', icon: FileText },
  { label: 'Mensagens', href: '/mensagens', icon: MessageSquare },
  { label: 'Usuários', href: '/usuarios', icon: Users },
  { label: 'Configurações', href: '/config', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "bg-white border-r border-bento-border fixed inset-y-0 left-0 z-[70] flex flex-col transition-all duration-300 ease-in-out lg:w-64",
        isOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8 flex items-center justify-between border-b border-bento-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amafil-green rounded-lg flex items-center justify-center font-bold text-white text-xl">A</div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">MES<span className="text-amafil-green">.Amafil</span></h1>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200",
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB] shadow-sm font-bold [&_svg]:text-[#2563EB]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 [&_svg]:text-gray-400"
                )
              }
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-6 border-t border-bento-border">
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-bento-border rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amafil-green flex items-center justify-center text-white font-black text-xs shadow-sm">
            MS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate tracking-tight">Marcos Cheffen</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">Master</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}

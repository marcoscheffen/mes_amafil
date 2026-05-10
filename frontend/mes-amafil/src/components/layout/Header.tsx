import { Bell, Search, User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuOpen?: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
  return (
    <header className="h-20 bg-white border-b border-bento-border sticky top-0 z-40 px-3 lg:px-8 flex items-center justify-between gap-2 lg:gap-4">
      <div className="flex items-center gap-1.5 lg:gap-6 flex-1 min-w-0">
        <button 
          onClick={onMenuOpen}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-xl flex-shrink-0"
        >
          <Menu className="w-6 h-6" />
        </button>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] hidden md:block italic flex-shrink-0">amafil-pcp-01</p>
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full bg-gray-50 border border-bento-border rounded-full py-2.5 pl-10 lg:pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
        <div className="w-8 h-8 flex items-center justify-center bg-green-50 text-amafil-green rounded-xl border border-amafil-green/20" title="Sistema Online">
          <span className="w-2.5 h-2.5 rounded-full bg-amafil-green animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
        </div>
        
        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amafil-red rounded-full border-2 border-white"></span>
        </button>
        
        <div className="hidden sm:block w-px h-8 bg-bento-border mx-1" />
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 tracking-tight leading-none mb-1">Amafil</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">Cianorte - PR</p>
          </div>
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 border border-bento-border shadow-sm">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}

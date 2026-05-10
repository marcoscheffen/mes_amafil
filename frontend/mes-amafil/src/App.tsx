import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Production } from './pages/Production';
import { OrderList } from './pages/OrderList';
import { DowntimeList } from './pages/DowntimeList';
import { SupportRequests } from './pages/SupportRequests';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Messages } from './pages/Messages';
import { ProductionExecution } from './pages/ProductionExecution';
import { motion, AnimatePresence } from 'motion/react';

import { useState, useEffect } from 'react';

function Layout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bento-bg">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="transition-all duration-300 lg:pl-64">
        <Header onMenuOpen={() => setIsSidebarOpen(true)} />
        
        <main className="p-4 lg:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/producao" element={<Production />} />
                <Route path="/ops" element={<OrderList />} />
                <Route path="/paradas" element={<DowntimeList />} />
                <Route path="/operacao" element={<ProductionExecution />} />
                <Route path="/solicitacoes" element={<SupportRequests />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/usuarios" element={<Users />} />
                <Route path="/mensagens" element={<Messages />} />
                <Route path="/config" element={<Settings />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<Layout />} />
    </Routes>
  );
}

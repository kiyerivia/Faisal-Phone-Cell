import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Spareparts } from './pages/Spareparts';
import { ServiceOrders } from './pages/ServiceOrders';
import { POS } from './pages/POS';
import { StockManagement } from './pages/StockManagement';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { db, seedInitialData } from './db/database';
import { syncService } from './services/syncService';
import { ThemeProvider } from './context/ThemeContext';

const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Pembersihan otomatis satu kali: Bersihkan semua katalog dummy & orderan lama agar toko mulai dari nol
        const CLEANUP_KEY = 'fpc_cleared_dummy_zero_v1';
        if (!localStorage.getItem(CLEANUP_KEY)) {
          await db.spareparts.clear();
          await db.service_orders.clear();
          await db.transactions.clear();
          await db.stock_movements.clear();
          localStorage.setItem(CLEANUP_KEY, 'true');
        }

        await seedInitialData();
        await syncService.initClient();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Faisal Phone Cell</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Memuat database offline lokal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 flex flex-col select-none antialiased transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar onNavigate={setActivePage} activePage={activePage} />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar activePage={activePage} onNavigate={setActivePage} />

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gradient-to-b dark:from-slate-900/40 dark:via-[#0b1120] dark:to-[#0b1120]">
          {activePage === 'dashboard' && <Dashboard onNavigate={setActivePage} />}
          {activePage === 'spareparts' && <Spareparts />}
          {activePage === 'services' && <ServiceOrders />}
          {activePage === 'pos' && <POS />}
          {activePage === 'stock' && <StockManagement />}
          {activePage === 'reports' && <Reports />}
          {activePage === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './layout/Navbar';
import Sidebar from './layout/Sidebar';
import Main from './layout/Main';
import MainRouter from './layout/MainRouter';
import AddBookmarkModal from './components/AddBookmarkModal';

function AppRouter() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="h-screen flex overflow-hidden bg-background text-text-primary">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar
            onAddBookmark={() => setModalOpen(true)}
            onMenuToggle={() => setSidebarOpen((o) => !o)}
          />
          <Routes>
            <Route path="/*" element={<Main />}>
              <Route path="*" element={<MainRouter />} />
            </Route>
          </Routes>
        </div>
      </div>
      <AddBookmarkModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </BrowserRouter>
  );
}

export default AppRouter;

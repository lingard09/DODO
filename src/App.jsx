// src/App.jsx (업데이트)
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './Components/AuthProvider';
import Auth from './Components/Auth';
import CoupleConnect from './Components/CoupleConnect';
import Main from './Pages/Main';

const AppContent = () => {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  if (!currentUser) {
    return <Auth />;
  }

  if (!isConnected) {
    return <CoupleConnect onComplete={() => setIsConnected(true)} />;
  }

  return <Main />;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
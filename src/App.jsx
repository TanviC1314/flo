import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/ui/login/LoginPage';
import OrderPage from './components/ui/OrderPage/OrderPage';
import Flogin from './components/ui/Flogin/Flogin';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} setEmail={setEmail} />} />
        <Route
          path="/OrderPage"
          element={isAuthenticated ? <OrderPage email={email} /> : <Navigate to="/login" />}
        />
        <Route path="/Flologin" element={<Flogin />} />
      </Routes>
    </Router>
  );
};

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PanelGrid from './pages/PanelGrid';
import PanelDetail from './pages/PanelDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PanelGrid />} />
        <Route path="/panel/:id" element={<PanelDetail />} />
      </Routes>
    </Router>
  );
}

export default App;

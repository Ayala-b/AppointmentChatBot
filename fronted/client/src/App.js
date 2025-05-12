import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RoleSelection from './RoleSelection';
import Chat from './Chat';
import DoctorDashboard from './DoctorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

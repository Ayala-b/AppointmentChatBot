import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

function RoleSelection() {
  const navigate = useNavigate();

  const handleSelection = (role) => {
    if (role === 'doctor') {
      navigate('/doctor');
    } else if (role === 'patient') {
      navigate('/chat');
    }
  };

  return (
    <div className="role-selection-container">
      <h2>Welcome! Who are you?</h2>
      <button className="role-button" onClick={() => handleSelection('doctor')}>Doctor</button>
      <button className="role-button" onClick={() => handleSelection('patient')}>Patient</button>
    </div>
  );
}

export default RoleSelection;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DoctorDashboard.css';

function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:5000/doctor/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false); 
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="doctor-dashboard">
      <h2>Scheduled Appointments</h2>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
          <p>Loading appointments...</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Summary</th>
              <th>Start</th>
              <th>End</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt, index) => (
              <tr key={index}>
                <td>{appt.summary}</td>
                <td>{new Date(appt.start.dateTime).toLocaleString()}</td>
                <td>{new Date(appt.end.dateTime).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DoctorDashboard;

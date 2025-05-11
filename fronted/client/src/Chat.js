import React, { useState } from 'react';
import axios from 'axios';
import './Chat.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function formatDateTime(datetimeStr) {
  const date = new Date(datetimeStr);
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function Chat() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendAppointmentRequest = async () => {
    if (isSubmitting) {
      toast.warning("Please wait, still processing your previous request.");
      return;
    }

    if (!start || !end) {
      toast.error("Please select both start and end time.");
      return;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate >= endDate) {
      toast.error("Start time must be before end time.");
      setMessages(prev => [...prev, {
        text: 'Start time must be before end time.',
        sender: 'bot'
      }]);
      return;
    }

    setIsSubmitting(true);
    toast.info("Checking availability...");

    const startWithTZ = start + ':00+03:00';
    const endWithTZ = end + ':00+03:00';

    const formattedStart = formatDateTime(start);
    const formattedEnd = formatDateTime(end);
    const userMsg = `I would like to book an appointment from ${formattedStart} to ${formattedEnd}`;
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);

    try {
      const res = await axios.post('http://127.0.0.1:5000/check_availability', {
        start: startWithTZ,
        end: endWithTZ
      });

      if (!res.data.available) {
        const reason = res.data.reason;

        if (reason === 'Outside working hours') {
          setMessages(prev => [...prev, {
            text: 'The clinic is closed during these hours. Please select a different time.',
            sender: 'bot'
          }]);
          toast.error("Clinic is closed during these hours.");

        } else if (reason === 'Appointment must be between 1 and 30 minutes long') {
          setMessages(prev => [...prev, {
            text: 'Appointments must be between 1 and 30 minutes long.',
            sender: 'bot'
          }]);
          toast.error("Appointment must be 1–30 minutes long.");

        } else if (reason === 'Cannot book in the past') {
          setMessages(prev => [...prev, {
            text: 'Cannot book appointments in the past.',
            sender: 'bot'
          }]);
          toast.error("Invalid time: Cannot book in the past.");

        } else if (reason === 'Time slot already booked') {
          setMessages(prev => [...prev, {
            text: 'This time slot is already taken. Please choose another one.',
            sender: 'bot'
          }]);
          toast.error("Time slot is already booked.");

        } else {
          setMessages(prev => [...prev, {
            text: 'Appointment could not be scheduled. Unknown reason.',
            sender: 'bot'
          }]);
          toast.error("Unknown error occurred.");
        }

        setIsSubmitting(false);
        return;
      }

      const book = await axios.post('http://127.0.0.1:5000/book_appointment', {
        start: startWithTZ,
        end: endWithTZ,
        summary: "Doctor Appointment"
      });

      if (book.data.eventId) {
        setMessages(prev => [...prev, {
          text: 'Your appointment has been successfully scheduled!',
          sender: 'bot'
        }]);
        toast.success("Appointment successfully scheduled!");
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        text: 'Server error. Please try again later.',
        sender: 'bot'
      }]);
      toast.error("Server error. Try again later.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">Appointment ChatBot</h2>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message-container ${msg.sender}`}>
            <div className={`message-bubble ${msg.sender}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="chat-controls">
        <label htmlFor="start" className="chat-label">Start Date & Time:</label>
        <input
          id="start"
          type="datetime-local"
          onChange={e => setStart(e.target.value)}
          className="chat-input"
          min={new Date().toISOString().slice(0, 16)}
        />

        <label htmlFor="end" className="chat-label">End Date & Time:</label>
        <input
          id="end"
          type="datetime-local"
          onChange={e => setEnd(e.target.value)}
          className="chat-input"
          min={new Date().toISOString().slice(0, 16)}
        />

        <button
          onClick={sendAppointmentRequest}
          className="chat-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Submit Request'}
        </button>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export default Chat;
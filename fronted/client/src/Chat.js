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
  const [email, setEmail] = useState('');
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

    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address.");
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

        let errorMsg = '';
        if (reason === 'Outside working hours') {
          errorMsg = 'The clinic is closed during these hours(Open on Sunday-Thursday:9:00-17:00,Fraiday:9:00-13:00). Please select a different time.';
        } else if (reason === 'Appointment must be between 1 and 30 minutes long') {
          errorMsg = 'Appointments must be between 1 and 30 minutes long.';
        } else if (reason === 'Cannot book in the past') {
          errorMsg = 'Cannot book appointments in the past.';
        } else if (reason === 'Time slot already booked') {
          errorMsg = 'This time slot is already taken. Please choose another one.';
        } else {
          errorMsg = 'Appointment could not be scheduled. Unknown reason.';
        }

        setMessages(prev => [...prev, { text: errorMsg, sender: 'bot' }]);
        toast.error(errorMsg);
        setIsSubmitting(false);
        return;
      }

    
      toast.info("Booking appointment and sending confirmation email...");

      const book = await axios.post('http://127.0.0.1:5000/book_and_notify', {
        start: startWithTZ,
        end: endWithTZ,
        summary: "Doctor Appointment",
        to: email
      });

      if (book.data.status === "Appointment booked and email sent.") {
        setMessages(prev => [...prev, {
          text: 'Your appointment has been successfully scheduled and a confirmation email was sent!',
          sender: 'bot'
        }]);
        toast.success("Appointment confirmed and email sent.");
      } else {
        setMessages(prev => [...prev, {
          text: 'Failed to book appointment. Try again later.',
          sender: 'bot'
        }]);
        toast.error("Booking failed.");
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
        <label htmlFor="email" className="chat-label">Your Email:</label>
        <small style={{ color: '#555', display: 'block', marginBottom: '8px' }}>
          Please enter your email address so we can send you a confirmation with the appointment date and time.
        </small>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="chat-input"
          placeholder="example@gmail.com"
          required
        />

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
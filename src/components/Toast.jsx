import { useEffect } from 'react';
import './Toast.css';

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 5000); // Se oculta solo después de 5 segundos

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      {/* Eliminamos el botón de la "X" aquí */}
    </div>
  );
}

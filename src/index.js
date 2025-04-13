import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Создаем корневой элемент для рендеринга приложения
const root = ReactDOM.createRoot(document.getElementById('root'));

// Рендерим приложение с включенным React StrictMode для поиска потенциальных проблем
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Функция для измерения производительности приложения (необязательно, если не нужно)
reportWebVitals();

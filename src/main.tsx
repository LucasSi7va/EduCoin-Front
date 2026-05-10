import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Importação necessária
import './index.css'
import { AcessibilidadeProvider } from './contexts/AcessibilidadeContext.tsx'
import App from './App.tsx'

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AcessibilidadeProvider>
        <App />
      </AcessibilidadeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
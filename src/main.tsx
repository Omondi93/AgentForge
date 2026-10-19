import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AgentPersonaProvider } from './context/AgentPersonaContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AuthProvider>
      <AgentPersonaProvider>
        <App />
      </AgentPersonaProvider>
    </AuthProvider>
  </ThemeProvider>
);

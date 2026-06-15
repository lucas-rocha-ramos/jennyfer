import React, { useState } from 'react';
import WhatsAppQR from './pages/WhatsAppQR';
import Personalidade from './pages/Personalidade';
import Conhecimento from './pages/Conhecimento';
import Catalogo from './pages/Catalogo';
import Usuarios from './pages/Usuarios';
import Avisos from './pages/Avisos';
import Galeria from './pages/Galeria';
import Tendencias from './pages/Tendencias';
import Analytics from './pages/Analytics';
import Memoria from './pages/Memoria';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const tabs = [
    { id: 'whatsapp', name: 'QR Code', icon: '📱', component: WhatsAppQR },
    { id: 'usuarios', name: 'Usuários', icon: '👥', component: Usuarios },
    { id: 'avisos', name: 'Avisos', icon: '📢', component: Avisos },
    { id: 'galeria', name: 'Galeria', icon: '🖼️', component: Galeria },
    { id: 'tendencias', name: 'Tendências', icon: '📈', component: Tendencias },
    { id: 'personalidade', name: 'Personalidade', icon: '🎭', component: Personalidade },
    { id: 'conhecimento', name: 'Conhecimento', icon: '📚', component: Conhecimento },
    { id: 'catalogo', name: 'Catálogo', icon: '🛍️', component: Catalogo },
    { id: 'analytics', name: 'Analytics', icon: '📊', component: Analytics },
    { id: 'memoria', name: 'Memória', icon: '🧠', component: Memoria }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || WhatsAppQR;

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: '#000000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '80px' : '280px',
        background: '#1c1c1e',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        padding: sidebarCollapsed ? '32px 12px' : '32px 20px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto',
        transition: 'all 0.3s ease',
        zIndex: 100
      }}>
        <div style={{ 
          marginBottom: '40px', 
          paddingLeft: sidebarCollapsed ? '0' : '12px',
          textAlign: sidebarCollapsed ? 'center' : 'left'
        }}>
          <div style={{
            width: sidebarCollapsed ? '40px' : '48px',
            height: sidebarCollapsed ? '40px' : '48px',
            background: 'linear-gradient(135deg, #ffffff, #8e8e93)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: sidebarCollapsed ? '0 auto 16px auto' : '0 0 16px 0',
            fontSize: '24px'
          }}>
            ✨
          </div>
          {!sidebarCollapsed && (
            <>
              <h1 style={{ 
                fontSize: '22px', 
                fontWeight: 600, 
                background: 'linear-gradient(135deg, #ffffff, #8e8e93)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '4px'
              }}>Jennyfer</h1>
              <p style={{ fontSize: '12px', color: '#8e8e93' }}>Consultora de Moda IA</p>
            </>
          )}
        </div>
        
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            width: '100%',
            padding: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#8e8e93',
            cursor: 'pointer',
            marginBottom: '24px',
            fontSize: '14px',
            textAlign: 'center'
          }}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
        
        <nav>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                padding: sidebarCollapsed ? '12px' : '12px 16px',
                marginBottom: '6px',
                background: activeTab === tab.id ? '#ffffff' : 'transparent',
                color: activeTab === tab.id ? '#000000' : '#8e8e93',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: sidebarCollapsed ? 'center' : 'left',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              {!sidebarCollapsed && <span>{tab.name}</span>}
            </button>
          ))}
        </nav>
      </div>
      
      <div style={{ 
        flex: 1, 
        padding: '32px 40px', 
        overflowY: 'auto',
        background: '#000000',
        color: '#ffffff',
        transition: 'all 0.3s ease'
      }}>
        <ActiveComponent apiUrl={API_URL} />
      </div>

      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            background: #000000;
            color: #ffffff;
          }
          
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #1c1c1e;
            border-radius: 10px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #3a3a3c;
            border-radius: 10px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #48484a;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .fade-in {
            animation: fadeIn 0.3s ease;
          }
        `}
      </style>
    </div>
  );
}

export default App;

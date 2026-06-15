import React, { useState, useEffect } from 'react';

export default function WhatsAppQR({ apiUrl }) {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/whatsapp/qr`);
        const data = await res.json();
        
        if (data.status === 'connected') {
          setStatus('connected');
          setQrCode(null);
        } else if (data.qr) {
          setQrCode(data.qr);
          setStatus('waiting');
        } else {
          setStatus('loading');
        }
      } catch (err) {
        setStatus('error');
      }
    };
    
    fetchQr();
    const interval = setInterval(fetchQr, 3000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const getQrImageUrl = (qrText) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrText)}`;
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>📱 Conectar WhatsApp</h1>
        <p style={{ color: '#8e8e93' }}>Escaneie o QR Code para conectar Jennyfer ao seu WhatsApp</p>
      </div>

      <div style={{
        background: '#1c1c1e',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {status === 'connected' && (
          <div style={{ background: 'rgba(52, 199, 89, 0.15)', padding: '20px', borderRadius: '14px', color: '#34c759', border: '1px solid rgba(52, 199, 89, 0.3)' }}>
            ✅ WhatsApp conectado com sucesso!
            <br />
            <span style={{ fontSize: '14px', marginTop: '10px', display: 'block', color: '#8e8e93' }}>
              Jennyfer está pronta para atender!
            </span>
          </div>
        )}
        
        {status === 'error' && (
          <div style={{ background: 'rgba(255, 59, 48, 0.15)', padding: '20px', borderRadius: '14px', color: '#ff3b30', border: '1px solid rgba(255, 59, 48, 0.3)' }}>
            ❌ Erro de conexão
            <br />
            <span style={{ fontSize: '14px', marginTop: '10px', display: 'block', color: '#8e8e93' }}>
              Verifique se o backend está rodando
            </span>
          </div>
        )}
        
        {status === 'loading' && !qrCode && (
          <div>
            <div className="spinner" style={{ margin: '20px auto' }} />
            <p style={{ color: '#8e8e93' }}>Aguardando QR Code...</p>
          </div>
        )}
        
        {qrCode && (
          <div>
            <div style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '16px',
              display: 'inline-block',
              marginBottom: '20px'
            }}>
              <img src={getQrImageUrl(qrCode)} alt="QR Code" style={{ width: '250px', height: '250px' }} />
            </div>
            <p style={{ color: '#8e8e93', fontSize: '14px', lineHeight: '1.6' }}>
              1. Abra o WhatsApp no seu celular<br />
              2. Toque em Menu ou Configurações<br />
              3. Selecione "WhatsApp Web"<br />
              4. Escaneie o QR Code acima
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

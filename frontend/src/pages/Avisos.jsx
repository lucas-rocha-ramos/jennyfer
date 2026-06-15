import React, { useState, useEffect } from 'react';

export default function Avisos({ apiUrl }) {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({ inscritos: 0, naoInscritos: 0, taxa: 0 });
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    titulo: '',
    mensagem: '',
    mediaType: 'text',
    mediaUrl: '',
    linkUrl: '',
    mediaData: null,
    imagePreview: null
  });

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
    checkWhatsApp();
  }, []);

  const checkWhatsApp = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/whatsapp/status`);
      const data = await res.json();
      setWhatsappConnected(data.isReady);
    } catch (error) {
      setWhatsappConnected(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/campaigns`);
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/dashboard/stats`);
      const data = await res.json();
      setStats({
        inscritos: data.inscritosAvisos || 0,
        naoInscritos: (data.totalUsuarios || 0) - (data.inscritosAvisos || 0),
        taxa: data.taxaAdesao || 0
      });
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCampaign({
          ...newCampaign,
          mediaData: reader.result,
          mediaType: 'image',
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewCampaign({
      ...newCampaign,
      mediaData: null,
      imagePreview: null
    });
  };

  const saveCampaign = async () => {
    if (!newCampaign.titulo || !newCampaign.mensagem) {
      alert('Preencha título e mensagem');
      return;
    }
    
    setSending(true);
    try {
      const url = `${apiUrl}/api/campaigns`;
      const method = 'POST';
      
      const payload = {
        titulo: newCampaign.titulo,
        mensagem: newCampaign.mensagem,
        link_url: newCampaign.linkUrl,
        media_data: newCampaign.mediaData,
        media_type: newCampaign.mediaType
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('✅ Campanha salva!');
        setShowModal(false);
        setNewCampaign({ titulo: '', mensagem: '', mediaType: 'text', mediaUrl: '', linkUrl: '', mediaData: null, imagePreview: null });
        fetchCampaigns();
      } else {
        alert('❌ Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao salvar');
    } finally {
      setSending(false);
    }
  };

  const sendCampaign = async (campaign) => {
    setSending(true);
    try {
      const res = await fetch(`${apiUrl}/api/campaigns/${campaign.id}/send`, { method: 'POST' });
      const result = await res.json();
      
      if (result.success) {
        alert(`✅ Campanha enviada para ${result.enviados} de ${result.total} usuários!`);
        fetchCampaigns();
      } else {
        alert(`⚠️ ${result.message}`);
      }
    } catch (error) {
      alert('❌ Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  const deleteCampaign = async (id) => {
    if (confirm('Excluir esta campanha?')) {
      try {
        await fetch(`${apiUrl}/api/campaigns/${id}`, { method: 'DELETE' });
        fetchCampaigns();
      } catch (error) {
        alert('Erro ao excluir');
      }
    }
  };

  const getMediaIcon = (campaign) => {
    if (campaign.media_data) return '🖼️';
    if (campaign.link_url) return '🔗';
    return '📝';
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>📢 Avisos e Campanhas</h1>
        <p style={{ color: '#8e8e93' }}>Gerencie e envie campanhas para seus usuários</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Inscritos</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#34c759' }}>{stats.inscritos}</p>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Não Inscritos</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#ff3b30' }}>{stats.naoInscritos}</p>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Taxa de Adesão</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#0a84ff' }}>{stats.taxa}%</p>
        </div>
      </div>

      {!whatsappConnected && (
        <div style={{ background: 'rgba(255, 149, 0, 0.15)', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', border: '1px solid rgba(255, 149, 0, 0.3)' }}>
          <span style={{ color: '#ff9f0a' }}>⚠️ WhatsApp não está conectado. Conecte na aba "QR Code" para enviar campanhas.</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: '#0a84ff', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 500 }}
        >
          + Nova Campanha
        </button>
      </div>

      <div style={{ background: '#1c1c1e', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#2c2c2e' }}>
          <span style={{ fontWeight: 600, color: '#ffffff' }}>Campanhas Criadas</span>
        </div>
        {campaigns.map(c => (
          <div key={c.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '28px' }}>{getMediaIcon(c)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>{c.titulo}</div>
                <div style={{ color: '#8e8e93', fontSize: '14px' }}>{c.mensagem.substring(0, 80)}...</div>
                {c.link_url && (
                  <a href={c.link_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#0a84ff', textDecoration: 'none' }}>
                    🔗 {c.link_url.substring(0, 50)}...
                  </a>
                )}
                {c.media_data && (
                  <img src={c.media_data} alt="Campaign" style={{ maxWidth: '60px', maxHeight: '60px', marginTop: '8px', borderRadius: '8px' }} />
                )}
                <div style={{ fontSize: '12px', color: '#636366', marginTop: '8px' }}>
                  {new Date(c.created_at).toLocaleDateString('pt-BR')} • {c.total_enviados || 0} enviados
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: c.status === 'enviada' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 149, 0, 0.15)', color: c.status === 'enviada' ? '#34c759' : '#ff9f0a' }}>
                  {c.status === 'enviada' ? '✓ Enviada' : '📝 Rascunho'}
                </span>
                <button onClick={() => deleteCampaign(c.id)} style={{ background: 'rgba(255, 59, 48, 0.15)', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', color: '#ff3b30' }}>🗑️</button>
                <button onClick={() => sendCampaign(c)} disabled={sending || !whatsappConnected} style={{ background: '#0a84ff', color: 'white', padding: '6px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', opacity: (sending || !whatsappConnected) ? 0.5 : 1 }}>
                  {c.status === 'enviada' ? '📤 Reenviar' : '📤 Enviar'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#636366' }}>
            <p style={{ fontSize: '16px' }}>Nenhuma campanha criada ainda</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Clique em "+ Nova Campanha" para começar</p>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', width: '500px', maxHeight: '80vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 600, color: '#ffffff' }}>📝 Nova Campanha</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Título</label>
              <input type="text" placeholder="Ex: Promoção de Verão" value={newCampaign.titulo} onChange={(e) => setNewCampaign({...newCampaign, titulo: e.target.value})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Mensagem</label>
              <textarea placeholder="Digite sua mensagem..." rows={4} value={newCampaign.mensagem} onChange={(e) => setNewCampaign({...newCampaign, mensagem: e.target.value})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Imagem (opcional)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '10px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
              {newCampaign.imagePreview && (
                <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                  <img src={newCampaign.imagePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }} />
                  <button onClick={removeImage} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff3b30', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer' }}>×</button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Link (opcional)</label>
              <input type="url" placeholder="https://exemplo.com/promocao" value={newCampaign.linkUrl} onChange={(e) => setNewCampaign({...newCampaign, linkUrl: e.target.value})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', color: '#8e8e93' }}>Cancelar</button>
              <button onClick={saveCampaign} disabled={sending} style={{ padding: '10px 20px', background: '#0a84ff', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>{sending ? 'Salvando...' : '💾 Salvar'}</button>
            </div>

            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,149,0,0.1)', borderRadius: '10px', fontSize: '12px', color: '#ff9f0a', textAlign: 'center' }}>
              📊 A campanha será enviada para {stats.inscritos} usuário(s) inscritos
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

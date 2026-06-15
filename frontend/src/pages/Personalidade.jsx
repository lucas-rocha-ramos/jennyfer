import React, { useState, useEffect } from 'react';

export default function Personalidade({ apiUrl }) {
  const [config, setConfig] = useState({
    nome: 'Jennyfer',
    tomVoz: 'amiga especialista em moda',
    formalidade: 'conversacional',
    emojis: '✨👗💕',
    promptBase: 'Ajude clientes com moda, looks e estilo.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/config/personalidade`);
      const data = await res.json();
      if (data && Object.keys(data).length > 0) setConfig(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch(`${apiUrl}/api/config/personalidade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('❌ Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>🎭 Personalidade</h1>
          <p style={{ color: '#8e8e93' }}>Carregando...</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>🎭 Personalidade</h1>
        <p style={{ color: '#8e8e93' }}>Configure o comportamento da Jennyfer</p>
      </div>

      {saved && (
        <div style={{ background: 'rgba(52, 199, 89, 0.15)', color: '#34c759', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', border: '1px solid rgba(52, 199, 89, 0.3)' }}>
          ✅ Configurações salvas com sucesso!
        </div>
      )}

      <div style={{ maxWidth: '700px' }}>
        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '28px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Nome do Agente</label>
            <input
              type="text"
              value={config.nome}
              onChange={(e) => setConfig({...config, nome: e.target.value})}
              style={{ width: '100%', padding: '14px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff', fontSize: '16px' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Tom de Voz</label>
            <textarea
              value={config.tomVoz}
              onChange={(e) => setConfig({...config, tomVoz: e.target.value})}
              rows={2}
              style={{ width: '100%', padding: '14px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Nível de Formalidade</label>
            <select
              value={config.formalidade}
              onChange={(e) => setConfig({...config, formalidade: e.target.value})}
              style={{ width: '100%', padding: '14px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }}
            >
              <option value="formal">Formal</option>
              <option value="conversacional">Conversacional</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Emojis (separados por espaço)</label>
            <input
              type="text"
              value={config.emojis}
              onChange={(e) => setConfig({...config, emojis: e.target.value})}
              style={{ width: '100%', padding: '14px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Prompt Base</label>
            <textarea
              value={config.promptBase}
              onChange={(e) => setConfig({...config, promptBase: e.target.value})}
              rows={4}
              style={{ width: '100%', padding: '14px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff', resize: 'vertical' }}
            />
          </div>

          <button
            onClick={saveConfig}
            disabled={saving}
            style={{ width: '100%', padding: '14px', background: '#0a84ff', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: 500, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Salvando...' : '💾 Salvar Configurações'}
          </button>
        </div>

        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(10, 132, 255, 0.1)', borderRadius: '12px', border: '1px solid rgba(10, 132, 255, 0.2)' }}>
          <p style={{ fontSize: '13px', color: '#0a84ff', textAlign: 'center' }}>
            ✨ Essas configurações afetam como Jennyfer se comunica com os usuários
          </p>
        </div>
      </div>
    </div>
  );
}

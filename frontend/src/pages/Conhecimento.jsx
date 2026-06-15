import React, { useState, useEffect } from 'react';

export default function Conhecimento({ apiUrl }) {
  const [knowledge, setKnowledge] = useState({ guides: [], trends: [], faqs: [] });
  const [newGuide, setNewGuide] = useState('');
  const [newTrend, setNewTrend] = useState('');
  const [newFaq, setNewFaq] = useState({ pergunta: '', resposta: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/config/conhecimento`);
      const data = await res.json();
      setKnowledge(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveKnowledge = async (data) => {
    try {
      await fetch(`${apiUrl}/api/config/conhecimento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchKnowledge();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const addGuide = () => {
    if (newGuide.trim()) {
      const newGuides = [...knowledge.guides, newGuide];
      saveKnowledge({ ...knowledge, guides: newGuides });
      setNewGuide('');
    }
  };

  const removeGuide = (index) => {
    const newGuides = knowledge.guides.filter((_, i) => i !== index);
    saveKnowledge({ ...knowledge, guides: newGuides });
  };

  const addTrend = () => {
    if (newTrend.trim()) {
      const newTrends = [...knowledge.trends, newTrend];
      saveKnowledge({ ...knowledge, trends: newTrends });
      setNewTrend('');
    }
  };

  const removeTrend = (index) => {
    const newTrends = knowledge.trends.filter((_, i) => i !== index);
    saveKnowledge({ ...knowledge, trends: newTrends });
  };

  const addFaq = () => {
    if (newFaq.pergunta.trim() && newFaq.resposta.trim()) {
      const newFaqs = [...knowledge.faqs, newFaq];
      saveKnowledge({ ...knowledge, faqs: newFaqs });
      setNewFaq({ pergunta: '', resposta: '' });
    }
  };

  const removeFaq = (index) => {
    const newFaqs = knowledge.faqs.filter((_, i) => i !== index);
    saveKnowledge({ ...knowledge, faqs: newFaqs });
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>📚 Base de Conhecimento</h1>
          <p style={{ color: '#8e8e93' }}>Carregando...</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>📚 Base de Conhecimento</h1>
        <p style={{ color: '#8e8e93' }}>Gerencie os guias, tendências e FAQs da Jennyfer</p>
      </div>

      {saved && (
        <div style={{ background: 'rgba(52, 199, 89, 0.15)', color: '#34c759', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', border: '1px solid rgba(52, 199, 89, 0.3)' }}>
          ✅ Conteúdo salvo com sucesso!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        {/* Guias de Moda */}
        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>📖 Guias de Moda</h2>
          <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            {knowledge.guides.map((guide, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#8e8e93' }}>{guide}</span>
                <button onClick={() => removeGuide(index)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
              </div>
            ))}
            {knowledge.guides.length === 0 && (
              <p style={{ color: '#636366', textAlign: 'center', padding: '20px' }}>Nenhum guia cadastrado</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Novo guia..."
              value={newGuide}
              onChange={(e) => setNewGuide(e.target.value)}
              style={{ flex: 1, padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }}
            />
            <button onClick={addGuide} style={{ background: '#0a84ff', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>+</button>
          </div>
        </div>

        {/* Tendências */}
        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>🔥 Tendências</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            {knowledge.trends.map((trend, index) => (
              <span key={index} style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93' }}>
                {trend}
                <button onClick={() => removeTrend(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff3b30', fontSize: '14px' }}>×</button>
              </span>
            ))}
            {knowledge.trends.length === 0 && (
              <p style={{ color: '#636366', textAlign: 'center', width: '100%', padding: '20px' }}>Nenhuma tendência cadastrada</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Nova tendência..."
              value={newTrend}
              onChange={(e) => setNewTrend(e.target.value)}
              style={{ flex: 1, padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }}
            />
            <button onClick={addTrend} style={{ background: '#0a84ff', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>+</button>
          </div>
        </div>

        {/* FAQs */}
        <div style={{ gridColumn: 'span 2', background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>❓ Perguntas Frequentes</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
            {knowledge.faqs.map((faq, index) => (
              <div key={index} style={{ marginBottom: '16px', padding: '16px', background: '#2c2c2e', borderRadius: '12px', position: 'relative' }}>
                <button onClick={() => removeFaq(index)} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#636366', fontSize: '16px' }}>🗑️</button>
                <p style={{ fontWeight: 600, marginBottom: '8px', color: '#ffffff', paddingRight: '30px' }}>{faq.pergunta}</p>
                <p style={{ color: '#8e8e93', fontSize: '14px' }}>{faq.resposta}</p>
              </div>
            ))}
            {knowledge.faqs.length === 0 && (
              <p style={{ color: '#636366', textAlign: 'center', padding: '30px' }}>Nenhuma FAQ cadastrada</p>
            )}
          </div>
          <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            <input
              type="text"
              placeholder="Pergunta"
              value={newFaq.pergunta}
              onChange={(e) => setNewFaq({...newFaq, pergunta: e.target.value})}
              style={{ padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }}
            />
            <input
              type="text"
              placeholder="Resposta"
              value={newFaq.resposta}
              onChange={(e) => setNewFaq({...newFaq, resposta: e.target.value})}
              style={{ padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }}
            />
            <button onClick={addFaq} style={{ background: '#0a84ff', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>+ Adicionar FAQ</button>
          </div>
        </div>
      </div>
    </div>
  );
}

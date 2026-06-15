import React, { useState, useEffect } from 'react';

export default function Galeria() {
  const [images, setImages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchImages();
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const fetchImages = async () => {
    setLoading(true);
    try {
      const url = selectedUser === 'all' 
        ? 'http://localhost:3001/api/images' 
        : `http://localhost:3001/api/images/user/${selectedUser}`;
      const res = await fetch(url);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>🖼️ Galeria</h1>
          <p style={{ color: '#8e8e93' }}>Carregando imagens...</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>🖼️ Galeria</h1>
        <p style={{ color: '#8e8e93' }}>Looks gerados pelos usuários</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{ padding: '10px 16px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }}
        >
          <option value="all">📱 Todos os usuários</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.nome || u.whatsapp_number}</option>
          ))}
        </select>
        <span style={{ color: '#8e8e93', fontSize: '14px' }}>{images.length} imagem(ns)</span>
      </div>

      {images.length === 0 ? (
        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '60px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</p>
          <p style={{ color: '#ffffff', fontSize: '18px', marginBottom: '8px' }}>Nenhuma imagem gerada ainda</p>
          <p style={{ color: '#8e8e93', fontSize: '14px' }}>Envie uma foto de roupa e peça "ver" para gerar imagens</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {images.map(img => (
            <div key={img.id} style={{ background: '#1c1c1e', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s ease' }}>
              <img 
                src={img.url_webp || img.url} 
                alt="Look gerado" 
                style={{ width: '100%', height: '220px', objectFit: 'cover' }} 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Erro'; }}
              />
              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff', marginBottom: '4px' }}>
                  {img.users?.nome || img.users?.whatsapp_number || 'Anônimo'}
                </div>
                <div style={{ fontSize: '11px', color: '#8e8e93' }}>
                  {new Date(img.created_at).toLocaleDateString('pt-BR')}
                </div>
                {img.estilo && (
                  <span style={{ display: 'inline-block', marginTop: '8px', padding: '2px 10px', background: 'rgba(10, 132, 255, 0.15)', borderRadius: '20px', fontSize: '10px', color: '#0a84ff' }}>
                    {img.estilo}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
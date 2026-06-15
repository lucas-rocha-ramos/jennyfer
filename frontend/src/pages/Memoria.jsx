import React, { useState, useEffect } from 'react';

export default function Memoria() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMemory();
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/users');
      const data = await res.json();
      setUsers(data);
      if (data.length > 0) setSelectedUser(data[0].id);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemory = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/memoria/${selectedUser}`);
      const data = await res.json();
      setMemory(data);
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>🧠 Memória</h1>
          <p style={{ color: '#8e8e93' }}>Carregando...</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>🧠 Memória Jennyfer</h1>
        <p style={{ color: '#8e8e93' }}>Contexto e preferências de cada usuário</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>👥 Usuários</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user.id)}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  background: selectedUser === user.id ? '#0a84ff' : 'rgba(255,255,255,0.05)',
                  color: selectedUser === user.id ? '#ffffff' : '#8e8e93',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontWeight: 500 }}>{user.nome || 'Anônimo'}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{user.whatsapp_number}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {memory ? (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>📌 Contexto do Usuário</h2>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#8e8e93' }}>✅ Peças Aprovadas</h3>
                {memory.approved_pieces?.length > 0 ? (
                  memory.approved_pieces.map((piece, i) => (
                    <div key={i} style={{ padding: '10px', background: 'rgba(52, 199, 89, 0.1)', borderRadius: '10px', marginBottom: '8px', color: '#34c759' }}>
                      {piece.tipo} {piece.cor} - {piece.estilo}
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#636366' }}>Nenhuma peça aprovada</p>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#8e8e93' }}>⏳ Peças Pendentes</h3>
                {memory.pending_pieces?.length > 0 ? (
                  memory.pending_pieces.map((piece, i) => (
                    <div key={i} style={{ padding: '10px', background: 'rgba(255, 149, 0, 0.1)', borderRadius: '10px', marginBottom: '8px', color: '#ff9f0a' }}>
                      {piece.tipo} {piece.cor} - {piece.estilo}
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#636366' }}>Nenhuma peça pendente</p>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#8e8e93' }}>🎨 Estilos Favoritos</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {memory.estilos_favoritos?.length > 0 ? (
                    memory.estilos_favoritos.map((estilo, i) => (
                      <span key={i} style={{ padding: '4px 12px', background: 'rgba(10, 132, 255, 0.15)', color: '#0a84ff', borderRadius: '20px', fontSize: '12px' }}>
                        {estilo}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: '#636366' }}>Nenhum estilo favorito</p>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#8e8e93' }}>🔄 Última Atualização</h3>
                <p style={{ color: '#8e8e93' }}>{formatDate(memory.updated_at)}</p>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#636366' }}>
              <p>Selecione um usuário para ver o histórico</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';

export default function Usuarios({ apiUrl }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/users`);
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch(status) {
      case 'aceitou': return { text: '✅ Aceitou', color: '#34c759', bg: 'rgba(52, 199, 89, 0.15)' };
      case 'recusou': return { text: '❌ Recusou', color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.15)' };
      default: return { text: '⏳ Pendente', color: '#ff9f0a', bg: 'rgba(255, 149, 0, 0.15)' };
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.whatsapp_number?.includes(search) || (user.nome || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'todos' || user.status_aviso === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>👥 Usuários</h1>
          <p style={{ color: '#8e8e93' }}>Carregando...</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>👥 Usuários</h1>
        <p style={{ color: '#8e8e93' }}>Gerencie seus contatos e preferências de avisos</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '12px 16px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#ffffff' }}
        >
          <option value="todos">Todos</option>
          <option value="aceitou">Aceitaram</option>
          <option value="recusou">Recusaram</option>
          <option value="nao_respondeu">Não responderam</option>
        </select>
      </div>

      <div style={{ background: '#1c1c1e', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#2c2c2e' }}>
          <span style={{ fontWeight: 600, color: '#ffffff' }}>Lista de Contatos</span>
          <span style={{ marginLeft: '12px', fontSize: '13px', color: '#8e8e93' }}>({filteredUsers.length} usuários)</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Contato</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Número</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Primeira Interação</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Última Interação</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const statusInfo = getStatusInfo(user.status_aviso);
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 500, color: '#ffffff' }}>{user.nome || 'Anônimo'}</td>
                    <td style={{ padding: '14px 16px', color: '#8e8e93', fontFamily: 'monospace', fontSize: '13px' }}>{user.whatsapp_number}</td>
                    <td style={{ padding: '14px 16px', color: '#8e8e93' }}>{new Date(user.primeira_interacao).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '14px 16px', color: '#8e8e93' }}>{new Date(user.ultima_interacao).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: statusInfo.bg, color: statusInfo.color }}>
                        {statusInfo.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#636366' }}>
            <p style={{ fontSize: '16px' }}>Nenhum usuário encontrado</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Tente ajustar os filtros ou aguarde novos contatos</p>
          </div>
        )}
      </div>
    </div>
  );
}

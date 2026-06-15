import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0a84ff', '#34c759', '#ff9f0a', '#ff3b30', '#5e5ce6', '#ff2d55', '#32ade6', '#af52de'];

export default function Tendencias() {
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [trendsRes, statsRes] = await Promise.all([
        fetch('http://localhost:3001/api/trends'),
        fetch('http://localhost:3001/api/dashboard/stats')
      ]);
      const trendsData = await trendsRes.json();
      const statsData = await statsRes.json();
      setTrends(trendsData);
      setStats(statsData);
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
          <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>📈 Tendências</h1>
          <p style={{ color: '#8e8e93' }}>Carregando...</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>📈 Tendências de Moda</h1>
        <p style={{ color: '#8e8e93' }}>Estilos e combinações mais solicitadas</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Total de Usuários</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0a84ff' }}>{stats.totalUsuarios || 0}</p>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Imagens Geradas</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#34c759' }}>{stats.totalImagensGeradas || 0}</p>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Looks Criados</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9f0a' }}>{stats.totalLooksGerados || 0}</p>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Taxa de Adesão</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff2d55' }}>{stats.taxaAdesao || 0}%</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#ffffff' }}>🔥 Estilos Mais Solicitados</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends.slice(0, 8)}>
              <XAxis dataKey="name" tick={{ fill: '#8e8e93' }} />
              <YAxis tick={{ fill: '#8e8e93' }} />
              <Tooltip contentStyle={{ background: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }} />
              <Bar dataKey="value" fill="#0a84ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#ffffff' }}>🎨 Distribuição de Estilos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trends.slice(0, 6)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {trends.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>🏆 Ranking de Estilos</h2>
        {trends.length > 0 ? (
          trends.slice(0, 10).map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: index === 0 ? '#ffd60a' : index === 1 ? '#8e8e93' : index === 2 ? '#cd7f32' : '#636366', width: '30px' }}>
                  {index + 1}
                </span>
                <span style={{ color: '#ffffff' }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '150px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(item.value / (trends[0]?.value || 1)) * 100}%`, height: '100%', background: '#0a84ff', borderRadius: '3px' }} />
                </div>
                <span style={{ fontWeight: 600, color: '#0a84ff' }}>{item.value}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#636366' }}>
            <p>Nenhuma tendência registrada ainda</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Peça sugestões de look para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [stats, setStats] = useState({});
  const [trends, setTrends] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, trendsRes, imagesRes] = await Promise.all([
        fetch('http://localhost:3001/api/dashboard/stats'),
        fetch('http://localhost:3001/api/trends'),
        fetch('http://localhost:3001/api/images')
      ]);
      const statsData = await statsRes.json();
      const trendsData = await trendsRes.json();
      const imagesData = await imagesRes.json();
      setStats(statsData);
      setTrends(trendsData);
      setImages(imagesData);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const imagesByDay = {};
  images.forEach(img => {
    const day = new Date(img.created_at).toLocaleDateString('pt-BR');
    imagesByDay[day] = (imagesByDay[day] || 0) + 1;
  });
  const chartData = Object.entries(imagesByDay).slice(-30).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>📊 Analytics</h1>
          <p style={{ color: '#8e8e93' }}>Carregando...</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>📊 Analytics</h1>
        <p style={{ color: '#8e8e93' }}>Métricas e indicadores de desempenho</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Total de Usuários</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0a84ff' }}>{stats.totalUsuarios || 0}</p>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Usuários Ativos</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#34c759' }}>{stats.usuariosAtivos || 0}</p>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Imagens Geradas</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9f0a' }}>{stats.totalImagensGeradas || 0}</p>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: '#8e8e93', fontSize: '14px', marginBottom: '8px' }}>Looks Criados</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#5e5ce6' }}>{stats.totalLooksGerados || 0}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#ffffff' }}>📈 Imagens por Dia</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#8e8e93' }} />
                <YAxis tick={{ fill: '#8e8e93' }} />
                <Tooltip contentStyle={{ background: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }} />
                <Line type="monotone" dataKey="value" stroke="#0a84ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#636366' }}>Aguardando dados</div>
          )}
        </div>

        <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: '#ffffff' }}>🔥 Top Estilos</h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends.slice(0, 5)}>
                <XAxis dataKey="name" tick={{ fill: '#8e8e93' }} />
                <YAxis tick={{ fill: '#8e8e93' }} />
                <Tooltip contentStyle={{ background: '#1c1c1e', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }} />
                <Bar dataKey="value" fill="#34c759" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#636366' }}>Aguardando dados</div>
          )}
        </div>
      </div>

      <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#ffffff' }}>📋 Métricas Detalhadas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <p style={{ color: '#8e8e93', marginBottom: '4px' }}>Usuários Inativos</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff3b30' }}>{stats.usuariosInativos || 0}</p>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <p style={{ color: '#8e8e93', marginBottom: '4px' }}>Inscritos Avisos</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#34c759' }}>{stats.inscritosAvisos || 0}</p>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <p style={{ color: '#8e8e93', marginBottom: '4px' }}>Taxa de Adesão</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9f0a' }}>{stats.taxaAdesao || 0}%</p>
          </div>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <p style={{ color: '#8e8e93', marginBottom: '4px' }}>Média Looks/Usuário</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0a84ff' }}>{stats.totalUsuarios ? ((stats.totalLooksGerados || 0) / stats.totalUsuarios).toFixed(1) : 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
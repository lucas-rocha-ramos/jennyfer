import React, { useState, useEffect } from 'react';

export default function Catalogo() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    colors: [],
    style_tags: [],
    image_url: '',
    link: '',
    stock: 0,
    active: true
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/catalogo');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
      const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageDataUrl = reader.result;
        setImagePreview(imageDataUrl);
        setForm({ ...form, image_url: imageDataUrl });
        
        setAnalyzing(true);
        try {
          const res = await fetch('http://localhost:3001/api/catalogo/analisar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageDataUrl })
          });
          const data = await res.json();
          if (data.analise) {
            const analise = data.analise;
            setForm(prev => ({
              ...prev,
              style_tags: analise.tags || analise.ocasioes || [],
              colors: analise.cores || [],
              description: analise.descricao || prev.description
            }));
          }
        } catch (error) {
          console.error('Erro na análise:', error);
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProduct = async () => {
    if (!form.name) {
      alert('Preencha o nome do produto');
      return;
    }
    
    setLoading(true);
    try {
      const url = editingProduct 
        ? `http://localhost:3001/api/catalogo/${editingProduct.id}`
        : 'http://localhost:3001/api/catalogo';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        alert(editingProduct ? '✅ Produto atualizado!' : '✅ Produto adicionado!');
        setShowModal(false);
        resetForm();
        fetchProducts();
      } else {
        alert('❌ Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (confirm('Excluir este produto?')) {
      try {
        await fetch(`http://localhost:3001/api/catalogo/${id}`, { method: 'DELETE' });
        fetchProducts();
      } catch (error) {
        alert('Erro ao excluir');
      }
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      category: product.category || '',
      price: product.price || '',
      description: product.description || '',
      colors: product.colors || [],
      style_tags: product.style_tags || [],
      image_url: product.image_url || '',
      link: product.link || '',
      stock: product.stock || 0,
      active: product.active !== undefined ? product.active : true
    });
    setImagePreview(product.image_url);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category: '',
      price: '',
      description: '',
      colors: [],
      style_tags: [],
      image_url: '',
      link: '',
      stock: 0,
      active: true
    });
    setImagePreview(null);
  };

  if (loading && products.length === 0) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>🛍️ Catálogo</h1>
          <p style={{ color: '#8e8e93' }}>Carregando produtos...</p>
        </div>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 600, marginBottom: '8px', color: '#ffffff' }}>🛍️ Catálogo</h1>
        <p style={{ color: '#8e8e93' }}>Gerencie os produtos recomendados por Jennyfer</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          style={{ background: '#0a84ff', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 500 }}
        >
          + Novo Produto
        </button>
      </div>

      <div style={{ background: '#1c1c1e', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#2c2c2e' }}>
          <span style={{ fontWeight: 600, color: '#ffffff' }}>Produtos Cadastrados</span>
          <span style={{ marginLeft: '12px', fontSize: '13px', color: '#8e8e93' }}>({products.length} produtos)</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Imagem</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Produto</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Categoria</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Preço</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Estoque</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: '#8e8e93', fontWeight: 500 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '8px' }} />}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#ffffff' }}>{p.name}</td>
                  <td style={{ padding: '12px 16px', color: '#8e8e93' }}>{p.category || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#0a84ff', fontWeight: 500 }}>{p.price || '-'}</td>
                  <td style={{ padding: '12px 16px', color: '#8e8e93' }}>{p.stock}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: p.active ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)', color: p.active ? '#34c759' : '#ff3b30' }}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => editProduct(p)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', marginRight: '8px', color: '#8e8e93' }}>✏️</button>
                    <button onClick={() => deleteProduct(p.id)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#ff3b30' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#636366' }}>
            <p style={{ fontSize: '16px' }}>Nenhum produto cadastrado</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Clique em "+ Novo Produto" para começar</p>
          </div>
        )}
      </div>

      {/* Modal Novo/Editar Produto */}
      {showModal && (
        <div className="modal-backdrop">
          <div style={{ background: '#1c1c1e', borderRadius: '20px', padding: '24px', width: '550px', maxHeight: '80vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 600, color: '#ffffff' }}>{editingProduct ? '✏️ Editar' : '📝 Novo'} Produto</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Nome *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Categoria</label>
              <input type="text" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} list="categories" />
              <datalist id="categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Preço</label>
              <input type="text" placeholder="R$ 199,90" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Descrição</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Cores (separadas por vírgula)</label>
              <input type="text" value={form.colors?.join(', ') || ''} onChange={(e) => setForm({...form, colors: e.target.value.split(',').map(c => c.trim())})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Tags/Estilos (separadas por vírgula)</label>
              <input type="text" value={form.style_tags?.join(', ') || ''} onChange={(e) => setForm({...form, style_tags: e.target.value.split(',').map(t => t.trim())})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Imagem</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '10px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
              {analyzing && <p style={{ fontSize: '12px', color: '#0a84ff', marginTop: '5px' }}>🔍 Analisando imagem...</p>}
              {imagePreview && <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', marginTop: '12px', borderRadius: '8px' }} />}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Link do Produto</label>
              <input type="url" placeholder="https://..." value={form.link} onChange={(e) => setForm({...form, link: e.target.value})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#8e8e93' }}>Estoque</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#ffffff' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93' }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({...form, active: e.target.checked})} />
                Produto ativo
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', color: '#8e8e93' }}>Cancelar</button>
              <button onClick={saveProduct} disabled={loading} style={{ padding: '10px 20px', background: '#0a84ff', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                {loading ? 'Salvando...' : '💾 Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
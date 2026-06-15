// backend/src/api/routes.js
import { initDatabase } from '../database/supabase.js';
import { 
  getAllUsers, getUsersByStatus, updateUserStatus,
  getAllImages, getUserImages, getImagesByEstilo,
  getTrends, getDashboardStats, getEstilosMaisUsados, getTendenciasLooks,
  createCampaign, getAllCampaigns, updateCampaignStatus,
  getCatalog, addProduct, updateProduct, deleteProduct, getProductById, updateProductAnalysis, buscarProdutosPorCaracteristicas,
  getUserMemory, updateUserMemory, addApprovedPiece, addEstiloFavorito,
  getConfig, setConfig
} from '../database/supabase.js';
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;

export function setupRoutes(app) {
  
  // ============================================
  // USUÁRIOS
  // ============================================
  
  app.get('/api/users', async (req, res) => {
    try {
      const { data, error } = await getAllUsers();
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('Erro GET /api/users:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/users/status/:status', async (req, res) => {
    try {
      const { data, error } = await getUsersByStatus(req.params.status);
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('Erro GET /api/users/status:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put('/api/users/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const { error } = await updateUserStatus(req.params.id, status);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error('Erro PUT /api/users/:id/status:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ============================================
  // AVISOS E CAMPANHAS
  // ============================================
  
  app.get('/api/campaigns', async (req, res) => {
    try {
      const { data, error } = await getAllCampaigns();
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('Erro GET /api/campaigns:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/campaigns', async (req, res) => {
    try {
      const { titulo, mensagem, mediaUrl, mediaType, linkUrl, mediaData } = req.body;
      const { data, error } = await createCampaign(titulo, mensagem, mediaUrl, mediaType, linkUrl, mediaData);
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Erro POST /api/campaigns:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put('/api/campaigns/:id', async (req, res) => {
    try {
      const { supabase } = await initDatabase();
      const { titulo, mensagem, mediaUrl, mediaType, linkUrl, mediaData } = req.body;
      const { data, error } = await supabase
        .from('campaigns')
        .update({ 
          titulo, mensagem, media_url: mediaUrl, media_type: mediaType, 
          link_url: linkUrl, media_data: mediaData, updated_at: new Date()
        })
        .eq('id', req.params.id)
        .select();
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Erro PUT /api/campaigns/:id:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete('/api/campaigns/:id', async (req, res) => {
    try {
      const { supabase } = await initDatabase();
      const { error } = await supabase.from('campaigns').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error('Erro DELETE /api/campaigns/:id:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/campaigns/:id/send', async (req, res) => {
    try {
      const { supabase } = await initDatabase();
      
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', req.params.id)
        .single();
      
      if (campaignError) throw campaignError;
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, whatsapp_number, nome')
        .eq('status_aviso', 'aceitou');
      
      if (usersError) throw usersError;
      
      const total = users?.length || 0;
      let enviados = 0;
      let falhas = 0;
      
      if (total === 0) {
        return res.json({ success: false, message: 'Nenhum usuário inscrito' });
      }
      
      const { getWhatsAppClient } = await import('../whatsapp/client.js');
      const { client, isReady } = getWhatsAppClient();
      
      if (!isReady || !client) {
        return res.json({ success: false, message: 'WhatsApp não conectado' });
      }
      
      console.log(`📤 Enviando "${campaign.titulo}" para ${total} usuários...`);
      
      let mensagemCompleta = `📢 *${campaign.titulo}*\n\n${campaign.mensagem}\n\n`;
      if (campaign.link_url) mensagemCompleta += `🔗 ${campaign.link_url}\n\n`;
      mensagemCompleta += `✨ Jennyfer - Moda IA`;
      
      for (const user of users) {
        try {
          if (campaign.media_data) {
            const base64Data = campaign.media_data.split(',')[1] || campaign.media_data;
            const media = new MessageMedia('image/jpeg', base64Data);
            await client.sendMessage(user.whatsapp_number, media, { caption: mensagemCompleta });
          } else {
            await client.sendMessage(user.whatsapp_number, mensagemCompleta);
          }
          enviados++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
          falhas++;
          console.error(`❌ Erro: ${user.whatsapp_number}`, err.message);
        }
      }
      
      await supabase
        .from('campaigns')
        .update({ status: 'enviada', total_enviados: enviados, total_entregues: enviados, enviada_em: new Date() })
        .eq('id', req.params.id);
      
      res.json({ success: true, total, enviados, falhas });
      
    } catch (error) {
      console.error('Erro:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ============================================
  // GALERIA
  // ============================================
  
  app.get('/api/images', async (req, res) => {
    try {
      const { data, error } = await getAllImages();
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('Erro GET /api/images:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/images/user/:userId', async (req, res) => {
    try {
      const { data, error } = await getUserImages(req.params.userId);
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('Erro GET /api/images/user/:userId:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/images/estilo/:estilo', async (req, res) => {
    try {
      const { data, error } = await getImagesByEstilo(req.params.estilo);
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('Erro GET /api/images/estilo/:estilo:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ============================================
  // TENDÊNCIAS E ESTATÍSTICAS
  // ============================================
  
  app.get('/api/trends', async (req, res) => {
    try {
      const { data, error } = await getTendenciasLooks(30);
      if (error) throw error;
      
      const trends = (data || []).map(item => ({ 
        name: item.valor?.substring(0, 60) || item.valor, 
        value: parseInt(item.quantidade),
        detalhes: item.detalhes
      }));
      
      console.log(`📊 ${trends.length} tendências encontradas`);
      res.json(trends);
    } catch (error) {
      console.error('Erro GET /api/trends:', error);
      res.json([]);
    }
  });
  
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Erro GET /api/dashboard/stats:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ============================================
  // CONFIGURAÇÕES
  // ============================================
  
  app.get('/api/config/personalidade', async (req, res) => {
    try {
      const config = await getConfig('personality');
      res.json(config || { nome: 'Jennyfer', tomVoz: 'amiga especialista', formalidade: 'conversacional', emojis: '✨👗💕' });
    } catch (error) {
      res.json({ nome: 'Jennyfer', tomVoz: 'amiga especialista' });
    }
  });
  
  app.post('/api/config/personalidade', async (req, res) => {
    try {
      await setConfig('personality', req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro POST /api/config/personalidade:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/config/conhecimento', async (req, res) => {
    try {
      const config = await getConfig('knowledge');
      res.json(config || { guides: [], trends: [], faqs: [] });
    } catch (error) {
      res.json({ guides: [], trends: [], faqs: [] });
    }
  });
  
  app.post('/api/config/conhecimento', async (req, res) => {
    try {
      await setConfig('knowledge', req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro POST /api/config/conhecimento:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ============================================
  // CATÁLOGO
  // ============================================
  
  app.get('/api/catalogo', async (req, res) => {
    try {
      const { data, error } = await getCatalog();
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      console.error('Erro GET /api/catalogo:', error);
      res.json([]);
    }
  });
  
  app.post('/api/catalogo/analisar', async (req, res) => {
    try {
      const { imageDataUrl } = req.body;
      const { analisarImagemProduto } = await import('../utils/analisarImagemProduto.js');
      const analise = await analisarImagemProduto(imageDataUrl);
      res.json({ analise });
    } catch (error) {
      console.error('Erro na análise:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/catalogo', async (req, res) => {
    try {
      const { data, error } = await addProduct(req.body);
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      console.error('Erro POST /api/catalogo:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put('/api/catalogo/:id', async (req, res) => {
    try {
      const { data, error } = await updateProduct(req.params.id, req.body);
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      console.error('Erro PUT /api/catalogo/:id:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete('/api/catalogo/:id', async (req, res) => {
    try {
      const { error } = await deleteProduct(req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      console.error('Erro DELETE /api/catalogo/:id:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get('/api/catalogo/buscar/:termo', async (req, res) => {
    try {
      const produtos = await buscarProdutosPorCaracteristicas(req.params.termo);
      res.json(produtos);
    } catch (error) {
      console.error('Erro GET /api/catalogo/buscar/:termo:', error);
      res.json([]);
    }
  });
  
  // ============================================
  // MEMÓRIA
  // ============================================
  
  app.get('/api/memoria/:userId', async (req, res) => {
    try {
      const memory = await getUserMemory(req.params.userId);
      res.json(memory);
    } catch (error) {
      console.error('Erro GET /api/memoria/:userId:', error);
      res.json({ pending_pieces: [], approved_pieces: [], estilos_favoritos: [] });
    }
  });
  
  app.post('/api/memoria/:userId/approved', async (req, res) => {
    try {
      const { piece } = req.body;
      await addApprovedPiece(req.params.userId, piece);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro POST /api/memoria/:userId/approved:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post('/api/memoria/:userId/estilo', async (req, res) => {
    try {
      const { estilo } = req.body;
      await addEstiloFavorito(req.params.userId, estilo);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro POST /api/memoria/:userId/estilo:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // ============================================
  // WHATSAPP
  // ============================================
  
  app.get('/api/whatsapp/qr', async (req, res) => {
    try {
      const { getQrCode, getStatus } = await import('../whatsapp/client.js');
      const qr = getQrCode();
      const status = getStatus();
      
      if (status.isReady) {
        res.json({ qr: null, status: 'connected' });
      } else if (qr) {
        res.json({ qr: qr, status: 'waiting' });
      } else {
        res.json({ qr: null, status: 'loading' });
      }
    } catch (error) {
      res.json({ qr: null, status: 'error' });
    }
  });
  
  app.get('/api/whatsapp/status', async (req, res) => {
    try {
      const { getStatus } = await import('../whatsapp/client.js');
      const status = getStatus();
      res.json({ isReady: status.isReady, hasQr: status.hasQr });
    } catch (error) {
      res.json({ isReady: false, hasQr: false });
    }
  });
  
  // ============================================
  // HEALTH CHECK
  // ============================================
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Jennyfer Backend', timestamp: new Date().toISOString() });
  });
}
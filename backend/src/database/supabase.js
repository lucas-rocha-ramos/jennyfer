// backend/src/database/supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let supabaseInstance = null;

export async function initDatabase() {
  if (supabaseInstance) {
    return { supabase: supabaseInstance };
  }
  
  supabaseInstance = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  return { supabase: supabaseInstance };
}

// ============================================
// USUÁRIOS
// ============================================

export async function getOrCreateUser(whatsappNumber, nome = null) {
  const { supabase } = await initDatabase();
  
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('whatsapp_number', whatsappNumber)
    .maybeSingle();
  
  if (!user) {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ 
        whatsapp_number: whatsappNumber, 
        nome: nome,
        primeira_interacao: new Date(),
        ultima_interacao: new Date(),
        status_aviso: 'nao_respondeu'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar usuário:', error);
      return null;
    }
    
    console.log(`✅ Novo usuário cadastrado: ${whatsappNumber}`);
    return newUser;
  }
  
  await supabase
    .from('users')
    .update({ ultima_interacao: new Date() })
    .eq('id', user.id);
  
  return user;
}

export async function updateUserStatus(userId, statusAviso) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('users')
    .update({ 
      status_aviso: statusAviso,
      data_resposta_aviso: new Date()
    })
    .eq('id', userId);
}

export async function getAllUsers() {
  const { supabase } = await initDatabase();
  return await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function getUsersByStatus(status) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('users')
    .select('*')
    .eq('status_aviso', status);
}

export async function getUserLastInteraction(userId) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('conversations')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
}

// ============================================
// CONVERSAS
// ============================================

export async function saveMessage(userId, tipo, conteudo, metadata = {}) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      tipo: tipo,
      conteudo: conteudo,
      metadata: metadata,
      created_at: new Date()
    });
}

// ============================================
// IMAGENS (GALERIA)
// ============================================

export async function saveImage(userId, url, urlWebp, prompt, lookSuggestion, estilo, tags = [], analiseDetalhada = null) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('images')
    .insert({
      user_id: userId,
      url: url,
      url_webp: urlWebp,
      prompt: prompt,
      look_suggestion: lookSuggestion,
      estilo: estilo,
      tags: tags,
      analise_detalhada: analiseDetalhada,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });
}

export async function getUserImages(userId) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function getAllImages() {
  const { supabase } = await initDatabase();
  return await supabase
    .from('images')
    .select('*, users(whatsapp_number, nome)')
    .order('created_at', { ascending: false });
}

export async function getImagesByEstilo(estilo) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('images')
    .select('*, users(whatsapp_number, nome)')
    .eq('estilo', estilo)
    .order('created_at', { ascending: false });
}

// ============================================
// ESTATÍSTICAS (TENDÊNCIAS)
// ============================================

export async function recordStat(tipo, valor, categoria = null, subcategoria = null, detalhes = null) {
  const { supabase } = await initDatabase();
  
  const hoje = new Date().toISOString().split('T')[0];
  
  const { data: existing } = await supabase
    .from('stats')
    .select('*')
    .eq('tipo', tipo)
    .eq('valor', valor)
    .eq('data_referencia', hoje)
    .maybeSingle();
  
  if (existing) {
    return await supabase
      .from('stats')
      .update({ quantidade: existing.quantidade + 1 })
      .eq('id', existing.id);
  } else {
    return await supabase
      .from('stats')
      .insert({ 
        tipo: tipo, 
        valor: valor, 
        quantidade: 1, 
        data_referencia: hoje,
        categoria: categoria,
        subcategoria: subcategoria,
        detalhes: detalhes
      });
  }
}

export async function recordTendenciaLook(peça, cor, tecido, modelagem, estilo, ocasião) {
  const descricao = `${peça} - ${cor} - ${tecido} - ${modelagem}`;
  return await recordStat('tendencia_look', descricao, 'look', estilo, {
    peça, cor, tecido, modelagem, estilo, ocasião
  });
}

export async function getTrends(days = 30) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('stats')
    .select('*')
    .gte('data_referencia', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('quantidade', { ascending: false });
}

export async function getTendenciasLooks(days = 30) {
  const { supabase } = await initDatabase();
  
  const { data, error } = await supabase
    .from('stats')
    .select('*')
    .eq('tipo', 'tendencia_look')
    .gte('data_referencia', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('quantidade', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar tendências de looks:', error);
    return { data: [] };
  }
  
  const agrupado = {};
  data?.forEach(item => {
    if (!agrupado[item.valor]) {
      agrupado[item.valor] = {
        valor: item.valor,
        quantidade: 0,
        detalhes: item.detalhes,
        ultima_data: item.data_referencia
      };
    }
    agrupado[item.valor].quantidade += item.quantidade;
  });
  
  const resultado = Object.values(agrupado).sort((a, b) => b.quantidade - a.quantidade);
  
  return { data: resultado };
}

export async function getEstilosMaisUsados() {
  const { supabase } = await initDatabase();
  
  const { data, error } = await supabase
    .from('images')
    .select('estilo')
    .not('estilo', 'is', null);
  
  if (error) {
    console.error('Erro ao buscar estilos:', error);
    return { data: [] };
  }
  
  const contagem = {};
  data?.forEach(item => {
    const estilo = item.estilo;
    if (estilo) {
      contagem[estilo] = (contagem[estilo] || 0) + 1;
    }
  });
  
  const resultado = Object.entries(contagem).map(([estilo, count]) => ({
    estilo,
    count
  })).sort((a, b) => b.count - a.count);
  
  return { data: resultado };
}

export async function getDashboardStats() {
  const { supabase } = await initDatabase();
  
  const [totalUsers, activeUsers, imagesGenerated, acceptedAvisos] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('ultima_interacao', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('images').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status_aviso', 'aceitou')
  ]);
  
  const { data: lookStats } = await supabase
    .from('stats')
    .select('quantidade')
    .eq('tipo', 'tendencia_look');
  
  const totalLooks = lookStats?.reduce((sum, item) => sum + (item.quantidade || 0), 0) || 0;
  
  return {
    totalUsuarios: totalUsers.count || 0,
    usuariosAtivos: activeUsers.count || 0,
    usuariosInativos: (totalUsers.count || 0) - (activeUsers.count || 0),
    totalImagensGeradas: imagesGenerated.count || 0,
    inscritosAvisos: acceptedAvisos.count || 0,
    taxaAdesao: totalUsers.count ? ((acceptedAvisos.count / totalUsers.count) * 100).toFixed(1) : 0,
    totalLooksGerados: totalLooks
  };
}

// ============================================
// CAMPANHAS
// ============================================

export async function createCampaign(titulo, mensagem, mediaUrl = null, mediaType = 'text', linkUrl = null, mediaData = null) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('campaigns')
    .insert({ 
      titulo: titulo, 
      mensagem: mensagem,
      media_url: mediaUrl,
      media_type: mediaType,
      link_url: linkUrl,
      media_data: mediaData
    })
    .select();
}

export async function getAllCampaigns() {
  const { supabase } = await initDatabase();
  return await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function updateCampaignStatus(id, status, enviados, entregues) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('campaigns')
    .update({ 
      status: status, 
      total_enviados: enviados, 
      total_entregues: entregues,
      enviada_em: new Date()
    })
    .eq('id', id);
}

// ============================================
// CATÁLOGO
// ============================================

export async function getCatalog() {
  const { supabase } = await initDatabase();
  return await supabase
    .from('catalog')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function addProduct(product) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('catalog')
    .insert(product)
    .select();
}

export async function updateProduct(id, product) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('catalog')
    .update({ ...product, updated_at: new Date() })
    .eq('id', id)
    .select();
}

export async function deleteProduct(id) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('catalog')
    .delete()
    .eq('id', id);
}

export async function getProductById(id) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('catalog')
    .select('*')
    .eq('id', id)
    .single();
}

export async function updateProductAnalysis(id, analiseImagem, tagsAnalise, coresAnalise, estiloAnalise, ocasioesAnalise) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('catalog')
    .update({ 
      analise_imagem: analiseImagem,
      tags_analise: tagsAnalise,
      cores_analise: coresAnalise,
      estilo_analise: estiloAnalise,
      ocasioes_analise: ocasioesAnalise,
      updated_at: new Date()
    })
    .eq('id', id);
}

export async function buscarProdutosPorCaracteristicas(caracteristicas) {
  const { supabase } = await initDatabase();
  const { data: produtos } = await supabase
    .from('catalog')
    .select('*')
    .eq('active', true);
  
  if (!produtos) return [];
  
  const consultaLower = caracteristicas.toLowerCase();
  
  const filtrados = produtos.filter(produto => {
    const tagsMatch = produto.tags_analise?.some(tag => 
      consultaLower.includes(tag.toLowerCase())
    );
    const estiloMatch = produto.estilo_analise?.toLowerCase().includes(consultaLower);
    const coresMatch = produto.cores_analise?.some(cor => 
      consultaLower.includes(cor.toLowerCase())
    );
    const nomeMatch = produto.name?.toLowerCase().includes(consultaLower);
    const descMatch = produto.description?.toLowerCase().includes(consultaLower);
    
    return tagsMatch || estiloMatch || coresMatch || nomeMatch || descMatch;
  });
  
  return filtrados;
}

// ============================================
// MEMÓRIA
// ============================================

export async function getUserMemory(userId) {
  const { supabase } = await initDatabase();
  const { data, error } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar memória:', error);
  }
  
  return data || {
    pending_pieces: [],
    approved_pieces: [],
    estilos_favoritos: []
  };
}

export async function updateUserMemory(userId, memory) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('user_memory')
    .upsert({ 
      user_id: userId, 
      ...memory,
      updated_at: new Date()
    });
}

export async function addApprovedPiece(userId, piece) {
  const memory = await getUserMemory(userId);
  const approvedPieces = [...(memory.approved_pieces || []), piece];
  return await updateUserMemory(userId, { approved_pieces: approvedPieces });
}

export async function addEstiloFavorito(userId, estilo) {
  const memory = await getUserMemory(userId);
  const estilos = [...(memory.estilos_favoritos || []), estilo];
  const uniqueEstilos = [...new Set(estilos)];
  return await updateUserMemory(userId, { estilos_favoritos: uniqueEstilos });
}

// ============================================
// CONFIGURAÇÕES
// ============================================

export async function getConfig(key) {
  const { supabase } = await initDatabase();
  const { data } = await supabase
    .from('config')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || null;
}

export async function setConfig(key, value) {
  const { supabase } = await initDatabase();
  return await supabase
    .from('config')
    .upsert({ key: key, value: value, updated_at: new Date() });
}
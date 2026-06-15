// backend/src/utils/searxng.js
import axios from 'axios';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

// Buscar qualquer informação no Tavily via API REST
export async function buscarNoTavily(consulta) {
  if (!TAVILY_API_KEY || TAVILY_API_KEY === 'tvly-sua_chave_aqui') {
    console.error('❌ TAVILY_API_KEY não configurada no .env');
    return null;
  }

  try {
    const cacheKey = consulta.toLowerCase().trim();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📦 Cache hit para: ${consulta}`);
      return cached.data;
    }

    console.log(`🔍 Buscando no Tavily: ${consulta}`);
    
    const response = await axios.post(TAVILY_API_URL, {
      query: consulta,
      search_depth: 'basic',
      include_answer: true,
      include_raw_content: false,
      max_results: 5
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      timeout: 10000
    });
    
    const data = response.data;
    
    const resultados = {
      consulta: consulta,
      respostas: [],
      temResposta: false
    };
    
    // Resposta direta da Tavily
    if (data.answer && data.answer.length > 0) {
      resultados.respostas.push({
        tipo: 'resposta_direta',
        conteudo: data.answer,
        fonte: 'Tavily'
      });
      resultados.temResposta = true;
    }
    
    // Resultados da busca
    if (data.results && data.results.length > 0) {
      for (const result of data.results.slice(0, 5)) {
        if (result.content && result.content.length > 0) {
          resultados.respostas.push({
            tipo: 'resultado',
            titulo: result.title || 'Resultado',
            conteudo: result.content.substring(0, 500),
            url: result.url,
            pontuacao: result.score,
            fonte: 'Tavily'
          });
          resultados.temResposta = true;
        }
      }
    }
    
    if (resultados.respostas.length > 0) {
      cache.set(cacheKey, {
        data: resultados,
        timestamp: Date.now()
      });
    }
    
    return resultados;
    
  } catch (error) {
    console.error('❌ Erro na busca Tavily:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.data);
    }
    return null;
  }
}

// Busca genérica - aceita qualquer consulta
export async function buscarQualquerCoisa(consulta) {
  return await buscarNoTavily(consulta);
}

// Limpar cache
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
  console.log(`🗑️ Cache Tavily limpo. Tamanho atual: ${cache.size}`);
}, 15 * 60 * 1000);
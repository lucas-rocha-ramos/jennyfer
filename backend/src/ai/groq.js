// backend/src/ai/groq.js
import { config } from 'dotenv';
import Groq from 'groq-sdk';
import { getInfoTempoReal } from '../utils/infoTempoReal.js';
import { buscarQualquerCoisa } from '../utils/searxng.js';
import { getCatalog, buscarProdutosPorCaracteristicas, recordTendenciaLook } from '../database/supabase.js';

config({ path: 'H:/jennyfer/backend/.env' });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Função para buscar produtos no catálogo
async function buscarNoCatalogo(consulta) {
  try {
    const { data: produtos, error } = await getCatalog();
    if (error || !produtos) {
      console.error('Erro ao buscar catálogo:', error);
      return [];
    }
    
    console.log(`📦 Total de produtos no catálogo: ${produtos.length}`);
    console.log(`🔍 Buscando por: "${consulta}"`);
    
    const consultaLower = consulta.toLowerCase().trim();
    
    const produtosAtivos = produtos.filter(p => p.active !== false);
    
    const produtosFiltrados = produtosAtivos.filter(produto => {
      const matchesName = produto.name?.toLowerCase().includes(consultaLower);
      const matchesCategory = produto.category?.toLowerCase().includes(consultaLower);
      const matchesDescription = produto.description?.toLowerCase().includes(consultaLower);
      const matchesTags = produto.style_tags?.some(tag => tag.toLowerCase().includes(consultaLower));
      const matchesEstilo = produto.estilo_analise?.toLowerCase().includes(consultaLower);
      
      const match = matchesName || matchesCategory || matchesDescription || matchesTags || matchesEstilo;
      
      if (match) {
        console.log(`✅ Produto encontrado: ${produto.name}`);
      }
      
      return match;
    });
    
    if (produtosFiltrados.length === 0) {
      const palavrasChave = consultaLower.split(' ');
      for (const palavra of palavrasChave) {
        if (palavra.length > 2) {
          const flexMatch = produtosAtivos.filter(produto => 
            produto.name?.toLowerCase().includes(palavra) ||
            produto.category?.toLowerCase().includes(palavra) ||
            produto.style_tags?.some(tag => tag.toLowerCase().includes(palavra))
          );
          if (flexMatch.length > 0) {
            console.log(`🔍 Busca flexível com "${palavra}" encontrou ${flexMatch.length} produtos`);
            return flexMatch;
          }
        }
      }
    }
    
    console.log(`📊 Encontrados: ${produtosFiltrados.length} produtos`);
    return produtosFiltrados;
  } catch (error) {
    console.error('Erro ao buscar no catálogo:', error);
    return [];
  }
}

// Função para extrair a intenção da pergunta do usuário
async function extrairIntencao(mensagem, historico) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Você é um assistente que extrai a intenção de busca do usuário.
          
Responda APENAS com um JSON neste formato:
{
  "precisaBuscar": true/false,
  "consulta": "a consulta que deve ser pesquisada na web",
  "tipo": "evento/jogo/noticia/clima/produto/geral",
  "buscarCatalogo": true/false,
  "termoCatalogo": "termo para buscar no catálogo"
}

Regras:
- Se o usuário perguntar sobre COMPRAR ou PRODUTOS de moda, coloque "buscarCatalogo": true
- Extraia o termo principal (ex: "fit" de "roupa estilo fit")
- Se for pergunta sobre estilo ou sugestão de look sem intenção de compra, "buscarCatalogo": false`
        },
        {
          role: "user",
          content: `Histórico: ${historico}\n\nUsuário: "${mensagem}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });
    
    const resposta = completion.choices[0].message.content;
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { precisaBuscar: false, buscarCatalogo: false };
  } catch (error) {
    console.error('Erro ao extrair intenção:', error);
    return { precisaBuscar: false, buscarCatalogo: false };
  }
}

export async function generateResponse(prompt) {
  try {
    const infoReal = await getInfoTempoReal();
    
    let historico = '';
    const historicoMatch = prompt.match(/Histórico da conversa: (\[[\s\S]*?\])/);
    if (historicoMatch) {
      historico = historicoMatch[1];
    }
    
    const mensagemAtual = prompt.match(/Mensagem atual: "([^"]*)"/);
    const mensagem = mensagemAtual ? mensagemAtual[1] : prompt;
    
    const intencao = await extrairIntencao(mensagem, historico);
    
    let resultadosBusca = '';
    let produtosCatalogo = [];
    let buscaRealizada = false;
    let produtosEncontrados = false;
    
    // Buscar no catálogo se for pergunta sobre produtos
    if (intencao.buscarCatalogo && intencao.termoCatalogo) {
      buscaRealizada = true;
      console.log(`🔍 Buscando no catálogo: ${intencao.termoCatalogo}`);
      
      // Primeiro tentar busca por características inteligentes
      const produtosPorCaracteristica = await buscarProdutosPorCaracteristicas(intencao.termoCatalogo);
      if (produtosPorCaracteristica.length > 0) {
        produtosCatalogo = produtosPorCaracteristica;
      } else {
        produtosCatalogo = await buscarNoCatalogo(intencao.termoCatalogo);
      }
      
      if (produtosCatalogo.length > 0) {
        produtosEncontrados = true;
        resultadosBusca = `\n\n🛍️ ENCONTREI ${produtosCatalogo.length} PRODUTO(S) NO CATÁLOGO:\n`;
        for (const produto of produtosCatalogo.slice(0, 5)) {
          resultadosBusca += `\n📌 Nome: ${produto.name}`;
          if (produto.price) resultadosBusca += `\n   💰 Preço: ${produto.price}`;
          if (produto.description) resultadosBusca += `\n   📝 ${produto.description.substring(0, 100)}`;
          if (produto.link) resultadosBusca += `\n   🔗 Link: ${produto.link}`;
          resultadosBusca += `\n`;
        }
        resultadosBusca += `\n⚠️ IMPORTANTE: Envie estes produtos como mensagens separadas.`;
      } else {
        resultadosBusca = `\n\n⚠️ Não encontrei produtos no catálogo para "${intencao.termoCatalogo}".`;
      }
    }
    
    // Buscar na web se necessário
    if (intencao.precisaBuscar && intencao.consulta && intencao.consulta.length > 3 && !buscaRealizada) {
      buscaRealizada = true;
      console.log(`🔍 Buscando na web: ${intencao.consulta}`);
      const busca = await buscarQualquerCoisa(intencao.consulta);
      
      if (busca && busca.respostas && busca.respostas.length > 0) {
        resultadosBusca = `\n\n🔍 RESULTADOS DA BUSCA:\n`;
        for (const resposta of busca.respostas.slice(0, 3)) {
          if (resposta.conteudo && resposta.conteudo.length > 0) {
            resultadosBusca += `\n📌 ${resposta.titulo || 'Informação'}:\n   ${resposta.conteudo.substring(0, 300)}`;
          }
        }
      }
    }

    // Se encontrou produtos no catálogo, retornar com marcador especial
    if (produtosEncontrados) {
      return `[PRODUTOS_ENCONTRADOS]${JSON.stringify(produtosCatalogo.slice(0, 5))}[/PRODUTOS_ENCONTRADOS]`;
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Você é Jennyfer, uma consultora de moda virtual amiga e especialista.

${resultadosBusca || 'Nenhuma busca realizada.'}

REGRAS IMPORTANTES:
- Converse naturalmente, como uma amiga
- Seja acolhedora mas direta
- Máximo 3-4 frases
- Use emojis com moderação ✨👗💕`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 300
    });
    
    return completion.choices[0].message.content;
    
  } catch (error) {
    console.error('❌ Erro no Groq:', error.message);
    return "Oi! Como posso ajudar com seu estilo hoje? ✨";
  }
}
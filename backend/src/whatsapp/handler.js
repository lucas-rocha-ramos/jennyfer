// backend/src/whatsapp/handler.js
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import { analyzeClothingImage } from '../ai/vision.js';
import { generateResponse } from '../ai/groq.js';
import { generateLookImage } from '../image/replicate.js';
import { getOrCreateUser, updateUserStatus, saveMessage, getUserLastInteraction, initDatabase, recordTendenciaLook } from '../database/supabase.js';
import { enviarListaProdutos } from '../utils/enviarProduto.js';
import axios from 'axios';

// Função para extrair características da sugestão de look
function extrairCaracteristicasLook(sugestao) {
  const texto = sugestao.toLowerCase();
  
  const pecas = {
    'vestido': 'vestido', 'calça': 'calça', 'saia': 'saia',
    'blusa': 'blusa', 'camisa': 'camisa', 'jaqueta': 'jaqueta',
    'blazer': 'blazer', 'short': 'short', 'macacão': 'macacão',
    'terno': 'terno', 'casaco': 'casaco', 'body': 'body'
  };
  
  const tecidos = {
    'algodão': 'algodão', 'seda': 'seda', 'jeans': 'jeans',
    'malha': 'malha', 'couro': 'couro', 'linho': 'linho',
    'viscose': 'viscose', 'poliéster': 'poliéster', 'renda': 'renda',
    'chiffon': 'chiffon', 'crepe': 'crepe', 'tricô': 'tricô'
  };
  
  const cores = {
    'branco': 'branco', 'preto': 'preto', 'bege': 'bege',
    'marrom': 'marrom', 'azul': 'azul', 'verde': 'verde',
    'vermelho': 'vermelho', 'rosa': 'rosa', 'amarelo': 'amarelo',
    'cinza': 'cinza', 'nude': 'nude', 'laranja': 'laranja',
    'roxo': 'roxo', 'prata': 'prata', 'dourado': 'dourado'
  };
  
  const modelagens = {
    'longo': 'longo', 'curto': 'curto', 'midi': 'midi',
    'justo': 'justo', 'solto': 'solto', 'evasê': 'evasê',
    'reto': 'reto', 'fluido': 'fluido', 'acinturado': 'acinturado',
    'over size': 'over size', 'cropped': 'cropped'
  };
  
  let peca = 'look';
  for (const [key, value] of Object.entries(pecas)) {
    if (texto.includes(key)) { peca = value; break; }
  }
  
  let tecido = 'diversos';
  for (const [key, value] of Object.entries(tecidos)) {
    if (texto.includes(key)) { tecido = value; break; }
  }
  
  let cor = 'variadas';
  for (const [key, value] of Object.entries(cores)) {
    if (texto.includes(key)) { cor = value; break; }
  }
  
  let modelagem = 'variada';
  for (const [key, value] of Object.entries(modelagens)) {
    if (texto.includes(key)) { modelagem = value; break; }
  }
  
  let estilo = 'elegante';
  if (texto.includes('casual')) estilo = 'casual';
  else if (texto.includes('romântico')) estilo = 'romântico';
  else if (texto.includes('esportivo')) estilo = 'esportivo';
  else if (texto.includes('moderno')) estilo = 'moderno';
  else if (texto.includes('clássico')) estilo = 'clássico';
  else if (texto.includes('boho')) estilo = 'boho';
  else if (texto.includes('minimalista')) estilo = 'minimalista';
  
  return { peca, cor, tecido, modelagem, estilo };
}

// Palavras que indicam encerramento REAL de conversa
const palavrasEncerramento = [
  'tchau', 'bye', 'até logo', 'até mais', 'até breve', 'falou', 'flw',
  'obrigado', 'obrigada', 'valeu', 'agradeço', 'grato', 'grata',
  'encerrar', 'fim', 'acabou', 'terminou', 'já era', 'chega', 'desligar'
];

// Palavras que indicam continuação da conversa
const palavrasContinuacao = [
  'jogo', 'futebol', 'brasil', 'copa', 'seleção', 'notícia', 'noticias',
  'evento', 'show', 'festa', 'trabalho', 'culto', 'praia', 'viagem',
  'comprar', 'produto', 'roupa', 'look', 'estilo', 'moda', 'tendência',
  'como foi', 'o que achou', 'sabe', 'me diga', 'conta', 'explica'
];

// Palavras de ocasião para extrair automaticamente
const palavrasOcasião = {
  'casamento': 'casamento', 'festa': 'festa', 'formatura': 'formatura',
  'trabalho': 'trabalho', 'entrevista': 'trabalho', 'escritório': 'trabalho',
  'praia': 'praia', 'piscina': 'praia', 'viagem': 'viagem',
  'jantar': 'jantar', 'encontro': 'encontro', 'cinema': 'cinema',
  'show': 'show', 'culto': 'culto', 'igreja': 'culto',
  'evento': 'evento', 'balada': 'festa', 'noite': 'noturno', 'dia': 'diurno'
};

// Palavras de estilo para extrair automaticamente
const palavrasEstilo = {
  'elegante': 'elegante', 'casual': 'casual', 'romântico': 'romântico',
  'esportivo': 'esportivo', 'moderno': 'moderno', 'clássico': 'clássico',
  'despojado': 'casual', 'social': 'elegante', 'fit': 'esportivo', 'fitness': 'esportivo'
};

// Palavras que indicam pedido de sugestão de look
const palavrasPedidoLook = [
  'sugira', 'sugestão', 'look', 'montar', 'combinar', 'o que usar', 
  'que roupa', 'como vestir', 'me ajuda', 'dica de look', 'look para',
  'vou em', 'irei em', 'evento', 'festa', 'culto', 'trabalho', 'praia',
  'jantar', 'cinema', 'show', 'casamento', 'formatura', 'tendência', 'moda',
  'crie um look', 'monta um look', 'look para'
];

// Perguntas para entender o contexto do look
const perguntasContexto = [
  'Para qual ocasião você quer montar esse look? (trabalho, festa, encontro, dia a dia, praia)',
  'Qual estilo você prefere? (casual, elegante, romântico, esportivo, moderno)',
  'Tem alguma cor preferida ou peça específica que quer usar?',
  'O evento é durante o dia ou à noite?'
];

function isPedindoLook(mensagem) {
  const texto = mensagem.toLowerCase().trim();
  return palavrasPedidoLook.some(palavra => texto.includes(palavra));
}

function isEncerramentoReal(mensagem) {
  const texto = mensagem.toLowerCase().trim();
  const temContinuacao = palavrasContinuacao.some(palavra => texto.includes(palavra));
  if (temContinuacao) return false;
  return palavrasEncerramento.some(palavra => texto.includes(palavra));
}

function isPergunta(mensagem) {
  const texto = mensagem.toLowerCase().trim();
  return texto.includes('?') || 
         texto.startsWith('como') || 
         texto.startsWith('onde') || 
         texto.startsWith('quando') ||
         texto.startsWith('quem') ||
         texto.startsWith('por que') ||
         texto.startsWith('qual');
}

function extrairOcasião(mensagem) {
  const texto = mensagem.toLowerCase();
  for (const [palavra, ocasiao] of Object.entries(palavrasOcasião)) {
    if (texto.includes(palavra)) return ocasiao;
  }
  return null;
}

function extrairEstilo(mensagem) {
  const texto = mensagem.toLowerCase();
  for (const [palavra, estilo] of Object.entries(palavrasEstilo)) {
    if (texto.includes(palavra)) return estilo;
  }
  return null;
}

async function verificarAvisoPendente(userId) {
  try {
    const { supabase } = await initDatabase();
    const { data: user } = await supabase
      .from('users')
      .select('status_aviso')
      .eq('id', userId)
      .single();
    return user?.status_aviso === 'nao_respondeu';
  } catch (error) {
    return false;
  }
}

async function perguntarSobreAvisos(client, from, userId, resposta) {
  const chat = await client.getChatById(from);
  await chat.sendSeen();
  await chat.sendStateTyping();
  const tempoDigitacao = Math.min(Math.max(resposta.length * 50, 1000), 8000);
  await new Promise(resolve => setTimeout(resolve, tempoDigitacao));
  await chat.clearState();
  await client.sendMessage(from, resposta);
  
  const { supabase } = await initDatabase();
  await supabase.from('user_memory').upsert({ 
    user_id: userId, aguardando_resposta_aviso: true, updated_at: new Date()
  });
}

async function enviarComDigitacao(client, from, resposta) {
  const chat = await client.getChatById(from);
  await chat.sendSeen();
  await chat.sendStateTyping();
  const tempoDigitacao = Math.min(Math.max(resposta.length * 50, 1000), 8000);
  await new Promise(resolve => setTimeout(resolve, tempoDigitacao));
  await chat.clearState();
  await client.sendMessage(from, resposta);
}

const userMemory = new Map();
const userLastActivity = new Map();
const SESSION_TIMEOUT = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [userId, lastActive] of userLastActivity.entries()) {
    if (now - lastActive > SESSION_TIMEOUT) {
      userMemory.delete(userId);
      userLastActivity.delete(userId);
      console.log(`🗑️ Sessão expirada: ${userId}`);
    }
  }
}, 60 * 1000);

async function sendImageMessage(client, to, imageUrl, caption) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    const media = new MessageMedia(mimeType, base64);
    await client.sendMessage(to, media, { caption: caption });
    return true;
  } catch (error) {
    await client.sendMessage(to, `✨ Look gerado: ${imageUrl}`);
    return false;
  }
}

export async function handleIncomingMessage(client, message) {
  const from = message.from;
  const body = message.body || '';
  const hasMedia = message.hasMedia;
  
  try {
    const nomeContato = message._data?.notifyName || message._data?.pushName || null;
    const user = await getOrCreateUser(from, nomeContato);
    
    if (!user) {
      await client.sendMessage(from, '✨ Ops! Tive um probleminha. Pode repetir? 💕');
      return;
    }
    
    console.log(`📨 ${from} (${user.nome || 'anônimo'}): ${body || '[imagem]'}`);
    
    userLastActivity.set(user.id, Date.now());
    
    let memory = userMemory.get(user.id) || {
      lastAnalysis: null, lastLookSuggestion: null, lastProductSent: null,
      conversationHistory: [], ultimaPeca: null, descricaoOriginalPeca: null,
      aguardandoRespostaAviso: false, ocasiao: null, estiloPreferido: null,
      aguardandoContexto: false, perguntaAtual: 0
    };
    
    const avisoPendente = await verificarAvisoPendente(user.id);
    
    // Resposta sobre avisos
    if (memory.aguardandoRespostaAviso && (body.toLowerCase().includes('sim') || body.toLowerCase().includes('não'))) {
      const aceitou = body.toLowerCase().includes('sim');
      await updateUserStatus(user.id, aceitou ? 'aceitou' : 'recusou');
      const resposta = aceitou 
        ? '✨ Que bom! Você receberá novidades, lançamentos e tendências de moda por aqui! 💕\n\nEstou sempre aqui para ajudar com seus looks! 👗'
        : '✨ Tudo bem! Se mudar de ideia, é só me avisar. Continuo aqui para ajudar com seus looks! 👗';
      
      await enviarComDigitacao(client, from, resposta);
      memory.aguardandoRespostaAviso = false;
      userMemory.set(user.id, memory);
      return;
    }
    
    // Verificar encerramento real
    const ehEncerramento = isEncerramentoReal(body);
    const ehPergunta = isPergunta(body);
    
    if (ehEncerramento && avisoPendente && !memory.aguardandoRespostaAviso && !ehPergunta) {
      const mensagem = `✨ Antes de finalizarmos, gostaria de saber:\n\n📱 Você gostaria de receber novidades, lançamentos e tendências de moda pelo WhatsApp?\n\nResponda com **sim** ou **não**. 💕`;
      await perguntarSobreAvisos(client, from, user.id, mensagem);
      memory.aguardandoRespostaAviso = true;
      userMemory.set(user.id, memory);
      return;
    }
    
    if (ehEncerramento && !avisoPendente && !ehPergunta) {
      await enviarComDigitacao(client, from, '✨ Foi um prazer ajudar! Quando precisar de dicas de moda, é só me chamar. Tenha um ótimo dia! 💕👗');
      return;
    }
    
    // Comando "VER" para gerar imagem
    const querGerarImagem = body.toLowerCase() === 'ver' || body.toLowerCase() === 'sim' || 
                            body.toLowerCase().includes('quero ver') || body.toLowerCase().includes('mostrar');
    
    if (querGerarImagem && memory.lastLookSuggestion) {
      await enviarComDigitacao(client, from, '🎨 Gerando a imagem do look... Aguarde um momento.');
      
      let imageUrl = null;
      if (memory.lastAnalysis) {
        imageUrl = await generateLookImage(memory.lastAnalysis, memory.lastLookSuggestion, user.id);
      } else {
        imageUrl = await generateLookImage({ tipo: "look", corPrincipal: "variadas", descricaoCompleta: memory.lastLookSuggestion }, memory.lastLookSuggestion, user.id);
      }
      
      if (imageUrl) {
        await sendImageMessage(client, from, imageUrl, '✨ Look finalizado! 💕');
        await saveMessage(user.id, 'imagem_gerada', 'Look gerado com sucesso', { url: imageUrl });
      } else {
        await enviarComDigitacao(client, from, '❌ Não consegui gerar a imagem. Tente novamente com "ver".');
      }
      
      memory.lastLookSuggestion = null;
      memory.lastAnalysis = null;
      userMemory.set(user.id, memory);
      return;
    }
    
    // Envio de imagem (análise)
    if (hasMedia) {
      await enviarComDigitacao(client, from, '👗 Analisando sua peça...');
      
      const media = await message.downloadMedia();
      const analysis = await analyzeClothingImage(media);
      
      memory.lastAnalysis = analysis;
      memory.ultimaPeca = analysis;
      memory.descricaoOriginalPeca = analysis.descricaoCompleta || `${analysis.tipo || 'peça'} ${analysis.corPrincipal || ''}`;
      memory.conversationHistory.push({ role: 'system', content: `Peça analisada: ${analysis.tipo || 'peça'}` });
      userMemory.set(user.id, memory);
      await saveMessage(user.id, 'imagem', 'Usuário enviou uma imagem', { analysis });
      
      const response = await generateResponse(`
        Peça: ${JSON.stringify(analysis)}
        
        Descreva a peça de forma elegante. Dê sua opinião honesta.
        Depois pergunte qual a ocasião de uso.
        Se for sugerir um look, termine com: Gostaria de ver como fica? Diga "sim" ou "ver".
        Máximo 4 frases.
      `);
      
      if (response.toLowerCase().includes('ocasião') || response.toLowerCase().includes('evento')) {
        memory.ocasiao = 'evento';
        userMemory.set(user.id, memory);
      }
      
      await enviarComDigitacao(client, from, response);
      await saveMessage(user.id, 'resposta', response);
      return;
    }
    
    // Conversa normal
    memory.conversationHistory.push({ role: 'user', content: body });
    if (memory.conversationHistory.length > 15) memory.conversationHistory.shift();
    userMemory.set(user.id, memory);
    await saveMessage(user.id, 'texto', body);
    
    const pedindoLook = isPedindoLook(body);
    const ocasiaoExtraida = extrairOcasião(body);
    const estiloExtraido = extrairEstilo(body);
    
    if (ocasiaoExtraida && !memory.ocasiao) memory.ocasiao = ocasiaoExtraida;
    if (estiloExtraido && !memory.estiloPreferido) memory.estiloPreferido = estiloExtraido;
    
    let response;
    
    if (pedindoLook) {
      if (memory.ocasiao) {
        const pecaContexto = memory.ultimaPeca ? `Última peça: ${memory.descricaoOriginalPeca}. ` : '';
        
        response = await generateResponse(`
          ${pecaContexto}
          Ocasião: ${memory.ocasiao}
          Estilo: ${memory.estiloPreferido || 'não informado'}
          Mensagem: "${body}"
          
          O usuário pediu um look para ${memory.ocasiao}.
          Faça uma sugestão de look COMPLETA e específica.
          Use formatação com listas (* item).
          Termine com: "Gostaria de ver como fica? Diga "sim" ou "ver"."
          Máximo 5 frases.
        `);
        
        memory.lastLookSuggestion = response;
        userMemory.set(user.id, memory);
        
        // Extrair características reais do look e registrar tendência
        const caracteristicas = extrairCaracteristicasLook(response);
        await recordTendenciaLook(
          caracteristicas.peca, caracteristicas.cor,
          caracteristicas.tecido, caracteristicas.modelagem,
          caracteristicas.estilo, memory.ocasiao
        );
        console.log(`📊 Tendência: ${caracteristicas.peca} - ${caracteristicas.cor} - ${caracteristicas.tecido} - ${caracteristicas.modelagem}`);
        
      } else if (!memory.aguardandoContexto) {
        memory.aguardandoContexto = true;
        memory.perguntaAtual = 0;
        userMemory.set(user.id, memory);
        response = `✨ Claro! Vou te ajudar a montar um look incrível!\n\n${perguntasContexto[0]}`;
        await enviarComDigitacao(client, from, response);
        return;
      } else if (memory.aguardandoContexto) {
        if (memory.perguntaAtual === 0) {
          memory.ocasiao = body; memory.perguntaAtual = 1;
          response = `Entendi! Ocasião: ${body}. ✨\n\n${perguntasContexto[1]}`;
        } else if (memory.perguntaAtual === 1) {
          memory.estiloPreferido = body; memory.perguntaAtual = 2;
          response = `Estilo: ${body}. 💕\n\n${perguntasContexto[2]}`;
        } else if (memory.perguntaAtual === 2) {
          memory.peçaEspecifica = body; memory.perguntaAtual = 3;
          response = `Ótimo! ${perguntasContexto[3]}`;
        } else {
          memory.periodo = body;
          memory.aguardandoContexto = false;
          memory.perguntaAtual = 0;
          
          response = await generateResponse(`
            Contexto: Ocasião: ${memory.ocasiao}, Estilo: ${memory.estiloPreferido}
            Com base nisso, sugira um look COMPLETO.
            Use listas (* item) e termine com: "Gostaria de ver? Diga "sim" ou "ver"."
          `);
          
          memory.lastLookSuggestion = response;
          userMemory.set(user.id, memory);
          
          const caracteristicas = extrairCaracteristicasLook(response);
          await recordTendenciaLook(caracteristicas.peca, caracteristicas.cor, caracteristicas.tecido, caracteristicas.modelagem, caracteristicas.estilo, memory.ocasiao);
          
          await enviarComDigitacao(client, from, response);
          return;
        }
        userMemory.set(user.id, memory);
        await enviarComDigitacao(client, from, response);
        return;
      }
      
    } else {
      response = await generateResponse(`
        Histórico: ${JSON.stringify(memory.conversationHistory.slice(-5))}
        Mensagem: "${body}"
        
        Converse naturalmente, como uma amiga.
        NÃO dê sugestões de look a menos que ele peça.
        NÃO pergunte sobre avisos.
        Responda a pergunta primeiro. Máximo 3-4 frases.
      `);
    }
    
    if (response && response.includes('[PRODUTOS_ENCONTRADOS]')) {
      const match = response.match(/\[PRODUTOS_ENCONTRADOS\](.*?)\[\/PRODUTOS_ENCONTRADOS\]/);
      if (match) {
        try {
          const produtos = JSON.parse(match[1]);
          if (produtos.length) memory.lastProductSent = produtos[0];
          await enviarListaProdutos(client, from, produtos);
          return;
        } catch (e) {}
      }
    }
    
    if (response && !memory.aguardandoContexto) {
      memory.conversationHistory.push({ role: 'assistant', content: response });
      userMemory.set(user.id, memory);
      await enviarComDigitacao(client, from, response);
      await saveMessage(user.id, 'resposta', response);
    }
    
  } catch (error) {
    console.error('❌ Erro no handler:', error);
    await client.sendMessage(from, '✨ Ops! Tive um probleminha. Pode repetir? 💕');
  }
}
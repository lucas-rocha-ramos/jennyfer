// backend/src/utils/infoTempoReal.js
import axios from 'axios';

// Obter data e hora atual do Brasil
export function getDataHoraAtual() {
  const now = new Date();
  const options = {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const dataFormatada = now.toLocaleDateString('pt-BR', options);
  const horaFormatada = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const diaSemana = now.toLocaleDateString('pt-BR', { weekday: 'long' });
  
  // Obter mês e dia para verificar jogos programados
  const mes = now.getMonth() + 1;
  const dia = now.getDate();
  
  return {
    data: dataFormatada,
    hora: horaFormatada,
    diaSemana: diaSemana,
    timestamp: now,
    mes: mes,
    dia: dia
  };
}

// Obter jogos do Brasil usando API Football (gratuita)
export async function getJogosBrasil() {
  try {
    // Tentativa 1: API do Brasil (futebol)
    const response = await axios.get('https://api.futebol.com.br/v1/partidas/hoje', {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }).catch(() => null);
    
    if (response && response.data) {
      const jogos = response.data;
      const jogoBrasil = jogos?.find(jogo => 
        jogo.time_casa?.nome?.toLowerCase().includes('brasil') || 
        jogo.time_fora?.nome?.toLowerCase().includes('brasil')
      );
      
      if (jogoBrasil) {
        return {
          temJogo: true,
          adversario: jogoBrasil.time_casa?.nome?.toLowerCase().includes('brasil') 
            ? jogoBrasil.time_fora?.nome 
            : jogoBrasil.time_casa?.nome,
          horario: jogoBrasil.horario || jogoBrasil.data_hora,
          local: jogoBrasil.local || 'não informado',
          fonte: 'api'
        };
      }
    }
    
    // Tentativa 2: API alternativa (TheSportsDB)
    const response2 = await axios.get('https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=' + getDataHoraAtual().data.split('/').reverse().join('-'), {
      timeout: 5000
    }).catch(() => null);
    
    if (response2 && response2.data?.events) {
      const jogoBrasil2 = response2.data.events.find(evento => 
        evento.strEvent?.toLowerCase().includes('brazil') ||
        evento.strEvent?.toLowerCase().includes('brasil') ||
        evento.strHomeTeam?.toLowerCase().includes('brazil') ||
        evento.strAwayTeam?.toLowerCase().includes('brazil')
      );
      
      if (jogoBrasil2) {
        return {
          temJogo: true,
          adversario: jogoBrasil2.strHomeTeam?.toLowerCase().includes('brazil') 
            ? jogoBrasil2.strAwayTeam 
            : jogoBrasil2.strHomeTeam,
          horario: jogoBrasil2.strTime || 'horário não informado',
          local: jogoBrasil2.strVenue || 'local não informado',
          fonte: 'api2'
        };
      }
    }
    
    // Se não encontrou jogos, retorna sem jogos
    return { temJogo: false };
    
  } catch (error) {
    console.error('Erro ao buscar jogos:', error.message);
    return { temJogo: false, erro: true };
  }
}

// Obter jogos do Brasil por data específica (usando dados manuais para datas importantes)
export function getJogosManuais(dataHora) {
  // Datas de jogos do Brasil em 2025/2026 (exemplos - atualizar conforme necessário)
  const jogosAgendados = [
    // Eliminatórias 2026
    { data: '2026-06-13', adversario: 'Argentina', horario: '21:00', local: 'Maracanã', competicao: 'Eliminatórias' },
    { data: '2026-06-18', adversario: 'Uruguai', horario: '21:30', local: 'Centenário', competicao: 'Eliminatórias' },
    { data: '2026-06-25', adversario: 'Colômbia', horario: '20:00', local: 'Mané Garrincha', competicao: 'Eliminatórias' },
    // Copa do Mundo 2026 (simulação)
    { data: '2026-06-14', adversario: 'Alemanha', horario: '15:00', local: 'Estádio do Maracanã', competicao: 'Copa do Mundo' },
    { data: '2026-06-19', adversario: 'França', horario: '16:00', local: 'Arena Corinthians', competicao: 'Copa do Mundo' },
  ];
  
  const hoje = dataHora.timestamp.toISOString().split('T')[0];
  const jogoHoje = jogosAgendados.find(jogo => jogo.data === hoje);
  
  if (jogoHoje) {
    return {
      temJogo: true,
      adversario: jogoHoje.adversario,
      horario: jogoHoje.horario,
      local: jogoHoje.local,
      competicao: jogoHoje.competicao,
      fonte: 'manual'
    };
  }
  
  return { temJogo: false };
}

// Obter previsão do tempo (API gratuita wttr.in)
export async function getClima(cidade = 'Sao Paulo') {
  try {
    const response = await axios.get(`https://wttr.in/${cidade}?format=%C+%t+%w&lang=pt`, {
      timeout: 5000
    });
    const climaTexto = response.data;
    
    let clima = 'ensolarado';
    let temperatura = '23°C';
    
    if (climaTexto.toLowerCase().includes('chuva')) clima = 'chuvoso';
    else if (climaTexto.toLowerCase().includes('nublado')) clima = 'nublado';
    else if (climaTexto.toLowerCase().includes('sol')) clima = 'ensolarado';
    
    const tempMatch = climaTexto.match(/(\+?\d+°C)/);
    if (tempMatch) temperatura = tempMatch[0];
    
    return {
      clima: clima,
      temperatura: temperatura,
      descricao: climaTexto.trim()
    };
  } catch (error) {
    console.error('Erro ao buscar clima:', error.message);
    return { clima: 'ensolarado', temperatura: '23°C', descricao: 'tempo agradável' };
  }
}

// Função principal que junta todas as informações
export async function getInfoTempoReal(cidade = 'Sao Paulo') {
  const dataHora = getDataHoraAtual();
  const jogosAPI = await getJogosBrasil();
  const jogosManual = getJogosManuais(dataHora);
  const clima = await getClima(cidade);
  
  // Priorizar jogos da API, depois manuais
  const jogos = jogosAPI.temJogo ? jogosAPI : jogosManual;
  
  return {
    data: dataHora.data,
    hora: dataHora.hora,
    diaSemana: dataHora.diaSemana,
    mes: dataHora.mes,
    dia: dataHora.dia,
    jogos: jogos,
    clima: clima
  };
}
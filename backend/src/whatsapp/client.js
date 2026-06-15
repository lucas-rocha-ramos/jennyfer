// backend/src/whatsapp/client.js
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { handleIncomingMessage } from './handler.js';

let client = null;
let isReady = false;
let currentQr = null;
let checkInterval = null;

export async function startWhatsAppClient() {
  try {
    console.log('📱 Iniciando WhatsApp...');

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './sessions'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      }
    });

    // Evento do QR Code
    client.on('qr', (qr) => {
      currentQr = qr;
      console.log('📟 QR Code gerado! Escaneie no frontend');
    });

    // Evento de autenticação
    client.on('authenticated', () => {
      console.log('🔐 Autenticado com sucesso!');
    });

    // Evento quando está pronto
    client.on('ready', () => {
      isReady = true;
      currentQr = null;
      console.log('✅ WhatsApp CONECTADO!');
      console.log('✨ Jennyfer está pronta para atender!');
      
      if (checkInterval) clearInterval(checkInterval);
    });

    // Evento de mensagem - chamando o handler
    client.on('message', async (message) => {
      if (!isReady) return;
      if (message.from === 'status@broadcast') return;
      await handleIncomingMessage(client, message);
    });

    // Evento de autenticação falha
    client.on('auth_failure', (msg) => {
      console.error('❌ Falha na autenticação:', msg);
    });

    // Evento de desconexão
    client.on('disconnected', (reason) => {
      console.log('⚠️ WhatsApp desconectado:', reason);
      isReady = false;
      console.log('🔄 Tentando reconectar em 10 segundos...');
      setTimeout(() => startWhatsAppClient(), 10000);
    });

    // Inicializar cliente
    await client.initialize();
    
    // Verificação manual a cada 3 segundos (fallback)
    checkInterval = setInterval(async () => {
      if (!isReady && client && client.info) {
        isReady = true;
        currentQr = null;
        console.log('✅ WhatsApp CONECTADO! (detectado manualmente)');
        console.log('✨ Jennyfer está pronta!');
        clearInterval(checkInterval);
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erro ao iniciar WhatsApp:', error.message);
    console.log('🔄 Reiniciando em 10 segundos...');
    setTimeout(() => startWhatsAppClient(), 10000);
  }
}

// Função para obter QR Code atual
export function getQrCode() {
  return currentQr;
}

// Função para obter status da conexão
export function getStatus() {
  return { 
    isReady: isReady, 
    hasQr: !!currentQr 
  };
}

// Função para obter o cliente (para uso em outros módulos)
export function getWhatsAppClient() {
  return { client, isReady };
}
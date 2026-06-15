// backend/src/utils/enviarProduto.js
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import axios from 'axios';

export async function enviarProdutoComoMensagem(client, to, produto) {
  try {
    console.log(`📤 Enviando produto: ${produto.name}`);
    
    // Montar mensagem com informações do produto
    let mensagem = `🛍️ *${produto.name}*\n\n`;
    
    if (produto.price) {
      mensagem += `💰 *Preço:* ${produto.price}\n\n`;
    }
    
    if (produto.description) {
      mensagem += `📝 ${produto.description}\n\n`;
    }
    
    // Adicionar link do produto se existir
    if (produto.link) {
      mensagem += `🔗 *Link:* ${produto.link}\n\n`;
    }
    
    mensagem += `✨ Jennyfer - Moda IA`;
    
    // Se tiver imagem, enviar como mídia
    if (produto.image_url) {
      try {
        // Baixar a imagem
        const response = await axios.get(produto.image_url, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data).toString('base64');
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        const media = new MessageMedia(mimeType, base64);
        
        // Enviar imagem com legenda
        await client.sendMessage(to, media, { caption: mensagem });
        console.log(`📸 Produto enviado com imagem: ${produto.name}`);
      } catch (imgError) {
        console.error('Erro ao enviar imagem do produto:', imgError.message);
        // Fallback: enviar só texto com link
        await client.sendMessage(to, mensagem);
      }
    } else {
      // Sem imagem, enviar só texto
      await client.sendMessage(to, mensagem);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar produto:', error.message);
    return false;
  }
}

export async function enviarListaProdutos(client, to, produtos) {
  try {
    if (!produtos || produtos.length === 0) {
      await client.sendMessage(to, '✨ Não encontrei produtos no catálogo com esse estilo. Quer que eu monte um look personalizado para você? 👗');
      return;
    }
    
    // Enviar uma mensagem de introdução
    await client.sendMessage(to, `🛍️ *Encontrei ${produtos.length} produto(s) para você:*\n\nVou enviar as opções abaixo! ✨`);
    
    // Enviar cada produto individualmente
    for (const produto of produtos) {
      await enviarProdutoComoMensagem(client, to, produto);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Mensagem final
    await client.sendMessage(to, '✨ Gostou de alguma opção? Posso te ajudar a montar um look com ela! 💕');
    return true;
  } catch (error) {
    console.error('Erro ao enviar lista de produtos:', error);
    return false;
  }
}
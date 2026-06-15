// backend/src/image/replicate.js
import { config } from 'dotenv';
import Replicate from 'replicate';
import { saveImage, recordStat } from '../database/supabase.js';
import axios from 'axios';
import sharp from 'sharp';

config({ path: 'H:/jennyfer/backend/.env' });

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

export async function generateLookImage(analysis, lookSuggestion, userId = null) {
  try {
    console.log('🎨 Gerando imagem com Nano Banana 2...');
    
    let descricaoPeca = "";
    if (analysis && analysis.descricaoCompleta) {
      descricaoPeca = analysis.descricaoCompleta;
    } else if (analysis) {
      descricaoPeca = `${analysis.tipo || 'peça'} ${analysis.corPrincipal || ''}`;
    }
    
    const promptTexto = `Look de moda: ${descricaoPeca}. Combine com: ${lookSuggestion || 'acessórios elegantes'}. Fundo neutro. 4K realista.`;
    
    console.log('📝 Prompt:', promptTexto.substring(0, 150));
    
    const input = {
      prompt: promptTexto,
      aspect_ratio: "1:1",
      output_format: "jpg"
    };
    
    const output = await replicate.run("google/nano-banana-2", { input });
    
    let imageUrl = null;
    if (output && typeof output === 'object' && output.url) {
      imageUrl = typeof output.url === 'function' ? output.url() : output.url;
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (Array.isArray(output) && output[0]) {
      imageUrl = output[0];
    }
    
    if (imageUrl && userId) {
      const webpUrl = await convertAndSaveImage(imageUrl, userId, promptTexto, lookSuggestion, analysis);
      const estilo = analysis?.clothing_analysis?.overall_fashion_style || analysis?.estilo || 'moderno';
      await recordStat('estilo', estilo);
      console.log('✅ Imagem salva no banco!');
    }
    
    return imageUrl;
    
  } catch (error) {
    console.error('❌ Erro no Nano Banana 2:', error.message);
    return null;
  }
}

async function convertAndSaveImage(imageUrl, userId, prompt, lookSuggestion, analysis) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const webpBuffer = await sharp(response.data).webp({ quality: 80 }).toBuffer();
    const base64Webp = `data:image/webp;base64,${webpBuffer.toString('base64')}`;
    
    const estilo = analysis?.clothing_analysis?.overall_fashion_style || analysis?.estilo || 'moderno';
    
    await saveImage(userId, imageUrl, base64Webp, prompt, lookSuggestion, estilo);
    return base64Webp;
  } catch (error) {
    console.error('Erro ao converter imagem:', error.message);
    return imageUrl;
  }
}
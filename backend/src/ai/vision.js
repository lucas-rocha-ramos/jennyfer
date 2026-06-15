// backend/src/ai/vision.js
import { config } from 'dotenv';
import Groq from 'groq-sdk';

config({ path: 'H:/jennyfer/backend/.env' });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function analyzeClothingImage(media) {
  try {
    if (!media || !media.data) {
      return {
        clothing_analysis: {
          top_garments: "Não foi possível identificar",
          bottom_garments: "Não foi possível identificar",
          footwear: "Não foi possível identificar",
          accessories: "Não foi possível identificar",
          materials_and_colors: "Não foi possível identificar",
          overall_fashion_style: "Não foi possível identificar"
        },
        tipo: "peça",
        corPrincipal: "neutra",
        descricaoCompleta: "Peça de roupa não identificada"
      };
    }
    
    const imageDataUrl = `data:${media.mimetype};base64,${media.data}`;
    
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta roupa e retorne APENAS UM JSON válido com estes campos:
{
  "tipo": "vestido/blusa/calça/saia/body/camisa/jaqueta",
  "corPrincipal": "cor predominante",
  "estampa": "lisa/floral/lista/poa/animal print ou null",
  "tecido": "algodão/seda/jeans/malha/couro/linho ou null",
  "manga": "longa/curta/regata/sem manga/3/4 ou null",
  "decote": "V/redondo/barco/terno/off-shoulder/heart ou null",
  "comprimento": "curto/midi/longo ou null",
  "estilo": "casual/elegante/esportivo/romântico/boho/minimalista",
  "descricaoCompleta": "Uma descrição natural e elegante da peça"
}
Apenas o JSON, sem texto adicional.`
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl }
            }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    });
    
    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('📊 Análise da roupa:', analysis);
      return analysis;
    }
    
    return {
      tipo: "peça",
      corPrincipal: "estilosa",
      descricaoCompleta: "Peça de roupa elegante"
    };
    
  } catch (error) {
    console.error('❌ Erro na análise de imagem:', error.message);
    return {
      tipo: "peça",
      corPrincipal: "bonita",
      descricaoCompleta: "Peça que você enviou"
    };
  }
}
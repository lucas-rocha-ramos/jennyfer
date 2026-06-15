// backend/src/utils/analisarImagemProduto.js
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function analisarImagemProduto(imageDataUrl) {
  try {
    console.log('🔍 Analisando imagem do produto...');
    
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analise esta imagem de produto de moda e retorne APENAS UM JSON válido com estes campos:

{
  "tipo": "vestido/blusa/calça/saia/body/camisa/jaqueta/shorts/macacao/casaco",
  "cores": ["cor1", "cor2"],
  "tecido": "algodão/seda/jeans/malha/couro/linho/poliester",
  "estampa": "lisa/floral/lista/poa/animal print/quadriculada/geometrica",
  "modelagem": "reto/justo/evase/fluido/estruturado/oversized",
  "comprimento": "curto/midi/longo/na cintura/joelho/tornozelo",
  "manga": "longa/curta/regata/sem manga/3/4/bufante",
  "decote": "V/redondo/barco/terno/off-shoulder/heart/alta",
  "estilo": "casual/elegante/esportivo/romântico/boho/minimalista/classico/moderno",
  "ocasioes": ["casual", "trabalho", "festa", "praia", "noite", "dia"],
  "tags": ["tag1", "tag2", "tag3"]
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
      max_tokens: 800
    });
    
    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log('📊 Análise do produto concluída:', analysis);
      return analysis;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao analisar imagem do produto:', error.message);
    return null;
  }
}
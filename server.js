const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());


const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const DRAGON_PROMPTS = {
  skylar: `You are Skylar "Moonshot" Visionnaire, The Dreamer. You focus on revolutionary ideas that challenge conventional thinking. You value distinctiveness and world-changing potential. You're sarcastic, sharp, and push for truly disruptive thinking. 

Evaluate this business pitch and respond ONLY with valid JSON in this exact format:
{
  "rating": <number between 1-10>,
  "critique": "<your pithy, sarcastic critique in 2-3 sentences>",
  "question": "<one penetrating question to sharpen the idea>"
}`,

  morgan: `You are Morgan "Consumer Compass" Fields, The Consumerist. You're obsessed with solving real consumer problems and skeptical of technology for technology's sake. You bring conversations back to the human needs being addressed.

Evaluate this business pitch and respond ONLY with valid JSON in this exact format:
{
  "rating": <number between 1-10>,
  "critique": "<your sharp critique focused on customer value in 2-3 sentences>",
  "question": "<one question about real user needs>"
}`,

  alex: `You are Alex "The Abacus" Ledger, The Spreadsheet Jockey. You care only about financial viability and business model economics. You're analytical, skeptical of inflated projections, and demand concrete numbers.

Evaluate this business pitch and respond ONLY with valid JSON in this exact format:
{
  "rating": <number between 1-10>,
  "critique": "<your critique focused on financial reality in 2-3 sentences>",
  "question": "<one question about the economics>"
}`,

  terra: `You are Terra "Green Future" Martinez, The Sustainability Champion. You evaluate environmental impact, circular economy principles, and ESG metrics. You're passionate but critical about greenwashing.

Evaluate this business pitch and respond ONLY with valid JSON in this exact format:
{
  "rating": <number between 1-10>,
  "critique": "<your sharp critique on sustainability in 2-3 sentences>",
  "question": "<one question about environmental responsibility>"
}`,

  zara: `You are Dr. Zara "TechCore" Chen, The Technology Purist. You assess cutting-edge technology, technical feasibility, and scalability. You're brilliant but dismissive of weak technical foundations.

Evaluate this business pitch and respond ONLY with valid JSON in this exact format:
{
  "rating": <number between 1-10>,
  "critique": "<your sharp technical critique in 2-3 sentences>",
  "question": "<one question about the technology architecture>"
}`,

  phoenix: `You are Phoenix "Executable" Kane, The Pragmatist. You focus on execution feasibility and operational reality. You're skeptical of ideas that sound good on paper but can't be built.

Evaluate this business pitch and respond ONLY with valid JSON in this exact format:
{
  "rating": <number between 1-10>,
  "critique": "<your critique on implementation challenges in 2-3 sentences>",
  "question": "<one question about execution capability>"
}`,

  jobs: `You are evaluating this idea in the style of Steve Jobs, The Visionary Perfectionist. You care deeply about design, simplicity, and user experience. You're brutally honest and demand excellence.

Evaluate this business pitch and respond ONLY with valid JSON in this exact format:
{
  "rating": <number between 1-10>,
  "critique": "<your sharp critique focused on design and UX in 2-3 sentences>",
  "question": "<one question about the user experience>"
}`,

  christensen: `You are evaluating this idea in the style of Clayton Christensen, The Innovation Theorist. You analyze through the lens of disruptive innovation and jobs-to-be-done. You're academic but incisive.

Evaluate this business pitch and respond ONLY with valid JSON in this exact format:
{
  "rating": <number between 1-10>,
  "critique": "<your critique based on innovation theory in 2-3 sentences>",
  "question": "<one question about the job-to-be-done>"
}`,

  blakely: `You are evaluating this idea in the style of Sara Blakely, The Scrappy Entrepreneur. You focus on resourcefulness, authentic problem-solving, and founder determination. You value grit over pedigree.

Evaluate this business pitch and respond ONLY with valid JSON in this exact format:
{
  "rating": <number between 1-10>,
  "critique": "<your critique on entrepreneurial viability in 2-3 sentences>",
  "question": "<one question about the founder's commitment>"
}`
};

async function getDragonFeedback(dragonId, pitch) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: DRAGON_PROMPTS[dragonId],
      messages: [{
        role: 'user',
        content: `Business Pitch:\n\n${pitch}`
      }]
    });

    const responseText = message.content[0].text;
    console.log(`Response from ${dragonId}:`, responseText);
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const feedback = JSON.parse(jsonMatch[0]);
      return {
        dragonId: dragonId,
        rating: feedback.rating,
        critique: feedback.critique,
        question: feedback.question
      };
    }
    
    throw new Error('Failed to parse dragon feedback');
  } catch (error) {
    console.error(`Error getting feedback from ${dragonId}:`, error);
    throw error;
  }
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/api/evaluate-pitch', async (req, res) => {
  try {
    const { pitch, dragonIds, password } = req.body;
    
    // Check password
    if (password !== process.env.CLASS_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password. Please contact your instructor.' });
    }
    
    if (!pitch || !dragonIds || !Array.isArray(dragonIds)) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    console.log('Evaluating pitch with dragons:', dragonIds);
    
    // Get feedback from all selected dragons in parallel
    const evaluations = await Promise.all(
      dragonIds.map(dragonId => getDragonFeedback(dragonId, pitch))
    );
    
    res.json({ evaluations });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get dragon feedback' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/check-password', (req, res) => {
  const { password } = req.body;
  
  if (password === process.env.CLASS_PASSWORD) {
    return res.json({ valid: true });
  } else {
    return res.status(401).json({ valid: false });
  }
});

app.post('/api/improve-pitch', async (req, res) => {
  try {
    const { originalPitch, feedback, password } = req.body;
    
    // Check password
    if (password !== process.env.CLASS_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    if (!originalPitch || !feedback) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    
    console.log('Improving pitch based on dragon feedback');
    
    // Create a prompt that synthesizes all the feedback
    const feedbackSummary = feedback.map(f => {
      const dragonName = f.dragonId.charAt(0).toUpperCase() + f.dragonId.slice(1);
      return `${dragonName} (${f.rating}/10): ${f.critique}\nKey Question: ${f.question}`;
    }).join('\n\n');
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `You are a business pitch consultant helping students improve their ideas. You receive an original pitch and feedback from multiple evaluators. Your job is to create an improved version of the pitch that addresses the key concerns raised while maintaining the core idea.

Guidelines:
- Keep the same basic business concept
- Address the specific critiques and questions raised
- Make it more concrete and compelling
- Add missing elements (numbers, customer insights, execution details, etc.)
- Keep it concise (2-3 paragraphs)
- Write in first person as if you're the entrepreneur`,
      messages: [{
        role: 'user',
        content: `Original Pitch:
${originalPitch}

Dragon Feedback:
${feedbackSummary}

Please write an improved version of this pitch that addresses the dragons' concerns and answers their key questions. Make it stronger, more specific, and more compelling.`
      }]
    });
    
    const improvedPitch = message.content[0].text;
    
    res.json({ improvedPitch });
    
  } catch (error) {
    console.error('Error improving pitch:', error);
    res.status(500).json({ error: 'Failed to improve pitch' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🐉 Dragon's Den server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api/evaluate-pitch`);

});


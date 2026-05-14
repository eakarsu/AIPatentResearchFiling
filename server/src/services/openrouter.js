import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

export async function callOpenRouter(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

  if (!apiKey || apiKey === 'your_openrouter_key_here') {
    return {
      success: false,
      result: 'OpenRouter API key not configured. Please add your key to the .env file.',
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Patent Research & Filing',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, result: data.error.message || 'API error occurred' };
    }

    return {
      success: true,
      result: data.choices?.[0]?.message?.content || 'No response generated',
      model: data.model,
      usage: data.usage,
    };
  } catch (error) {
    return { success: false, result: `Error: ${error.message}` };
  }
}

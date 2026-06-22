function extractJson(str) {
  const match = str.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {}
  }

  let firstBrace = str.indexOf('{');
  while (firstBrace !== -1) {
    let braceCount = 0;
    let inString = false;
    let escape = false;
    for (let i = firstBrace; i < str.length; i++) {
      const char = str[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const candidate = str.substring(firstBrace, i + 1);
            try {
              return JSON.parse(candidate);
            } catch (e) {}
          }
        }
      }
    }
    firstBrace = str.indexOf('{', firstBrace + 1);
  }

  throw new Error('Could not extract valid JSON from response');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, code, language } = req.body;
    
    const systemPrompt = `You are SYNTEX, a world-class AI compiler engineer and programming assistant.
The user is asking questions or requesting help about their code in the workspace.
Active code language: "${language}".
Active code in editor:
\`\`\`${language}
${code}
\`\`\`

Explain clearly, keep explanations concise, helpful, and educational.
If you suggest any code changes, provide the code snippet in a clean format.
Your output must be a valid JSON object matching:
{
  "text": "educational response text",
  "codeBlock": "optional code snippet or empty string"
}
Ensure your response is valid JSON and ONLY return the JSON object. No markdown code blocks surrounding the JSON.`;

    const userPrompt = `User question: ${prompt}`;

    let response = null;
    let lastError = null;

    // Try GitHub Models first
    try {
      response = await fetch('https://models.github.ai/inference/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GH_MODELS_TOKEN || process.env.GITHUB_TOKEN || ''}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        lastError = new Error(`GitHub Models failed: ${response.status} - ${errText}`);
      }
    } catch (err) {
      lastError = err;
    }

    // Fallback to OpenRouter
    if (!response || !response.ok) {
      const models = [
        'openrouter/free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'meta-llama/llama-3.2-3b-instruct:free',
        'qwen/qwen3-coder:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
        'cohere/north-mini-code:free'
      ];
      for (const model of models) {
        try {
          response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
              'HTTP-Referer': 'https://synthex.ai',
              'X-Title': 'Synthex AI Studio'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ]
            })
          });
          if (response.ok) {
            break;
          } else {
            const errText = await response.text();
            lastError = new Error(`OpenRouter Model ${model} failed: ${response.status} - ${errText}`);
          }
        } catch (err) {
          lastError = err;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error('All chat endpoints failed');
    }

    const data = await response.json();
    let contentText = data.choices[0]?.message?.content || '';
    if (!contentText && data.choices[0]?.message?.reasoning) {
      contentText = data.choices[0].message.reasoning;
    }

    let resultJson: any = {};
    try {
      resultJson = extractJson(contentText);
    } catch (e) {
      resultJson = { text: contentText, codeBlock: '' };
    }

    return res.status(200).json(resultJson);
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Internal chat error' });
  }
}

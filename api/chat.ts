import { execSync } from 'child_process';

function getGitToken(): string {
  const envToken = process.env.GH_MODELS_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || '';
  if (envToken) return envToken;

  try {
    const input = 'protocol=https\nhost=github.com\n\n';
    const output = execSync('git credential fill', {
      input: input,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const match = output.match(/^password=(.+)$/m);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (e) {
    // Ignore error
  }
  return '';
}

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

    const ghToken = getGitToken();
    if (!ghToken) {
      throw new Error('GH_MODELS_TOKEN or GITHUB_TOKEN environment variable is not configured');
    }

    const response = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ghToken}`
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
      throw new Error(`GitHub Models failed: ${response.status} - ${errText}`);
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

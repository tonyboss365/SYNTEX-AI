export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, cursorPosition, language } = req.body;
    const codeBefore = code.substring(0, cursorPosition);
    const codeAfter = code.substring(cursorPosition);
    
    const systemPrompt = `You are an inline code completion assistant (like GitHub Copilot).
Language: "${language}".
The user is typing code. Your job is to predict the rest of the current line (or the next single line if the cursor is at the start of a line) to complete their code, starting EXACTLY from the cursor position.

STRICT RULES:
- Return ONLY the characters to be appended from the cursor position to complete the line.
- Do NOT repeat any characters that are already present before the cursor.
- No markdown, no code fences, no explanations.
- Maximum 60 characters.
- If you have no confident suggestion, return empty string.
- Never return more than one line.`;

    const userPrompt = `Code before cursor:\n${codeBefore}\n\nCode after cursor:\n${codeAfter}`;

    let response = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

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
          temperature: 0.1,
          max_tokens: 30
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (err) {
      console.error('Fetch to GitHub Models failed:', err);
    }

    if (!response || !response.ok) {
      const errText = response ? await response.text() : 'No response';
      console.error(`GitHub Models API error: ${response ? response.status : 'unknown'} - ${errText}`);
      return res.status(200).json({ suggestion: '' });
    }

    const data = await response.json();
    let suggestion = data.choices[0]?.message?.content || '';
    
    // Clean up any markdown code fencing the model might have returned
    suggestion = suggestion.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();
    
    return res.status(200).json({ suggestion });
  } catch (err) {
    console.error('Autocomplete error:', err);
    return res.status(200).json({ suggestion: '' });
  }
}

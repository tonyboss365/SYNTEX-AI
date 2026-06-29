import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
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

function extractJson(str: string): any {
  const match = str.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {
      // ignore
    }
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
            } catch (e) {
              // keep searching
            }
          }
        }
      }
    }
    firstBrace = str.indexOf('{', firstBrace + 1);
  }

  throw new Error('Could not extract valid JSON');
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/correct-code' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const { code, language, target, stdin } = JSON.parse(body);
                  const targetLanguage = target || 'python';
                  const inputBuffer = stdin || '';
                  
                  const systemPrompt = `You are the SYNTEX Multi-Language Compiler & IDE Backend, powered by SYNTEX.
You are running a code execution and compilation pipeline. The user is writing code in: "${language}" (could be "lex", "python", "java", "javascript", or "natural" language).
If "natural", the editor text is a natural language description. If "lex", it is standard Lex/Flex specification syntax.

Your goal is to parse, analyze, compile, and simulate the execution of this program.

Take program input (stdin) from: "${inputBuffer}" (if the code reads user inputs, use this).

You must return a JSON response containing these exact fields:
1. "correctedCode": The corrected version of the user's code. If the original code has no syntax errors and no bugs, "correctedCode" MUST be EXACTLY IDENTICAL to the original code character-for-character. Do NOT modify spaces, formatting, style, or comments. Only propose changes when there is an actual functional bug or syntax compilation failure. If the language is "natural", translate it into valid, standard Lex/Flex language syntax.
2. "explanation": A detailed diagnostic report of any compiler errors, syntax warnings, or runtime errors you resolved, or a walkthrough of the natural language translation steps. Write this in an educational, coaching style.
3. "consoleOutput": The simulated execution output (stdout/stderr) of the code. If there are syntax errors that prevent compilation, output the compiler error messages instead.
4. "compiledCode": The translation of the corrected code into the target output language: "${targetLanguage}".
5. "tokens": An array of tokens from the lexical scanning phase. Each token should match the schema: { "type": "KEYWORD" | "IDENTIFIER" | "STRING" | "NUMBER" | "OPERATOR" | "SYMBOL" | "COMMENT", "value": "string" }
6. "ast": A hierarchical Abstract Syntax Tree (AST) representing the parsed syntax structure. Each node must match the schema: { "name": "node name (e.g. print, x, Loop)", "type": "node type (e.g. ProgramNode, VariableDeclaration, CallExpression)", "children": [optional nested node array] }

Lex language rules:
- Code format: Standard Lex/Flex specification file format. Sections separated by "%%".
- Definitions section: %{ ... %} block containing C code/includes.
- Rules section: Pattern action pairs like [a-zA-Z]+ { printf("Word\\n"); } or . { printf("%s", yytext); } or [ \\t\\n]+ ;
- User Code section: C code containing functions like int yywrap() and int main() calling yylex().
- Simulation: Simulate compiling this Flex specification using gcc and lex, then running the binary on the provided "stdin" buffer. Match patterns sequentially and execute C statement actions (e.g. printf). Output stdout to "consoleOutput". If "stdin" is empty, do NOT throw an error; yylex() should simply terminate immediately and return exit code 0.
- AST & Tokens: Generate a hierarchical Abstract Syntax Tree (AST) matching the definitions, rules, and user code, and a scanned tokens stream.
- Translation to Lex: When translating a program (e.g. from Python, Java, JS) into Lex/Flex target language, do NOT return a generic template. Translate the actual program logic into equivalent Lex scanner rule matching actions (e.g. if the source code reads and sums numbers, the Lex rules should match integers, perform the addition in a C state variable, and print the output in an action block).

Ensure your response is valid JSON and ONLY return the JSON object.`;

                  const userPrompt = `Code to compile/translate:\n${code}\n\nStdin input buffer:\n${inputBuffer}`;

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
                      ]
                    })
                  });
                  if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`GitHub Models GPT-4o-mini failed: ${response.status} - ${errText}`);
                  }

                  const data = await response.json();
                  let contentText = data.choices[0]?.message?.content || '';
                  if (!contentText && data.choices[0]?.message?.reasoning) {
                    contentText = data.choices[0].message.reasoning;
                  }

                  // Extract JSON from text (resilient to markdown wrapper and leading text)
                  let finalResponse = contentText;
                  try {
                    finalResponse = JSON.stringify(extractJson(contentText));
                  } catch (e) {
                    finalResponse = JSON.stringify({ consoleOutput: contentText });
                  }
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(finalResponse);
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
            } else if (req.url === '/api/chat' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                  body += chunk;
                });
                req.on('end', async () => {
                  try {
                    const { prompt, code, language } = JSON.parse(body);
                    
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

                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(resultJson));
                  } catch (err: any) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: err.message }));
                  }
                });
              } else if (req.url === '/api/autocomplete' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const { code, cursorPosition, language } = JSON.parse(body);
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

                  const ghToken = getGitToken();
                  let response: any = null;

                  if (ghToken) {
                    try {
                      const controller = new AbortController();
                      const timeoutId = setTimeout(() => controller.abort(), 5000);

                      response = await fetch('https://models.github.ai/inference/chat/completions', {
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
                          temperature: 0.1,
                          max_tokens: 30
                        }),
                        signal: controller.signal
                      });

                      clearTimeout(timeoutId);
                    } catch (err: any) {
                      console.error('Fetch to GitHub Models failed:', err);
                    }
                  }

                  if (!response || !response.ok) {
                    const errText = response ? await response.text() : 'No response';
                    console.error(`Autocomplete API error: ${response ? response.status : 'unknown'} - ${errText}`);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ suggestion: '' }));
                    return;
                  }

                  const data = await response.json();
                  let suggestion = data.choices[0]?.message?.content || '';
                  suggestion = suggestion.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '').trim();

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ suggestion }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

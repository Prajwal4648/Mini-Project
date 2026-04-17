import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Compilation API is ready' });
});

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function groqChat(apiKey, prompt, temperature = 0.3) {
  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 2048,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Groq API error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  return data?.choices?.[0]?.message?.content || '';
}

function extractJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch { /* continue */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* ignore */ }
  }
  return null;
}

// AI code review endpoint (Groq / Llama)
app.post('/api/gemini/review', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(401).json({ error: 'GROQ_API_KEY missing in .env' });

    const { code, language = 'java' } = req.body || {};
    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'No code provided' });
    }

    const snippet = code.length > 12000 ? code.slice(0, 12000) + '\n... (truncated)' : code;
    const prompt = `You are a senior code reviewer. Analyze the following ${language} code.
Return ONLY strict JSON with this exact schema (no extra text or markdown):
{
  "issues": string[],
  "improvements": string[],
  "complexity": { "time": string, "space": string, "notes": string },
  "hints": string[]
}
Rules:
- Keep each item under 180 characters.
- Do NOT provide full solutions or complete code.
- Use "N/A" for complexity when not applicable.

\`\`\`${language}
${snippet}
\`\`\``;

    const raw = await groqChat(apiKey, prompt, 0.3);
    const parsed = extractJson(raw) || { issues: [], improvements: [], complexity: { time: 'N/A', space: 'N/A' }, hints: [] };
    return res.json({ ok: true, analysis: parsed, raw });
  } catch (err) {
    console.error('AI review error:', err);
    return res.status(500).json({ error: 'Failed to analyze code', message: err?.message });
  }
});

// AI per-line annotation endpoint (Groq / Llama)
app.post('/api/gemini/annotate', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'GROQ_API_KEY missing in .env' });

    const { code, language = 'java' } = req.body || {};
    if (!code || typeof code !== 'string') return res.status(400).json({ error: 'code required' });

    const lines = code.split('\n');
    const truncated = lines.slice(0, 500).join('\n');
    const prompt = `You are a code reviewer. Return ONLY JSON (no markdown, no extra text) matching this schema:
{
  "lines": [
    {
      "line": <number>,
      "issue": "<short problem or empty string>",
      "hint": "<single short hint, no full solution>",
      "severity": "<info|warning|error>",
      "suggestion": "<one concise improvement>",
      "explanationSteps": ["Step 1...", "Step 2..."]
    }
  ]
}
Rules:
- Include ONLY lines that have a real issue or meaningful improvement.
- Keep hints short; no full solutions.
- Steps must be incremental for a beginner.
Language: ${language}
Code:
\`\`\`${language}
${truncated}
\`\`\``;

    const text = await groqChat(apiKey, prompt, 0.3);
    let parsed = extractJson(text);
    if (!parsed || !Array.isArray(parsed.lines)) {
      return res.json({ lines: [], truncated: lines.length > 500 });
    }
    const clean = parsed.lines
      .filter(l => typeof l.line === 'number' && l.line >= 1 && l.line <= lines.length)
      .map(l => ({
        line: l.line,
        issue: String(l.issue || '').slice(0, 180),
        hint: String(l.hint || '').slice(0, 160),
        severity: ['info', 'warning', 'error'].includes(l.severity) ? l.severity : 'info',
        suggestion: String(l.suggestion || '').slice(0, 180),
        explanationSteps: Array.isArray(l.explanationSteps)
          ? l.explanationSteps.slice(0, 8).map(s => String(s).slice(0, 160))
          : [],
      }));
    return res.json({ lines: clean, truncated: lines.length > 500 });
  } catch (err) {
    console.error('AI annotate error:', err);
    return res.status(500).json({ error: 'annotate failed', message: err?.message });
  }
});

// Proxy endpoint for JDoodle API
app.post('/api/compile', async (req, res) => {
  console.log('📨 Received compilation request');
  try {
    const { code, language = 'java', versionIndex = '4', stdin = '' } = req.body || {};
    console.log(`📝 Language: ${language}, Code length: ${code?.length || 0} chars`);

    // Get API credentials from environment variables or use demo mode
    const clientId = process.env.JDOODLE_CLIENT_ID || 'DEMO_MODE';
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET || 'DEMO_MODE';

    // If in demo mode, return a simulated output
    if (clientId === 'DEMO_MODE') {
      console.log('⚠️ Running in DEMO mode (no API credentials)');
      
      // Simple simulation of Java output
  const mockOutput = `🎯 DEMO MODE OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ This is simulated output. To compile real Java code:

1. Sign up for FREE at: https://www.jdoodle.com/compiler-api
2. Get your Client ID and Client Secret
3. Create a .env file in the project root:
   
   JDOODLE_CLIENT_ID=your_client_id_here
   JDOODLE_CLIENT_SECRET=your_client_secret_here

4. Restart the server: npm run server

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Your code (${code.length} characters):
${code.split('\n').slice(0, 10).join('\n')}
${code.split('\n').length > 10 ? '\n... (truncated)' : ''}

📥 Program input (stdin):
${stdin ? stdin.split('\n').slice(0, 10).join('\n') : '(none)'}

💡 The editor is working perfectly - just add your API key to compile!
`;
      
      return res.json({
        output: mockOutput,
        statusCode: 200,
        memory: '0',
        cpuTime: '0'
      });
    }

    // Make actual API request with provided credentials
    const response = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecret: clientSecret,
        script: code,
        language: language,
        versionIndex: versionIndex,
        stdin: stdin
      })
    });

    const result = await response.json();
    
    // Check if the API returned an error
    if (result.error) {
      console.error('❌ API Error:', result.error);
      return res.json({
        output: `❌ API Error: ${result.error}\n\n${result.error === 'Unauthorized' ? 
          '⚠️ Your API credentials are invalid or expired.\n\nPlease:\n1. Sign up at https://www.jdoodle.com/compiler-api\n2. Get new credentials\n3. Update your .env file' : 
          'Please check your API credentials and try again.'
        }`,
        statusCode: 400
      });
    }
    
    console.log('✅ Compilation successful');
    res.json(result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to compile code',
      message: error.message 
    });
  }
});

function generateJavaDriver({ title, codeSnippets, exampleTestcases }) {
  const javaCode = codeSnippets?.find(s => s.langSlug === 'java')?.code || '';
  const methodMatch = javaCode.match(/public\s+([\w\[\]<>]+)\s+(\w+)\s*\(([^)]*)\)/);
  const safeTitle = (title || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  if (!methodMatch) {
    return `class Main {\n    public static void main(String[] args) throws Exception {\n        Solution sol = new Solution();\n        System.out.println("${safeTitle}: implement your solution above!");\n    }\n}`;
  }

  const [, returnType, methodName, paramsStr] = methodMatch;
  const params = paramsStr.split(',').map(p => p.trim()).filter(Boolean);
  const paramCount = params.length;

  function toJavaLiteral(line) {
    line = line.trim();
    if (line.startsWith('[[')) {
      const inner = line.slice(2, -2);
      const rows = inner.split('],[').map(r => `{${r}}`);
      return `new int[][]{ ${rows.join(', ')} }`;
    }
    if (line.startsWith('[')) {
      const inner = line.slice(1, -1);
      if (!inner) return 'new int[]{}';
      if (inner.startsWith('"')) return `new String[]{${inner}}`;
      return `new int[]{${inner}}`;
    }
    return line;
  }

  function wrapPrint(callExpr) {
    if (returnType === 'void') return `        ${callExpr};`;
    if (returnType.includes('[][]')) return `        System.out.println(java.util.Arrays.deepToString(${callExpr}));`;
    if (returnType.endsWith('[]')) return `        System.out.println(java.util.Arrays.toString(${callExpr}));`;
    return `        System.out.println(${callExpr});`;
  }

  const exLines = (exampleTestcases || '').split('\n').map(l => l.trim()).filter(Boolean);
  let testCalls = '';
  for (let i = 0; i + paramCount <= exLines.length; i += paramCount) {
    const group = exLines.slice(i, i + paramCount);
    const args = group.map(l => toJavaLiteral(l)).join(', ');
    const n = i / paramCount + 1;
    testCalls += `\n        // Example ${n}\n${wrapPrint(`sol.${methodName}(${args})`)}\n`;
  }
  if (!testCalls) testCalls = `\n        // TODO: sol.${methodName}(...);\n`;

  return `class Main {\n    public static void main(String[] args) throws Exception {\n        Solution sol = new Solution();\n        // Problem: ${safeTitle}\n${testCalls}    }\n}`;
}

// LeetCode single problem endpoint
app.get('/api/problem/:slug', async (req, res) => {
  try {
    const { LeetCode } = await import('leetcode-query');
    const lc = new LeetCode();
    const problem = await lc.problem(req.params.slug);
    const javaTemplate = problem.codeSnippets?.find(s => s.langSlug === 'java')?.code || '';
    const driverCode = generateJavaDriver(problem);
    res.json({
      title: problem.title,
      difficulty: problem.difficulty,
      content: problem.content,
      topicTags: problem.topicTags,
      exampleTestcases: problem.exampleTestcases,
      javaTemplate,
      driverCode,
    });
  } catch (err) {
    console.error('LeetCode problem error:', err);
    res.status(500).json({ error: 'Failed to fetch problem', message: err?.message });
  }
});

// LeetCode problems proxy endpoint
app.get('/api/problems', async (req, res) => {
  try {
    const { LeetCode } = await import('leetcode-query');
    const lc = new LeetCode();
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);
    const offset = parseInt(req.query.offset) || 0;
    const data = await lc.problems({ limit, offset });
    res.json(data);
  } catch (err) {
    console.error('LeetCode problems error:', err);
    res.status(500).json({ error: 'Failed to fetch problems', message: err?.message });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`,
    availableEndpoints: {
      'GET /': 'Health check',
      'GET /api/health': 'API health check',
      'POST /api/compile': 'Compile Java code',
      'POST /api/gemini/review': 'AI review of code using Gemini',
      'POST /api/gemini/annotate': 'AI per-line annotations using Gemini'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`✓ CORS enabled for all origins`);
  console.log(`✓ Endpoint: POST http://localhost:${PORT}/api/compile`);
  console.log(`✓ Endpoint: POST http://localhost:${PORT}/api/gemini/review`);
  console.log(`✓ Endpoint: POST http://localhost:${PORT}/api/gemini/annotate`);
});

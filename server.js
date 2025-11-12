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

// Gemini code review endpoint
app.post('/api/gemini/review', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ error: 'Gemini API key missing. Set GEMINI_API_KEY in .env' });
    }

    const { code, language = 'java' } = req.body || {};
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.status(400).json({ error: 'No code provided' });
    }

    // Build concise, JSON-only prompt to avoid full solutions
    const maxPreview = 12000; // keep payload reasonable
    const snippet = code.length > maxPreview ? code.slice(0, maxPreview) + '\n... (truncated)' : code;
    const prompt = `You are a senior code reviewer. Analyze the following ${language} code.
Return ONLY strict JSON with this schema and no extra commentary:
{
  "issues": string[],
  "improvements": string[],
  "complexity": { "time": string, "space": string, "notes"?: string },
  "hints"?: string[]
}

Guidelines:
- If there are errors, provide short hints to fix them; DO NOT provide full solutions or full code.
- Provide clear, concise items. Keep each item under 180 characters.
- If complexity is not applicable, use "N/A".
- Be accurate but brief.

Code to analyze (between triple backticks):
\n\n\u0060\u0060\u0060${language}\n${snippet}\n\u0060\u0060\u0060`;

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      return res.status(resp.status).json({ error: 'Gemini API error', details: t });
    }

    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    function extractJson(text) {
      if (!text) return null;
      // Strip code fences if present
      const cleaned = text.replace(/^```(json)?/i, '').replace(/```$/i, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        // Try to find first JSON block
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const maybe = cleaned.slice(start, end + 1);
          try { return JSON.parse(maybe); } catch { /* ignore */ }
        }
      }
      return null;
    }

    const parsed = extractJson(raw) || {
      issues: [],
      improvements: [],
      complexity: { time: 'N/A', space: 'N/A' },
      hints: []
    };

    return res.json({ ok: true, analysis: parsed, raw });
  } catch (err) {
    console.error('Gemini review error:', err);
    return res.status(500).json({ error: 'Failed to analyze code', message: err?.message });
  }
});

// Gemini per-line annotation endpoint
app.post('/api/gemini/annotate', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'Gemini API key missing' });

    const { code, language = 'java' } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'code required' });
    }

    const lines = code.split('\n');
    const maxLines = 500;
    const truncated = lines.slice(0, maxLines).join('\n');
    const prompt = `You are a code reviewer. Return ONLY JSON matching this schema:
{
  "lines": [
    {
      "line": <number>,
      "issue": "<short problem or '' if none>",
      "hint": "<single short hint, no full solution>",
      "severity": "<info|warning|error>",
      "suggestion": "<one concise improvement>",
      "explanationSteps": ["Step 1 ...", "Step 2 ..."]
    }
  ]
}
Rules:
- Include only lines with a non-empty issue OR meaningful improvement.
- Keep hints short; do not provide full solutions.
- Steps must be incremental so a beginner can follow.
- Do not add extra top-level keys.
Language: ${language}
Code:
<<<CODE BEGIN>>>
${truncated}
<<<CODE END>>>`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 }
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      return res.status(resp.status).json({ error: 'Gemini request failed', details: t });
    }
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    function tryParse(jsonText) {
      try { return JSON.parse(jsonText); } catch { return null; }
    }
    let parsed = tryParse(text);
    if (!parsed) {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) parsed = tryParse(m[0]);
    }
    if (!parsed || !Array.isArray(parsed.lines)) {
      return res.json({ lines: [], truncated: lines.length > maxLines });
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
          : []
      }));
    return res.json({ lines: clean, truncated: lines.length > maxLines });
  } catch (err) {
    console.error('Gemini annotate error:', err);
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

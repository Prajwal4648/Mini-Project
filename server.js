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

// Proxy endpoint for JDoodle API
app.post('/api/compile', async (req, res) => {
  console.log('📨 Received compilation request');
  try {
    const { code, language = 'java', versionIndex = '4' } = req.body;
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
        versionIndex: versionIndex
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
      'POST /api/compile': 'Compile Java code'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`✓ CORS enabled for all origins`);
  console.log(`✓ Endpoint: POST http://localhost:${PORT}/api/compile`);
});

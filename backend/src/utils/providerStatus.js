require('dotenv').config();

function checkProviderStatus() {
  const providers = {
    'OpenAI': process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'),
    'Anthropic': process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-'),
    'Gemini': process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIzaSy'),
    'Mistral': process.env.MISTRAL_API_KEY && !process.env.MISTRAL_API_KEY.includes('example'),
    'Groq': process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith('gsk_'),
    'ElevenLabs': process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.length > 20,
    'Deepgram': process.env.DEEPGRAM_API_KEY && process.env.DEEPGRAM_API_KEY.length > 20,
    'Twilio': process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')
  };

  console.log('\n🔑 Provider Status:');
  console.log('==================');
  
  Object.entries(providers).forEach(([name, isReady]) => {
    const status = isReady ? '✅ Ready' : '❌ Missing API Key';
    console.log(`${name.padEnd(12)} ${status}`);
  });
  
  const readyCount = Object.values(providers).filter(Boolean).length;
  console.log(`\n📊 ${readyCount}/${Object.keys(providers).length} providers ready`);
  
  if (readyCount === 0) {
    console.log('\n⚠️  No providers configured. Add API keys to .env file to get started.');
  }
  
  console.log('==================\n');
}

module.exports = { checkProviderStatus };
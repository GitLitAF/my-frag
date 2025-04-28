// Simple script to test LiteLLM integration
import fetch from 'node-fetch';

const LITELLM_API_KEY = 'sk-oeD642K51JJvgL2QA9hu-w';
const LITELLM_BASE_URL = 'https://nebularelayoceantree-5e17c78de697.herokuapp.com';

async function testLiteLLM() {
  try {
    console.log('Sending request to LiteLLM...');
    
    const response = await fetch(`${LITELLM_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LITELLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: 'Hello! Please write a haiku about coding.' }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from LiteLLM:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Response from LiteLLM:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testLiteLLM();
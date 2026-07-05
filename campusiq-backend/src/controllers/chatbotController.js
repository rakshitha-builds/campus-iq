// Proxies chat requests to Groq so the API key stays on the server and is
// never shipped to the browser. The frontend still builds the system prompt
// from live campus data (that data isn't secret — only the API key is).
const askChatbot = async (req, res) => {
  try {
    const { systemPrompt, userMessage } = req.body;

    if (!userMessage) {
      return res.status(400).json({ message: 'A message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Chatbot is not configured on the server (missing GROQ_API_KEY).' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful campus assistant.' },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      return res.json({ reply: data.choices[0].message.content });
    }

    console.error('Groq error:', data);
    return res.status(502).json({ message: "Couldn't get a response from the AI service." });
  } catch (err) {
    console.error('Chatbot proxy error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { askChatbot };
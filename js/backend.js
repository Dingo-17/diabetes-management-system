const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.DEEPSEEK_API_KEY;
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';


// const medicalSystemPrompt = `You are a specialized medical AI assistant focused on diabetes management and transplant medicine. 
                        
// Key guidelines:
// - Provide accurate, evidence-based medical information
// - Always emphasize the importance of consulting healthcare providers
// - Focus on diabetes management, transplant medicine, and immunosuppression
// - Be supportive but maintain professional medical boundaries
// - If asked about specific medications or dosages, remind users to consult their doctors
// - Provide educational information while emphasizing personalized care
                        
// Remember: You are providing educational information, not replacing medical consultation.`;

// Replace the medicalSystemPrompt (around line 20) with this enhanced version:
const medicalSystemPrompt = `You are a specialized medical AI assistant focused on diabetes management and transplant medicine, with expertise in American Diabetes Association (ADA) guidelines.

CORE EXPERTISE & GUIDELINES:
- Follow the latest American Diabetes Association (ADA) Standards of Medical Care in Diabetes
- Reference ADA clinical practice recommendations when applicable
- Use ADA-recommended blood glucose targets and HbA1c goals
- Apply ADA guidelines for diabetes medications, screening, and management protocols
- Incorporate ADA recommendations for diabetes complications prevention and management

KEY CLINICAL PARAMETERS (per ADA guidelines):
- HbA1c targets: Generally <7% for most adults, individualized based on patient factors
- Preprandial glucose: 80-130 mg/dL (4.4-7.2 mmol/L)
- Postprandial glucose: <180 mg/dL (<10.0 mmol/L)
- Blood pressure: <140/90 mmHg (or <130/80 mmHg if tolerated)
- LDL cholesterol: <100 mg/dL (<70 mg/dL for high cardiovascular risk)

MEDICAL GUIDELINES:
- Provide accurate, evidence-based medical information following ADA standards
- Always emphasize the importance of consulting healthcare providers
- Focus on diabetes management, transplant medicine, and immunosuppression
- Be supportive but maintain professional medical boundaries
- Reference specific ADA recommendations when discussing diabetes care
- If asked about specific medications or dosages, remind users to consult their doctors
- Provide educational information while emphasizing personalized care

IMPORTANT DISCLAIMERS:
- Always remind users that ADA guidelines should be individualized by healthcare providers
- Emphasize that these are general guidelines and may not apply to every patient
- Recommend consultation with endocrinologists and diabetes care teams
- Note that transplant patients may have modified diabetes management protocols

Remember: You are providing educational information based on ADA guidelines, not replacing medical consultation. Always encourage patients to work with their healthcare team for personalized care.`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        console.log('Received message:', message);

        // Around line 33, update the headers in your fetch request:
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                // 'HTTP-Referer': process.env.NODE_ENV === 'production' ? 'https://your-app-name.onrender.com' : 'http://localhost:3001',
                // 'X-Title': 'Diabetes Management System' // Optional: your app name
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo', // OpenRouter model format
                messages: [
                    {
                        role: 'system',
                        content: medicalSystemPrompt
                    },
                    {
                        role: 'user', 
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        // const response = await fetch(DEEPSEEK_API_URL, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${API_KEY}`
        //     },
        //     body: JSON.stringify({
        //         model: 'deepseek-chat',
        //         messages: [
        //             {
        //                 role: 'system',
        //                 content: `You are a specialized medical AI assistant focused on diabetes management and transplant medicine. 
                        
        //                 Key guidelines:
        //                 - Provide accurate, evidence-based medical information
        //                 - Always emphasize the importance of consulting healthcare providers
        //                 - Focus on diabetes management, transplant medicine, and immunosuppression
        //                 - Be supportive but maintain professional medical boundaries
        //                 - If asked about specific medications or dosages, remind users to consult their doctors
        //                 - Provide educational information while emphasizing personalized care
                        
        //                 Remember: You are providing educational information, not replacing medical consultation.`
        //             },
        //             {
        //                 role: 'user',
        //                 content: message
        //             }
        //         ],
        //         max_tokens: 1000,
        //         temperature: 0.7,
        //         stream: false
        //     })
        // });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', response.status, errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid API response format');
        }

        const aiResponse = data.choices[0].message.content;
        console.log('AI Response generated successfully');

        res.json({ 
            response: aiResponse,
            status: 'success' 
        });

    } catch (error) {
        console.error('Chat API error:', error);
        console.error('API_KEY exists:', !!API_KEY);
        console.error('API_KEY length:', API_KEY ? API_KEY.length : 0);
        // Provide fallback response
        const fallbackResponse = `I apologize, but I'm currently experiencing technical difficulties. 
        
For immediate medical questions:
- Contact your healthcare provider
- For transplant-related questions, reach out to your transplant team
- For diabetes management, consult your endocrinologist

The calculator above can still help with failed transplant protocols.`;

        res.json({ 
            response: fallbackResponse,
            status: 'fallback',
            error: 'AI service temporarily unavailable'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        apiKeyConfigured: !!API_KEY 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📋 API Key configured: ${!!API_KEY}`);
    console.log(`🏥 Medical AI Chat ready for diabetes management assistance`);
});
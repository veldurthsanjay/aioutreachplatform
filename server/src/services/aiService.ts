import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { Campaign, Lead } from '../types';
import { storageService } from './storageService';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface GeneratedMessageResult {
  subject?: string;
  body: string;
}

export const aiService = {
  getApiKey(): { key: string; provider: string; model: string } {
    const integrations = storageService.getIntegrations();
    const settings = storageService.getSettings();

    // Check environment variables first
    const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    let model = process.env.AI_MODEL || integrations.ai.model || 'google/gemini-2.5-flash';
    if (model === 'google/gemini-2.0-flash-001' || model === 'google/gemini-1.5-flash') {
      model = 'google/gemini-2.5-flash';
    }

    if (openRouterKey && (openRouterKey.startsWith('sk-or-') || integrations.ai.provider === 'openrouter')) {
      return {
        key: openRouterKey,
        provider: 'openrouter',
        model
      };
    }

    if (geminiKey) {
      return {
        key: geminiKey,
        provider: 'gemini',
        model: integrations.ai.model || 'gemini-1.5-flash'
      };
    }

    if (openaiKey) {
      return {
        key: openaiKey,
        provider: 'openai',
        model: integrations.ai.model || 'gpt-4o-mini'
      };
    }

    if (openRouterKey) {
      return {
        key: openRouterKey,
        provider: 'openrouter',
        model
      };
    }

    return {
      key: '',
      provider: integrations.ai.provider || 'openrouter',
      model
    };
  },

  async generateOutreachMessage(
    campaign: Campaign,
    lead: Lead,
    channel: 'email' | 'whatsapp'
  ): Promise<GeneratedMessageResult> {
    const { key, provider, model } = this.getApiKey();

    if (!key) {
      throw new Error('No AI API Key configured. Please add your API key in Integrations.');
    }

    const settings = storageService.getSettings();
    const temperature = settings.aiTemperature ?? 0.7;

    const systemPrompt = `You are a world-class B2B outreach and copywriting specialist. 
Your goal is to write hyper-personalized, non-spammy, highly effective ${channel} outreach messages.
Follow these rules strictly:
1. Speak directly to the contact person, referring specifically to their company, category/industry, and location if available.
2. Focus on clear value proposition and pain points, avoiding generic buzzwords or robotic templates.
3. Keep the tone ${campaign.tone}.
4. Target Objective: ${campaign.objective}.
5. Campaign Instructions & Context: ${campaign.instructions || 'Focus on relevant value and a clear, low-friction call to action.'}
6. If channel is 'email', output JSON in this EXACT format:
{"subject": "Your compelling subject line here", "body": "Your personalized email body here"}
7. If channel is 'whatsapp', output JSON in this EXACT format:
{"body": "Your crisp, friendly, conversational WhatsApp message here (with natural line breaks)"}
Do NOT include any markdown code blocks or backticks in the response. Return pure valid JSON only.`;

    const userPrompt = `Campaign Details:
- Name: ${campaign.name}
- Product/Service: ${campaign.product}
- Target Audience: ${campaign.audience}
- Desired Objective: ${campaign.objective}
- Tone: ${campaign.tone}
- Additional Guidance: ${campaign.instructions}

Target Lead Details:
- Contact Name: ${lead.contactName || 'Valued Partner'}
- Business Name: ${lead.businessName || 'Your Company'}
- Category / Industry: ${lead.category || 'Industry Leader'}
- Location: ${lead.location || 'Local area'}
- Website: ${lead.website || 'N/A'}
- Custom Notes: ${lead.notes || 'None'}

Channel: ${channel.toUpperCase()}

Generate the personalized outreach message now in pure JSON format.`;

    try {
      if (provider === 'openrouter' || key.startsWith('sk-or-')) {
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: model || 'google/gemini-2.5-flash',
            max_tokens: 1000,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              'HTTP-Referer': 'http://localhost:5000',
              'X-Title': 'AI Outreach Platform',
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const content = response.data.choices?.[0]?.message?.content;
        return this.parseJsonResponse(content, channel);
      } else if (provider === 'openai') {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature,
            response_format: { type: 'json_object' }
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const content = response.data.choices?.[0]?.message?.content;
        return this.parseJsonResponse(content, channel);
      } else if (provider === 'gemini') {
        const geminiModel = model.includes('gemini') ? model : 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`;

        const response = await axios.post(
          url,
          {
            contents: [
              {
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
              }
            ],
            generationConfig: {
              temperature,
              responseMimeType: 'application/json'
            }
          },
          { timeout: 30000 }
        );

        const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        return this.parseJsonResponse(content, channel);
      } else {
        // Default to OpenRouter endpoint
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature
          },
          {
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        const content = response.data.choices?.[0]?.message?.content;
        return this.parseJsonResponse(content, channel);
      }
    } catch (error: any) {
      console.error('[AI Generation Error]:', error.response?.data || error.message);
      const errMsg = error.response?.data?.error?.message || error.message || 'AI request failed';
      throw new Error(`AI generation failed: ${errMsg}`);
    }
  },

  async classifyReplyAndSuggest(
    inboundText: string,
    campaign?: Campaign
  ): Promise<{ sentiment: 'positive' | 'question' | 'objection' | 'unsubscribe' | 'neutral'; suggestedReply: string }> {
    const { key, provider, model } = this.getApiKey();

    if (!key) {
      return {
        sentiment: 'neutral',
        suggestedReply: 'Thank you for your response! Let me know if you would like more information or a quick demo.'
      };
    }

    const prompt = `Analyze this incoming reply from a lead and perform 2 tasks:
1. Classify sentiment strictly into one of: 'positive', 'question', 'objection', 'unsubscribe', 'neutral'
2. Generate a professional, helpful suggested reply.

Campaign Context:
- Product: ${campaign?.product || 'Our Solution'}
- Objective: ${campaign?.objective || 'Schedule a call or demo'}

Incoming Lead Message:
"${inboundText}"

Return pure JSON only:
{"sentiment": "positive|question|objection|unsubscribe|neutral", "suggestedReply": "Suggested response text here"}`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model || 'google/gemini-2.5-flash',
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      );

      const parsed = JSON.parse(response.data.choices?.[0]?.message?.content || '{}');
      return {
        sentiment: parsed.sentiment || 'neutral',
        suggestedReply: parsed.suggestedReply || 'Thank you for reaching out!'
      };
    } catch (err) {
      return {
        sentiment: 'neutral',
        suggestedReply: 'Thank you for your response! Would you be available for a brief conversation this week?'
      };
    }
  },

  parseJsonResponse(rawContent: string, channel: 'email' | 'whatsapp'): GeneratedMessageResult {
    if (!rawContent) {
      throw new Error('Received empty response from AI model');
    }

    let cleaned = rawContent.trim();
    // Remove markdown code fences if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    cleaned = cleaned.trim();

    try {
      const parsed = JSON.parse(cleaned);
      return {
        subject: parsed.subject || (channel === 'email' ? 'Quick question regarding your business' : undefined),
        body: parsed.body || cleaned
      };
    } catch {
      // Fallback if model output raw text
      return {
        subject: channel === 'email' ? 'Quick question regarding collaboration' : undefined,
        body: cleaned
      };
    }
  }
};

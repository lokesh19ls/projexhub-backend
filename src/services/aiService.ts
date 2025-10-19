import OpenAI from 'openai';

// Only initialize OpenAI if API key is provided
let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

export class AIService {
  async generateProjectIdeas(
    department: string,
    technology: string[],
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ) {
    if (!openai) {
      throw new Error('AI service not configured. Please contact support.');
    }

    const prompt = `Generate 5 creative and practical final year project ideas for a ${department} student.
    Technologies to consider: ${technology.join(', ')}
    Difficulty level: ${difficulty}
    
    For each project idea, provide:
    1. Project Title
    2. Brief Description (2-3 sentences)
    3. Key Features (3-4 features)
    4. Technologies Required
    5. Estimated Duration (in months)
    
    Format the response as JSON array with these fields: title, description, features, technologies, duration`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates creative and practical project ideas for college students.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response || '[]');
    } catch (error) {
      console.error('Error generating project ideas:', error);
      throw new Error('Failed to generate project ideas');
    }
  }

  async getProjectSuggestions(currentProject: string) {
    if (!openai) {
      throw new Error('AI service not configured. Please contact support.');
    }

    const prompt = `Based on this project idea: "${currentProject}"
    
    Provide suggestions for:
    1. Improvements or enhancements
    2. Additional features to consider
    3. Potential challenges and solutions
    4. Similar projects for reference
    
    Format as JSON with fields: improvements, additionalFeatures, challenges, similarProjects`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful project advisor for college students.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response || '{}');
    } catch (error) {
      console.error('Error getting project suggestions:', error);
      throw new Error('Failed to get project suggestions');
    }
  }
}


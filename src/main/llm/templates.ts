export const DEFAULT_TITLE_GENERATION_PROMPT_TEMPLATE = `### Task:
Generate a concise, 3-5 word title with an emoji summarizing the chat history.
### Guidelines:
- The title should clearly represent the main theme or subject of the conversation.
- Use emojis that enhance understanding of the topic, but avoid quotation marks or special formatting.
- The emoji should go first in the title.
- Write the title in the chat's primary language; default to English if multilingual.
- Prioritize accuracy over excessive creativity; keep it clear and simple.
- Your entire response must consist solely of the JSON object, without any introductory or concluding text.
- The output must be a single, raw JSON object, without any markdown code fences or other encapsulating text.
- Ensure no conversational text, affirmations, or explanations precede or follow the raw JSON output, as this will cause direct parsing failure.
- Never include anything else than a single JSON object described in the output section. It will cause parsing failure.
### Output:
JSON format: { "title": "your concise title here" }
### Examples:
- { "title": "📉 Stock Market Trends" },
- { "title": "🍪 Perfect Chocolate Chip Recipe" },
- { "title": "🎵 Evolution of Music Streaming" },
- { "title": "🧑‍💻 Remote Work Productivity Tips" },
- { "title": "💊 Artificial Intelligence in Healthcare" },
- { "title": "🎮 Video Game Development Insights" }
### Chat History:
{{MESSAGES}}`

export const DEFAULT_TITLE_GENERATION_PROMPT_THOUGHTS = `<think>
We are given a chat history. The user asks: "{{USER_MESSAGE}}"
We need a concise title of 3-5 words with an emoji.
I need to start with an emoji.
The requirement: 3-5 words. The emoji is not counted as a word.
We output the title only, no other text.
We output in JSON format: { "title": "your concise title here" }.</think>
`

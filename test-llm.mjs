import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import 'dotenv/config';

console.log('Testing anthropic with key length:', process.env.ANTHROPIC_API_KEY?.length);

async function main() {
    try {
        const { text } = await generateText({
            model: anthropic('claude-3-5-haiku-20241022'),
            prompt: 'say hello',
        });
        console.log('Success:', text);
    } catch (err) {
        console.error('Failure:', err.message, '|', err.name);
    }
}
main();

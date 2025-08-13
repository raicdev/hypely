import { Hono } from 'hono';
import { serve } from 'bun';

const app = new Hono();

app.get('/', (c) => c.text('Hello World'));

serve({
    port: 3000,
    fetch: app.fetch,
});

console.log('Hono server running on http://localhost:3000');

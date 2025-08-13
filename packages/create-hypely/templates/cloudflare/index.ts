import { App, edge } from "hypely/edge";

const app = new App();

app.on("GET", "/", (c) => c.text("Hello World"));

edge.enable(app); // Required on Cloudflare Workers
export default app;
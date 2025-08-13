import { App, vercel } from "hypely";

const app = new App();

app.on("GET", "/", (c) => c.text("Hello World"));

export default vercel(app);
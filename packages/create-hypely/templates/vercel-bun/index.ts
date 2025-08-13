import { App, vercel } from "hypely";

const app = new App();

app.on("GET", "/", (c) => c.text("Hello World"));

app.on("GET", "/file", async (c) => {
    try {
        const content = await Bun.file("file.txt").text();
        return c.text(content);
    } catch {
        return c.text("File not found", 404);
    }
});

export default vercel(app);
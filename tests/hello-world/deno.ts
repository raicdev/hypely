import { App, denoAdapter } from "@/core/app";

const app = new App();

app.on("GET", "/", (ctx) => {
    ctx.text("Hello World");
});

app.listen(denoAdapter, 3000);

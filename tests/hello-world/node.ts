import { nodeAdapter } from "@/adapters/node";
import { App } from "@/core/app";

const app = new App();

app.on("GET", "/", (ctx, next) => {
    ctx.text("Hello World");
});

app.listen(nodeAdapter, 3000);

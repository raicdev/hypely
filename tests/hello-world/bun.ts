import { bunAdapter } from "@/adapters/bun";
import { App } from "@/core/app";

const app = new App();

app.on("GET", "/", (ctx) => {
    return ctx.text("Hello World");
});

app.listen(bunAdapter, 3000);

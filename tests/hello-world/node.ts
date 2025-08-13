// hypely-bigjson.ts
import { nodeAdapter } from "@/adapters/node";
import { App } from "@/core/app";

const app = new App();

// ルート登録直後に router の状態を出力
app.on("GET", "/", (ctx, next) => {
    ctx.text("Hello World");
});

app.listen(nodeAdapter, 3000);

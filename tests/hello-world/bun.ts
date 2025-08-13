// hypely-bigjson.ts
import { bunAdapter } from "@/adapters/bun";
import { App } from "@/core/app";

const app = new App();

// ルート登録直後に router の状態を出力
app.on("GET", "/", (ctx, next) => {
    ctx.text("Hello World");
});

app.listen(bunAdapter, 3000);

// hypely-bigjson.ts
import { nodeAdapter } from "@/adapters/node";
import { App } from "@/core/app";

const app = new App();

// ルート登録直後に router の状態を出力
app.fast("GET", "/", {
    raw: true,
    headers: {
        "Content-Type": "text/plain",
    },
    body: new Uint8Array(Buffer.from("Hello World")),
    status: 200
    
});

app.listen(nodeAdapter, 3000);

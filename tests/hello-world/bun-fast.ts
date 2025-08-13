import { bunAdapter } from "@/adapters/bun";
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

app.listen(bunAdapter, 3000);

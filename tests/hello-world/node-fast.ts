import { nodeAdapter } from "@/adapters/node";
import { App } from "@/core/app";

const app = new App();

app.fast("GET", "/", {
    raw: true,
    headers: {
        "Content-Type": "text/plain",
    },
    body: new Uint8Array(Buffer.from("Hello World")),
    status: 200
    
});

app.listen(nodeAdapter, 3000);

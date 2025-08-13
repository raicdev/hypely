import { bunAdapter } from "@/adapters/bun";
import { App } from "@/core/app";

const app = new App();

const body = new Uint8Array(Buffer.from("Hello World"));

app.fast("GET", "/", {
    raw: true,
    headers: {
        "Content-Type": "text/plain",
    },
    body,
    status: 200

});

app.listen(bunAdapter, 3000);

import { App, bunAdapter } from "hypely";

const app = new App();

const body = new Uint8Array(Buffer.from("Hello World")); //

// Warning: Fast mode does not support Middleware
app.fast("GET", "/", {
    raw: true,
    headers: {
        "Content-Type": "text/plain",
    },
    body,
    status: 200
}); // You can use `new Response()` here, but use `body` directly for better performance.


app.listen(bunAdapter, 3000);
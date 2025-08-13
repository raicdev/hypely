import { App, bunAdapter } from "hypely";

const app = new App();

app.on("GET", "/", (c) => c.text("Hello World"));

app.listen(bunAdapter, 3000);
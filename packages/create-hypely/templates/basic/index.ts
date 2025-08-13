import { App, nodeAdapter } from "hypely";

const app = new App();

app.on("GET", "/", (c) => c.text("Hello World"));

app.listen(nodeAdapter, 3000);
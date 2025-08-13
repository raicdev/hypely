import { App } from "@mini/core/app";

const app = new App();

app.on("GET", "/", (c) => c.text("Hello World"));

app.listen(3000);

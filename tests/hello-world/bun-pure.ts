Bun.serve({
  port: 3000,
  fetch() {
    return new Response("Hello World", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
});

console.log("Pure Bun server running on http://localhost:3000");

# ⚡ Hypely — Ultra-fast TypeScript Web Framework

A blazing-fast TypeScript web framework with **dual routing modes**:

- **`app.on()`** → Full-featured router with middleware support (25.9k+/sec avg)
- **`app.fast()`** → Direct hot-path bypass for extreme performance (26.2k+/sec avg)

```ts
import { App, bunAdapter } from "hypely";
const app = new App();

app.on("GET", "/", (c) => c.text("Hello World"));

app.listen(bunAdapter, 3000);
```
> Simple `Hello World` response with Bun adapter

---

## 🔥 Benchmark

| Item                    | Hypely (context) | Hypely Fast Mode | Hono     | Express     | Bun       |
| --------------------- | ---------------- | ---------------- | -------- | ----------- | --------- |
| **Latency (Avg)**     | 7.24 ms          | **7.12 ms**      | 8.13 ms  | 9.5 ms      | 9.35 ms   |
| **Latency (50%)**     | 7 ms             | **7 ms**         | 8 ms     | 9 ms        | 8 ms      |
| **Latency (97.5%)**   | 11 ms            | **9 ms**         | 12 ms    | 13 ms       | 15 ms     |
| **Latency (99%)**     | 15 ms            | **11 ms**        | 16 ms    | 15 ms       | 19 ms     |
| **Latency (Max)**     | **67 ms**        | 82 ms            | 91 ms    | 71 ms       | 103 ms    |
| **Req/Sec (Avg)**     | 25,952.8         | **26,248**       | 23,237.6 | 20,028.2    | 20,365.41 |
| **Req/Sec (50%)**     | 26,415           | **26,511**       | 22,639   | 20,367      | 20,447    |
| **Req/Sec (97.5%)**   | **28,687**       | 27,167           | 26,255   | 21,071      | 25,679    |
| **Req/Sec (Min)**     | 21,605           | **21,480**       | 19,605   | 13,754      | 13,209    |
| **Bytes/Sec (Avg)**   | 2.15 MB          | **2.97 MB**      | 2.95 MB  | **3.85 MB** | 2.3 MB    |
| **Bytes/Sec (50%)**   | 2.19 MB          | **3 MB**         | 2.88 MB  | **3.91 MB** | 2.31 MB   |
| **Bytes/Sec (97.5%)** | 2.38 MB          | **3.07 MB**      | 3.33 MB  | **4.04 MB** | 2.9 MB    |
| **Total Requests**    | 519k             | **525k**         | 465k     | 401k        | 408k      |
| **Total Data Read**   | 43.1 MB          | **59.3 MB**      | 59 MB    | **76.9 MB** | 46 MB     |

> The above benchmarks were measured using `autocannon -c 200 -d 20 http://127.0.0.1:3000/` against an endpoint returning "Hello World" with `text/plain`.  
> All frameworks were run on Bun for a fair comparison.


# ✨ Features

- **Bun & Node.js support**
- Type-safe JSON responses via ``fast-json-stringify``
- Middleware system with ``app.use()``
- High-performance routing
- **Fast Mode** for ultra-low latency hot paths
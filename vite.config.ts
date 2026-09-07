import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function emailApiPlugin(): Plugin {
  return {
    name: "email-api-plugin",
    configureServer(server) {
      server.middlewares.use("/api/send-email", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let body = "";
        req.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });

        req.on("end", async () => {
          try {
            const { processSendEmail } = await import("./api/send-email.ts");
            const payload = JSON.parse(body);
            const result = await processSendEmail(payload);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          } catch (err: any) {
            console.error("API Email Error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message || "Failed to send email" }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    base: process.env.VITE_BASE_PATH || "./",
    plugins: [react(), tailwindcss(), emailApiPlugin()],
    server: {
      watch: {
        ignored: ["**/public/Videos/**"],
      },
    },
  };
});

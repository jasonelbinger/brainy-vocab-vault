import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(distPath)) {
    console.warn(`Build directory not found: ${distPath}, serving from client`);
    // Fallback to serving from client directory
    const clientPath = path.resolve(process.cwd(), "client");
    if (fs.existsSync(clientPath)) {
      app.use(express.static(clientPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(clientPath, "index.html"));
      });
      return;
    }
    throw new Error("No build directory or client directory found");
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
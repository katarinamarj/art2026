import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Art 2026 backend radi" });
});

const PORT: number = Number(process.env.PORT) || 5000;

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

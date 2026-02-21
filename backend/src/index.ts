import express, { Request, Response } from "express";
import cors from "cors";
import manifestacijaRoutes from './routes/manifestacija.routes.js';
import prijavaRoutes from "./routes/prijava.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/manifestacija', manifestacijaRoutes);
app.use("/api/prijave", prijavaRoutes);

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Art 2026 backend radi" });
});

const PORT: number = Number(process.env.PORT) || 5000;

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

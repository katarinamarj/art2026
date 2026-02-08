import { useEffect, useState } from "react";

type Health = { status: string; message: string };

export default function App() {
  const [data, setData] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Art 2026</h1>
      <pre>{data ? JSON.stringify(data, null, 2) : "Loading..."}</pre>
    </div>
  );
}

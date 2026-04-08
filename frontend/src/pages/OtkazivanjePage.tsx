import { useState } from "react";
import { otkaziPrijavu } from "../services/otkaziPrijavu.service";
import "../styles/OtkazivanjePage.css";

export default function OtkazivanjePage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    if (!email || !token) {
      setError("Email i token su obavezni.");
      return;
    }

    try {

      const res = await otkaziPrijavu({
        email,
        token,
      });

      setSuccess(res.poruka);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="otkazivanje-container">
  <h1 className="otkazivanje-title">OTKAZIVANJE PRIJAVE</h1>

  <form className="otkazivanje-form" onSubmit={handleSubmit}>
    <div className="otkazivanje-section">
      <div className="otkazivanje-grid">
        
        <div className="otkazivanje-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="otkazivanje-field">
          <label>Token prijave</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>

      </div>
    </div>

    <button className="otkazivanje-btn" type="submit">
      Otkaži prijavu
    </button>
  </form>
   {error && <div className="otkazivanje-error">{error}</div>}
  {success && <div className="otkazivanje-success">{success}</div>}
</div>
  );
}
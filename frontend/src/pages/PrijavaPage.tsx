import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/PrijavaPage.css";
import type { KreirajPrijavuRequest, KreirajPrijavuResponse,TipDana } from "../types/prijava.types";
import { createPrijava } from "../services/prijava.service";
import { daLiJeValidanEmail } from "../utils/validation";

export default function PrijavaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const manifestacijaId = Number(id);

  const [ime, setIme] = useState("");
  const [prezime, setPrezime] = useState("");
  const [profesija, setProfesija] = useState("");
  const [adresa1, setAdresa1] = useState("");
  const [adresa2, setAdresa2] = useState("");
  const [postanskiBroj, setPostanskiBroj] = useState("");
  const [mesto, setMesto] = useState("");
  const [drzava, setDrzava] = useState("");
  const [email, setEmail] = useState("");
  const [potvrdaEmail, setPotvrdaEmail] = useState("");

  const [dani, setDani] = useState<TipDana[]>([]);
  const [brojOsoba, setBrojOsoba] = useState<number>(1);
  const [promoKod, setPromoKod] = useState("");

  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] =
    useState<KreirajPrijavuResponse | null>(null);

  const toggleDan = (dan: TipDana) => {
    setDani((prev) =>
      prev.includes(dan) ? prev.filter((d) => d !== dan) : [...prev, dan]
    );
  };

  const payload: KreirajPrijavuRequest = useMemo(
    () => ({
      manifestacijaId,
      ime,
      prezime,
      profesija: profesija.trim() ? profesija : undefined,
      adresa1,
      adresa2: adresa2.trim() ? adresa2 : undefined,
      postanskiBroj,
      mesto,
      drzava,
      email,
      potvrdaEmail,
      dani,
      brojOsoba,
      promoKod: promoKod.trim() ? promoKod : undefined,
    }),
    [
      manifestacijaId,
      ime,
      prezime,
      profesija,
      adresa1,
      adresa2,
      postanskiBroj,
      mesto,
      drzava,
      email,
      potvrdaEmail,
      dani,
      brojOsoba,
      promoKod,
    ]
  );

  const validate = () => {
    if (!ime.trim()) return "Niste uneli ime.";
    if (!prezime.trim()) return "Niste uneli prezime.";
    if (!adresa1.trim()) return "Niste uneli adresu.";
    if (!postanskiBroj.trim()) return "Niste uneli poštanski broj.";
    if (!mesto.trim()) return "Niste uneli mesto.";
    if (!drzava.trim()) return "Niste uneli državu.";
    if (!email.trim()) return "Niste uneli email.";
    if (!potvrdaEmail.trim()) return "Potvrdite email.";

    const e1 = email.trim().toLowerCase();
    const e2 = potvrdaEmail.trim().toLowerCase();
    if (!daLiJeValidanEmail(email)) return "Email nije u ispravnom formatu.";
    if (e1 !== e2) return "Email i potvrda email-a se ne poklapaju.";

    if (!dani.length)
      return "Niste izabrali dane.";


    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      const res = await createPrijava(payload);
      setSuccess(res);
    } catch (err: any) {
      setError(err?.message ?? "Greška.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="prijava-container">
        <h1 className="title">Prijava uspešna</h1>

        <div className="success-box">
          <p><b>Token:</b> {success.token}</p>
          <p><b>Promo kod:</b> {success.generisaniPromoKod}</p>
          <p><b>Ukupna cena:</b> {success.ukupnoDugovanje.toFixed(2)} RSD</p>
        </div>

        <button className="btn" onClick={() => navigate("/")}>
          Nazad na početnu stranu
        </button>
      </div>
    );
  }

  return (
    <div className="prijava-container">
      <h1 className="title">Prijava na manifestaciju</h1>

      <form className="form" onSubmit={onSubmit}>
        <div className="section">
          <h3>Izaberi dane</h3>
          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={dani.includes("Slikarstvo")}
                onChange={() => toggleDan("Slikarstvo")}
              />
              Slikarstvo
            </label>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={dani.includes("Fotografija")}
                onChange={() => toggleDan("Fotografija")}
              />
              Fotografija
            </label>
          </div>
        </div>

        <div className="section">
          <h3>Broj osoba</h3>
          <div className="field">
            <input
              type="number"
              min={1}
              value={brojOsoba}
              onChange={(e) =>
                setBrojOsoba(
                  Math.max(1, Math.floor(Number(e.target.value) || 1))
                )
              }
            />
          </div>
        </div>

        <div className="section">
          <h3>Promo kod za popust</h3>
          <div className="field">
            <input
              value={promoKod}
              onChange={(e) => setPromoKod(e.target.value)}
            />
          </div>
        </div>

        <div className="section">
          <h3>Osnovni podaci</h3>
          <div className="grid">
            <Input label="Ime" value={ime} onChange={setIme} />
            <Input label="Prezime" value={prezime} onChange={setPrezime} />
            <Input label="Profesija" value={profesija} onChange={setProfesija} />
            <Input label="Adresa 1" value={adresa1} onChange={setAdresa1} />
            <Input label="Adresa 2" value={adresa2} onChange={setAdresa2} />
            <Input label="Poštanski broj" value={postanskiBroj} onChange={setPostanskiBroj} />
            <Input label="Mesto" value={mesto} onChange={setMesto} />
            <Input label="Država" value={drzava} onChange={setDrzava} />
            <Input label="Email" value={email} onChange={setEmail} />
            <Input label="Potvrda email" value={potvrdaEmail} onChange={setPotvrdaEmail} />
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <button className="btn" type="submit">
           Prijavi se
        </button>
      </form>
    </div>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{props.label}</label>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </div>
  );
}
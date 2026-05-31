import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PrijavaPage.css";
import type {IzmeniPrijavuRequest, IzmeniPrijavuResponse, TipDana } from "../types/prijava.types";
import { izmeniPrijavu } from "../services/izmena.service";
import { daLiJeValidanEmail } from "../utils/validation";

export default function IzmenaPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const [dani, setDani] = useState<TipDana[]>([]);
  const [brojOsoba, setBrojOsoba] = useState(1);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] =
    useState<IzmeniPrijavuResponse | null>(null);

  const toggleDan = (dan: TipDana) => {
    setDani((prev) =>
      prev.includes(dan)
        ? prev.filter((d) => d !== dan)
        : [...prev, dan]
    );
  };

  const validate = () => {
    if (!email.trim()) return "Unesite email.";
    if (!daLiJeValidanEmail(email))
      return "Email nije ispravan.";

    if (!token.trim()) return "Unesite token.";

    if (!dani.length)
      return "Izaberite najmanje jedan dan.";

    return null;
  };

  const onSubmit = async ( e: React.FormEvent) => { 
    e.preventDefault();

    setError(null);

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: IzmeniPrijavuRequest = {email, token, dani, brojOsoba };

    try {
      const response =
        await izmeniPrijavu(payload);

      setSuccess(response);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (success) {
    return (
      <div className="prijava-container">
        <h1 className="title">
          Izmenjena rezervacija
        </h1>

        <div className="success-box">
          <p>
            <b>Ukupna cena:</b>{" "}
            {success.ukupnoDugovanje.toFixed(2)}
            {" "}RSD
          </p>

          <p>
            <b>Popust na paket:</b>{" "}
            {success.popustNaPaket ? `${success.popustNaPaket}%` : "/"}
          </p>

          <p>
            <b>Popust na grupu:</b>{" "}
            {success.popustNaGrupu ? `${success.popustNaGrupu}%` : "/"}
          </p>

          <p>
            <b>Promo popust:</b>{" "}
            {success.popustPromoKod ? `${success.popustPromoKod}%` : "/"}
          </p>
        </div>

        <button className="btn" onClick={() => navigate("/")}>
          Nazad na početnu stranicu
        </button>
      </div>
    );
  }

  return (
    <div className="prijava-container">
      <h1 className="title">
        Izmena rezervacije
      </h1>

      <form className="form" onSubmit={onSubmit}>
        <div className="section">
            <Input
              label="Email"
              value={email}
              onChange={setEmail}
            />
        </div>

        <div className="section">
            <Input
              label="Token"
              value={token}
              onChange={setToken}
            />
        </div>

        <div className="section">
          <h3>Dani</h3>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={dani.includes(
                "Slikarstvo"
              )}
              onChange={() =>
                toggleDan("Slikarstvo")
              }
            />
            Slikarstvo
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={dani.includes(
                "Fotografija"
              )}
              onChange={() =>
                toggleDan("Fotografija")
              }
            />
            Fotografija
          </label>
        </div>

        <div className="section">
          <h3>Broj osoba</h3>
          <input
            type="number"
            min={1}
            value={brojOsoba}
            onChange={(e) =>
              setBrojOsoba(
                Number(e.target.value)
              )
            }
          />
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <button type="submit" className="btn">
          Izmeni rezervaciju
        </button>
      </form>
    </div>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>{props.label}</label>

      <input
        value={props.value}
        onChange={(e) =>
          props.onChange(e.target.value)
        }
      />
    </div>
  );
}
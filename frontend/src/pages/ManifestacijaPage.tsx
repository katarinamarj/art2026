import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Manifestacija } from "../models/manifestacija.model";
import "../styles/ManifestacijaPage.css";
import { formatDate, formatDateRange, formatTime } from "../utils/dateUtils";

export default function ManifestacijaPage() {
  const [data, setData] = useState<Manifestacija | null>(null);
  const { id } = useParams();

  useEffect(() => {
    fetch(`/api/manifestacija/${id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [id]);

  if (!data) return <div className="loading">Učitavanje...</div>;

  return (
    <div className="manifestacija-container">
      <h1 className="title">{data.Naziv}</h1>

      <div className="info-row">
        <div><i className="fa-solid fa-city icon"></i>{data.Grad}</div>
        <div><i className="fa-solid fa-map-pin icon"></i>{data.Lokacija}</div>
        <div>
          <i className="fa-solid fa-calendar icon"></i>{formatDateRange(data.DatumOd, data.DatumDo)}
        </div>
      </div>

      <div className="days-wrapper">
        {data.dani.map((dan) => (
          <div key={dan.DanID} className="day-card">
            <h2 className="day-title">{dan.TipDana.toUpperCase()}</h2>

            <div className="day-info">
              <span>Broj slobodnih mesta: {dan.SlobodnaMesta}</span>
              <span>Cena: {dan.OsnovnaCena} RSD</span>
              <span>Datum: {formatDate(dan.Datum)}</span>

            </div>

            <div className="izlozbe-grid">
              {dan.izlozbe.map((iz) => (
                <div key={iz.IzlozbaID} className="izlozba-card">
                  <p><b>Umetnik:</b> {iz.Umetnik}</p>
                  <p>
                    {formatTime(iz.VremeOtvaranja)} - {formatTime(iz.VremeZatvaranja)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="dodatneInfo">{data.DodatneInformacije}</div>
      <button className="prijava-btn"> &gt;&gt; Prijavi se </button>
    </div>
  );
}

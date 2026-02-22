import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ManifestacijaPage from "./pages/ManifestacijaPage";
import PrijavaPage from "./pages/PrijavaPage";

export default function App() {

  return (
     <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/manifestacija/1" />} />
        <Route path="/manifestacija/:id" element={<ManifestacijaPage />} />
        <Route path="/prijava/:id" element={<PrijavaPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}

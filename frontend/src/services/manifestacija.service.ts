export async function getManifestacija(id: number) {
    const response = await fetch(`http://localhost:3000/manifestacija/${id}`);

    if (!response.ok) {
        throw new Error("Greška pri učitavanju manifestacije");
    }

    return response.json();
}

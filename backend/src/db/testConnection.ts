import pool from "./connection.ts";

const testConnection = async () => {
    try {
        const [rows] = await pool.query("SELECT NOW() as vreme");
        console.log("Veza sa bazom uspešna! Trenutno vreme:", rows);
        process.exit(0);
    } catch (error) {
        console.error("Greška pri povezivanju sa bazom:", error);
        process.exit(1);
    }
};

testConnection();


import { useEffect, useState } from "react";
import "./index.css";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking backend...");
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    async function checkBackend() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;

        const response = await fetch(`${apiUrl}/api/health`);

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        setApiData(data);
        setApiStatus("Connected");
      } catch (error) {
        console.error("Backend connection failed:", error);
        setApiStatus("Disconnected");
        setApiData(null);
      }
    }

    checkBackend();
  }, []);

  return (
    <main className="app">
      <h1>🌾 AgriBridge</h1>
      <p>Intelligent Agricultural Market Platform</p>

      <section className="status-card">
        <h2>Backend Connection</h2>

        <p>
          Status:{" "}
          <strong
            className={
              apiStatus === "Connected" ? "connected" : "disconnected"
            }
          >
            {apiStatus}
          </strong>
        </p>

        {apiData && (
          <div>
            <p>{apiData.message}</p>
            <p>Service: {apiData.service}</p>
            <p>
              Last checked:{" "}
              {new Date(apiData.timestamp).toLocaleTimeString()}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;

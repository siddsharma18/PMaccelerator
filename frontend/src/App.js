// Uses leaflet-defaulticon-compatibility for default marker icon
import React, { useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

function App() {
  
  const [isPretty, setIsPretty] = useState(false);

  // State
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [moodInputs, setMoodInputs] = useState({
    temp: "",
    humidity: "",
    wind_speed: "",
    weather_main: "",
  });
  const [moodResult, setMoodResult] = useState(null);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodError, setMoodError] = useState("");
  const [videoQuery, setVideoQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState("");
  const [lastCoords, setLastCoords] = useState(null);
  const [savedQueries, setSavedQueries] = useState([]);

  // Style objects
  const uglyBlock = {
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: 0,
    padding: 18,
    margin: "18px 0",
    boxShadow: "none",
    color: "#333",
    fontFamily: "sans-serif",
  };
  const prettyBlock = {
    background: "#fff",
    border: "none",
    borderRadius: 18,
    padding: 36,
    margin: "36px 0",
    boxShadow: "0 8px 32px rgba(20,20,40,0.10)",
    color: "#232323",
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
  };
  const blockStyle = isPretty ? prettyBlock : uglyBlock;

  const uglyButton = {
    background: "#fff",
    color: "#232323",
    border: "1px solid #bbb",
    borderRadius: 0,
    padding: "8px 16px",
    boxShadow: "none",
    fontWeight: "normal",
    cursor: "pointer",
  };
  const prettyButton = {
    background: "#283593",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 28px",
    fontWeight: "bold",
    boxShadow: "0 2px 8px rgba(40,53,147,0.09)",
    cursor: "pointer",
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
    fontSize: 16,
    transition: "background 0.2s",
  };

  const uglyInput = {
    padding: 8,
    borderRadius: 0,
    border: "1px solid #ccc",
    marginBottom: 8,
    width: 140,
  };
  const prettyInput = {
    padding: 14,
    borderRadius: 12,
    border: "1.5px solid #d4d4d4",
    marginBottom: 8,
    fontSize: 16,
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif",
    width: 180,
  };

  // Weather Search/Input
  const handleFetchWeather = async () => {
    setError("");
    setWeather(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/weather/?city=${city}`);
      if (!response.ok) throw new Error("Weather not found");
      const data = await response.json();
      setWeather(data);

      // Map marker
      if (data.lat && data.lon) {
        setLastCoords({ lat: data.lat, lon: data.lon });
      } else if (data.coord && data.coord.lat && data.coord.lon) {
        setLastCoords({ lat: data.coord.lat, lon: data.coord.lon });
      }

      // Save queries
      setSavedQueries(prev => [
        ...prev,
        {
          city: city,
          date: new Date().toLocaleString(),
          temp: data["temperature (°C)"] ?? "",
          humidity: data["humidity (%)"] ?? "",
          wind: data["wind speed (m/s)"] ?? "",
          condition: data.condition ?? "",
        },
      ]);

      // Auto-fetch YouTube for this city
      setVideoQuery(city);
      handleFetchVideos(city);

      // Auto-fill mood prediction inputs using weather data
      setMoodInputs({
        temp: data["temperature (°C)"] ?? "",
        humidity: data["humidity (%)"] ?? "",
        wind_speed: data["wind speed (m/s)"] ?? "",
        weather_main: data.condition ?? "",
      });
      handlePredictMoodAuto({
        temp: data["temperature (°C)"] ?? "",
        humidity: data["humidity (%)"] ?? "",
        wind_speed: data["wind speed (m/s)"] ?? "",
        weather_main: data.condition ?? "",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Mood Prediction
  const handleMoodInput = (e) => {
    setMoodInputs({ ...moodInputs, [e.target.name]: e.target.value });
  };
  const handlePredictMood = async () => {
    setMoodLoading(true);
    setMoodError("");
    setMoodResult(null);
    try {
      const payload = {
        temp: parseFloat(moodInputs.temp),
        humidity: parseFloat(moodInputs.humidity),
        wind_speed: parseFloat(moodInputs.wind_speed),
        weather_main: moodInputs.weather_main,
      };
      const resp = await axios.post("http://127.0.0.1:8000/predict-mood/", payload);
      setMoodResult(resp.data);
    } catch (err) {
      setMoodError("Prediction failed");
    } finally {
      setMoodLoading(false);
    }
  };

  // Auto mood prediction function
  const handlePredictMoodAuto = async (inputs) => {
    setMoodLoading(true);
    setMoodError("");
    setMoodResult(null);
    try {
      const payload = {
        temp: parseFloat(inputs.temp),
        humidity: parseFloat(inputs.humidity),
        wind_speed: parseFloat(inputs.wind_speed),
        weather_main: inputs.weather_main,
      };
      const resp = await axios.post("http://127.0.0.1:8000/predict-mood/", payload);
      setMoodResult(resp.data);
    } catch (err) {
      setMoodError("Prediction failed");
    } finally {
      setMoodLoading(false);
    }
  };

  // YouTube Video Fetch
  const handleFetchVideos = async (queryOverride = null) => {
    setVideos([]);
    setVideosError("");
    setVideosLoading(true);
    try {
      const query = queryOverride !== null ? queryOverride : videoQuery;
      const resp = await axios.get(
        `http://127.0.0.1:8000/videos/?location=${encodeURIComponent(query)}`
      );
      setVideos(resp.data.videos || []);
    } catch (err) {
      setVideosError("Could not fetch videos");
    } finally {
      setVideosLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!savedQueries.length) return;
    const header = "City,Date,Temperature,Humidity,Wind,Condition\n";
    const rows = savedQueries
      .map(
        q =>
          [
            q.city,
            q.date,
            q.temp,
            q.humidity,
            q.wind,
            q.condition,
          ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "weather_queries.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Map: set default center
  const defaultCenter = lastCoords
    ? [lastCoords.lat, lastCoords.lon]
    : [20, 0];

  // Weather main options for mood prediction
  const weatherMainOptions = [
    "Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm", "Snow",
    "Mist", "Fog", "Haze", "Dust", "Other"
  ];

  return (
    <div
      style={{
        padding: isPretty ? 48 : 8,
        background: isPretty ? "#f7f7f7" : "#fff",
        minHeight: "100vh",
        fontFamily: isPretty ? "Inter, Helvetica Neue, Arial, sans-serif" : "sans-serif"
      }}
    >
      {/* Header with name and info button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>By Siddharth Sharma</h2>
        <button
          onClick={() =>
            alert(
              "Product Manager Accelerator (PM Accelerator) helps aspiring product managers break into the industry through hands-on projects, mentorship, and curated learning. Visit our LinkedIn: https://www.linkedin.com/school/pmaccelerator/"
            )
          }
          style={isPretty ? prettyButton : uglyButton}
        >
          Info
        </button>
      </div>

      {/* Theme Toggle */}
      <div style={{ marginBottom: 18, display: "flex", alignItems: "center" }}>
        <input
          type="checkbox"
          id="upgrade-view"
          checked={isPretty}
          onChange={e => setIsPretty(e.target.checked)}
          style={{ marginRight: 8 }}
        />
        <label htmlFor="upgrade-view" style={{ fontWeight: "bold", fontSize: 16 }}>
          Upgrade view
        </label>
      </div>

      {/* Weather Search/Input */}
      <div style={blockStyle}>
        <h1 style={{ marginTop: 0, marginBottom: 16 }}>Weather AI App</h1>
        <input
          type="text"
          placeholder="Enter city..."
          value={city}
          onChange={e => setCity(e.target.value)}
          style={isPretty ? prettyInput : uglyInput}
        />
        <button
          onClick={handleFetchWeather}
          style={isPretty ? prettyButton : uglyButton}
        >
          Get Weather
        </button>
        {error && <p style={{ color: "red", margin: "8px 0 0 0" }}>{error}</p>}
        {weather && (
          <div style={{ marginTop: 16 }}>
            <h2 style={{ margin: 0 }}>{weather.location}</h2>
            <p>Temperature: {weather["temperature (°C)"]}°C</p>
            <p>Condition: {weather.condition}</p>
            <p>Humidity: {weather["humidity (%)"]}%</p>
            <p>Wind Speed: {weather["wind speed (m/s)"]} m/s</p>
            <img src={weather.icon} alt="Weather icon" />
          </div>
        )}
      </div>

      {/* Mood Prediction Form */}
      <div style={blockStyle}>
        <h2 style={{ marginTop: 0 }}>Mood Prediction</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <input
            name="temp"
            type="number"
            placeholder="Temperature (°C)"
            value={moodInputs.temp}
            onChange={handleMoodInput}
            style={isPretty ? prettyInput : uglyInput}
          />
          <input
            name="humidity"
            type="number"
            placeholder="Humidity (%)"
            value={moodInputs.humidity}
            onChange={handleMoodInput}
            style={isPretty ? prettyInput : uglyInput}
          />
          <input
            name="wind_speed"
            type="number"
            placeholder="Wind Speed (m/s)"
            value={moodInputs.wind_speed}
            onChange={handleMoodInput}
            style={isPretty ? prettyInput : uglyInput}
          />
          <select
            name="weather_main"
            value={moodInputs.weather_main}
            onChange={handleMoodInput}
            style={isPretty ? prettyInput : uglyInput}
          >
            <option value="">Weather Main</option>
            {weatherMainOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {/* 
          <button
            onClick={handlePredictMood}
            disabled={moodLoading}
            style={isPretty ? prettyButton : uglyButton}
          >
            {moodLoading ? "Predicting..." : "Predict Mood"}
          </button>
          */}
        </div>
        {moodError && <p style={{ color: "red", margin: "8px 0 0 0" }}>{moodError}</p>}
        {moodResult && (
          <div style={{ marginTop: 10 }}>
            <strong>Predicted Mood:</strong>{" "}
            <span>{moodResult.mood ?? JSON.stringify(moodResult)}</span>
          </div>
        )}
      </div>

      {/* YouTube Video Fetch */}
      <div style={blockStyle}>
        <h2 style={{ marginTop: 0 }}>YouTube Videos</h2>
        <input
          type="text"
          placeholder="Search videos…"
          value={videoQuery}
          onChange={e => setVideoQuery(e.target.value)}
          style={isPretty ? prettyInput : uglyInput}
        />
        <button
          onClick={() => handleFetchVideos()}
          disabled={videosLoading}
          style={isPretty ? prettyButton : uglyButton}
        >
          {videosLoading ? "Searching..." : "Search Videos"}
        </button>
        {videosError && <p style={{ color: "red", margin: "8px 0 0 0" }}>{videosError}</p>}
        {videos && videos.length > 0 && (
          <ul style={{ marginTop: 14, paddingLeft: 18 }}>
            {videos.map((v, idx) => (
              <li key={v.url || v.id?.videoId || v.id || idx} style={{ marginBottom: 6 }}>
                <div>
                  <a
                    href={v.url || `https://www.youtube.com/watch?v=${v.id?.videoId || v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: isPretty ? "#283593" : "#333",
                      textDecoration: isPretty ? "underline" : "none",
                    }}
                  >
                    {v.snippet?.title || v.title || "YouTube Video"}
                  </a>
                </div>
                {v.url && (
                  <div style={{ fontSize: 12, color: "#555", wordBreak: "break-all" }}>
                    {v.url}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div style={blockStyle}>
        <h2 style={{ marginTop: 0 }}>Map</h2>
        <div style={{ height: 300, width: "100%", borderRadius: isPretty ? 18 : 0, overflow: "hidden", border: isPretty ? "none" : "1px solid #ccc" }}>
          <MapContainer
            center={defaultCenter}
            zoom={lastCoords ? 9 : 2}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          {/* Marker uses classic red pin with leaflet-defaulticon-compatibility */}
          {lastCoords && (
            <Marker position={[lastCoords.lat, lastCoords.lon]}>
              <Popup>
                Last queried location: <br />
                Lat: {lastCoords.lat}, Lon: {lastCoords.lon}
              </Popup>
            </Marker>
          )}
          </MapContainer>
        </div>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          {lastCoords
            ? `Marker at latitude ${lastCoords.lat}, longitude ${lastCoords.lon}`
            : "No location selected yet."}
        </div>
      </div>

      {/* Saved Queries Table and Export */}
      <div style={blockStyle}>
        <h2 style={{ marginTop: 0 }}>Saved Queries</h2>
        {savedQueries.length === 0 ? (
          <p style={{ color: "#666" }}>No cities searched yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                background: isPretty ? "#fff" : "#fff",
                border: isPretty ? "none" : "1px solid #ccc",
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>City</th>
                  <th style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>Date</th>
                  <th style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>Temperature</th>
                  <th style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>Humidity</th>
                  <th style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>Wind</th>
                  <th style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>Condition</th>
                </tr>
              </thead>
              <tbody>
                {savedQueries.map((q, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>{q.city}</td>
                    <td style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>{q.date}</td>
                    <td style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>{q.temp}</td>
                    <td style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>{q.humidity}</td>
                    <td style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>{q.wind}</td>
                    <td style={{ padding: 10, border: isPretty ? "none" : "1px solid #ccc" }}>{q.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button
          onClick={handleExportCSV}
          disabled={savedQueries.length === 0}
          style={isPretty ? prettyButton : uglyButton}
        >
          Export
        </button>
      </div>
    </div>
  );
}

export default App;
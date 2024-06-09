import React, { useState, useEffect } from "react";

const NtpSync = () => {
  const [server, setServer] = useState("");
  const [syncTime, setSyncTime] = useState("");
  const [bias, setBias] = useState("");
  const [logEntries, setLogEntries] = useState([]);

  const fetchLogs = async () => {
    const response = await fetch("http://localhost:8000/logs/");
    const data = await response.json();
    setLogEntries(data.log_entries || []);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await fetch("http://localhost:8000/sync/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ server, sync_time: syncTime, bias }),
    });
    fetchLogs(); // Fetch logs again after syncing
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Server:</label>
          <input
            type="text"
            value={server}
            onChange={(e) => setServer(e.target.value)}
          />
        </div>
        <div>
          <label>Sync Time (minutes):</label>
          <input
            type="text"
            value={syncTime}
            onChange={(e) => setSyncTime(e.target.value)}
          />
        </div>
        <div>
          <label>Bias (seconds):</label>
          <input
            type="text"
            value={bias}
            onChange={(e) => setBias(e.target.value)}
          />
        </div>
        <button type="submit">Sync</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>NTD</th>
            <th>Static IP Addresses</th>
            <th>NTD Locations at CSIR - NPL</th>
            <th>LED Screen Size in Pixels</th>
            <th>Timestamp</th>
            <th>Sync Time</th>
            <th>Status</th>
            <th>Bias</th>
          </tr>
        </thead>
        <tbody>
          {logEntries.map((entry, index) => (
            <tr key={index}>
              <td>{`NTD ${index + 1}`}</td>
              <td>{entry.ip}</td>
              <td>{locations[index]}</td>
              <td>{sizes[index]}</td>
              <td>{entry.timestamp}</td>
              <td>{entry.log_time}</td>
              <td>{entry.status}</td>
              <td>{entry.bias}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const locations = [
  "Main Gate (Outside)",
  "Main Gate (Inside)",
  "Conference Room (Metrology Building)",
  "Outside Head IST Room",
  "Library",
  "Electrical Section",
  "TEC Building",
  "Inside Auditorium",
  "Reception of Auditorium",
];

const sizes = [
  "192*96",
  "192*96",
  "192*64",
  "192*64",
  "192*64",
  "192*64",
  "192*128",
  "192*128",
  "192*128",
];

export default NtpSync;

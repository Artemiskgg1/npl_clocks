import React, { useState, useEffect } from "react";
import "tailwindcss/tailwind.css"; // Ensure Tailwind CSS is imported

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
    fetchLogs();
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded shadow-md"
      >
        <div>
          <label className="block text-gray-700 font-medium">Server:</label>
          <input
            type="text"
            value={server}
            onChange={(e) => setServer(e.target.value)}
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium">
            Sync Time (minutes):
          </label>
          <input
            type="text"
            value={syncTime}
            onChange={(e) => setSyncTime(e.target.value)}
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium">
            Bias (seconds):
          </label>
          <input
            type="text"
            value={bias}
            onChange={(e) => setBias(e.target.value)}
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded shadow"
        >
          Sync
        </button>
      </form>
      <div className="mt-6 overflow-auto bg-white rounded shadow-md max-h-screen">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NTD
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Static IP Addresses
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sync Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bias
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logEntries.map((entry, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">{`NTD ${
                  index + 1
                }`}</td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.ip}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {entry.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {entry.log_time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.bias}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NtpSync;

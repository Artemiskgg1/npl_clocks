import React, { useState, useEffect } from "react";

const LiveTime = () => {
  const [time, setTime] = useState("");

  const fetchTime = async () => {
    const response = await fetch(
      "http://worldtimeapi.org/api/timezone/Etc/UTC"
    );
    const data = await response.json();
    setTime(new Date(data.datetime).toLocaleTimeString());
  };

  useEffect(() => {
    fetchTime();
    const interval = setInterval(fetchTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 m-5 bg-white rounded shadow-md mt-4 md:mt-0">
      <h2 className="text-xl font-bold text-gray-700">Live Time</h2>
      <p className="text-2xl text-gray-900 mt-2">{time}</p>
    </div>
  );
};

const Form = ({
  server,
  setServer,
  syncTime,
  setSyncTime,
  bias,
  setBias,
  handleSubmit,
}) => {
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded shadow-md mt-6 m-5"
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
  );
};

const LogsTable = ({ logEntries }) => {
  // Sort the log entries by timestamp in descending order
  const sortedLogEntries = [...logEntries].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="mt-6 overflow-auto bg-white rounded shadow-md max-h-[70vh]">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NTD
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Static IP Addresses
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sync Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedLogEntries.map((entry, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">{`NTD ${
                index + 1
              }`}</td>
              <td className="px-6 py-4 whitespace-nowrap">{entry.ip}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(entry.timestamp).toLocaleString()}
              </td>
              <td
                className={`px-6 py-4 whitespace-nowrap ${getStatusClass(
                  entry.status
                )}`}
              >
                {entry.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const getStatusClass = (status) => {
  switch (status) {
    case "Synchronized":
      return "bg-green-600 text-white";
    case "not synchronized":
      return "text-red-600";
    case "Not Connected":
      return "bg-yellow-400 text-black";
    default:
      return "";
  }
};

const NtpSync = () => {
  const [server, setServer] = useState("");
  const [syncTime, setSyncTime] = useState("");
  const [bias, setBias] = useState("");
  const [logEntries, setLogEntries] = useState([]);

  const fetchLogs = async () => {
    try {
      const response = await fetch("http://localhost:8000/logs/");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      console.log("Fetched logs:", data); // Check the fetched data
      if (data.log_entries) {
        data.log_entries.forEach((entry) => {
          console.log(
            `Log Entry: IP=${entry.ip}, Timestamp=${entry.timestamp}, Status=${entry.status}`
          );
        });
      }
      setLogEntries(data.log_entries || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
      // Handle error state or retry logic here
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const csrfToken = getCookie("csrftoken");
    await fetch("http://localhost:8000/sync/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ server, sync_time: syncTime, bias }),
    });
    fetchLogs();
  };
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  return (
    <div className="p-4 bg-zinc-200 min-h-screen flex flex-col md:flex-row">
      <div className="md:w-1/3 w-full flex flex-col">
        <Form
          server={server}
          setServer={setServer}
          syncTime={syncTime}
          setSyncTime={setSyncTime}
          bias={bias}
          setBias={setBias}
          handleSubmit={handleSubmit}
        />
        <LiveTime />
      </div>
      <div className="md:w-2/3 w-full">
        <LogsTable logEntries={logEntries} />
      </div>
    </div>
  );
};

export default NtpSync;

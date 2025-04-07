import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import html2canvas from "html2canvas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

// Backend WebSocket URL
const SOCKET_SERVER_URL = "https://dashboard-backend-mhif.onrender.com/";

const OverviewChart = () => {
  const [sensorData, setSensorData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedNode, setSelectedNode] = useState("ESP32-1"); // default node
  const [loading, setLoading] = useState(false);

  const chartContainerRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);

    // Live updates (only when no date is selected)
    socket.on("sensorDataUpdate", (data) => {
      if (!selectedDate) {
        const filtered = data.filter((d) => d.nodeId === selectedNode);
        setSensorData(filtered);
      }
    });

    // Fetch on date or node change
    if (selectedDate || selectedNode) {
      setLoading(true);
      socket.emit("getDataByDate", {
        date: selectedDate,
        nodeId: selectedNode,
      });
    }

    socket.on("sensorDataByDate", (data) => {
      if (!data.error) {
        setSensorData(data);
      }
      setLoading(false);
    });

    return () => socket.disconnect();
  }, [selectedDate, selectedNode]);

  const downloadCharts = async () => {
    if (chartContainerRef.current) {
      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = "sensor_overview_charts.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex flex-col lg:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-medium text-gray-100">
          Sensor Data Overview
        </h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            className="p-2 rounded bg-gray-700 text-white"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white"
          >
            <option value="ESP32-1">ESP32-1</option>
            <option value="ESP32-2">ESP32-2</option>
            {/* Add more nodes as needed */}
          </select>
          <button
            onClick={() => {
              setSelectedDate("");
              setSelectedNode("ESP32-1");
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
          >
            Reset
          </button>
          <button
            onClick={downloadCharts}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
          >
            Download Charts
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-300">Fetching data for selected filters...</p>
      ) : sensorData.length === 0 ? (
        <p className="text-gray-300">Waiting for data...</p>
      ) : (
        <div
          ref={chartContainerRef}
          className="flex flex-col lg:flex-row gap-6"
        >
          {/* Temperature & Humidity Chart */}
          <div className="w-full lg:w-1/2 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#9ca3af"
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    borderColor: "#4B5563",
                  }}
                  itemStyle={{ color: "#E5E7EB" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#F87171"
                  strokeWidth={3}
                  dot={{ fill: "#F87171", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  stroke="#60A5FA"
                  strokeWidth={3}
                  dot={{ fill: "#60A5FA", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CO2 Chart */}
          <div className="w-full lg:w-1/2 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#9ca3af"
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis stroke="#9ca3af" domain={[0, 500]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    borderColor: "#4B5563",
                  }}
                  itemStyle={{ color: "#E5E7EB" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="co2"
                  stroke="#34D399"
                  strokeWidth={3}
                  dot={{ fill: "#34D399", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OverviewChart;

import { useState, useEffect, useCallback } from "react";
import { BellElectricIcon, Cross, Droplet, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { MenuItem, Select } from "@mui/material";

import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import OverviewChart from "../components/overview/OverviewChart";

const OverviewPage = () => {
  // Default node and available nodes list
  const [nodeId, setNodeId] = useState("ESP32-1");
  const availableNodes = ["ESP32-1", "ESP32-2"];

  // sensorData holds historical data for the chart,
  // latestSensorData holds the most recent reading for the stat cards.
  const [sensorData, setSensorData] = useState([]);
  const [latestSensorData, setLatestSensorData] = useState({
    temperature: "Loading...",
    humidity: "Loading...",
    co2: "Loading...",
  });

  // Memoize the fetch function to prevent unnecessary re-creations.
  const fetchSensorData = useCallback(async () => {
    try {
      const response = await fetch(
        `https://dashboard-backend-mhif.onrender.com/api/sensor-data/${nodeId}`
      );
      const data = await response.json();
      setSensorData(data);
      if (data.length > 0) {
        // Assuming data is sorted by timestamp in descending order,
        // the first record is the most recent.
        const latest = data[0];
        setLatestSensorData({
          temperature: `${latest.temperature}°C`,
          humidity: `${latest.humidity}%`,
          co2: `${latest.co2} ppm`,
        });
      }
    } catch (err) {
      console.error("Error fetching sensor data:", err);
    }
  }, [nodeId]);

  // Fetch data initially and then every 5 seconds whenever fetchSensorData changes.
  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 5000);
    return () => clearInterval(interval);
  }, [fetchSensorData]);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Overview" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* NODE SELECTION DROPDOWN */}
        <div className="flex justify-start mb-4">
          <h2 className="flex justify center items-center text-lg font-medium text-gray-100  mr-2">
            Select Node
          </h2>
          <Select
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            style={{ backgroundColor: "#1F2937", color: "white" }}
          >
            {availableNodes.map((node) => (
              <MenuItem key={node} value={node}>
                {node}
              </MenuItem>
            ))}
          </Select>
        </div>

        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Device"
            icon={BellElectricIcon}
            value={nodeId}
            color="#10B981"
          />
          <StatCard
            name="Temperature"
            icon={Sun}
            value={latestSensorData.temperature}
            color="#6366F1"
          />
          <StatCard
            name="Humidity"
            icon={Droplet}
            value={latestSensorData.humidity}
            color="#8B5CF6"
          />
          <StatCard
            name="CO2 Level"
            icon={Cross}
            value={latestSensorData.co2}
            color="#EC4899"
          />
        </motion.div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Pass sensorData and nodeId to OverviewChart */}
          <OverviewChart nodeId={nodeId} sensorData={sensorData} />
        </div>
      </main>
    </div>
  );
};

export default OverviewPage;

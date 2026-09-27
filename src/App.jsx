import { useEffect, useState } from "react";
import "./App.css";

// --------------------------------------------------
// DEPLOYED AZURE BACKEND
// --------------------------------------------------

const API_URL =
  "https://lifecycle-api-sreek-2026-bdbjgwd7a4e9b4cc.eastasia-01.azurewebsites.net";

function App() {
  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  const [dashboard, setDashboard] = useState({
    totalRecords: 1250,
    totalStorage: "4.8 TB",
    hotRecords: 320,
    coolRecords: 410,
    archiveRecords: 520,
    estimatedSavings: "62%",
  });

  // --------------------------------------------------
  // BACKEND STATUS
  // --------------------------------------------------

  const [backendConnected, setBackendConnected] =
    useState(false);

  // --------------------------------------------------
  // REAL AZURE BLOBS
  // --------------------------------------------------

  const [realBlobs, setRealBlobs] = useState([]);
  const [blobLoading, setBlobLoading] = useState(true);
  const [blobError, setBlobError] = useState("");

  // --------------------------------------------------
  // LIFECYCLE POLICY
  // --------------------------------------------------

  const [policyMessage, setPolicyMessage] = useState("");

  // --------------------------------------------------
  // REHYDRATION
  // --------------------------------------------------

  const [priority, setPriority] = useState("Standard");
  const [rehydrationStatus, setRehydrationStatus] =
    useState("");

  // --------------------------------------------------
  // CHECK BACKEND
  // --------------------------------------------------

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/health`
        );

        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}`
          );
        }

        const data = await response.json();

        if (data.success) {
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
        }
      } catch (error) {
        console.error(
          "Backend connection failed:",
          error
        );

        setBackendConnected(false);
      }
    };

    checkBackend();
  }, []);

  // --------------------------------------------------
  // LOAD DASHBOARD DATA
  // --------------------------------------------------

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/dashboard`
        );

        if (!response.ok) {
          throw new Error(
            `HTTP error ${response.status}`
          );
        }

        const data = await response.json();

        setDashboard(data);
      } catch (error) {
        console.error(
          "Dashboard API error:",
          error
        );
      }
    };

    loadDashboard();
  }, []);

  // --------------------------------------------------
  // LOAD REAL AZURE BLOB STORAGE
  // --------------------------------------------------

  const loadRealBlobs = async () => {
    try {
      setBlobLoading(true);
      setBlobError("");

      const response = await fetch(
        `${API_URL}/api/blobs`
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success) {
        setRealBlobs(data.blobs || []);
      } else {
        setBlobError(
          "Unable to load Azure blobs."
        );
      }
    } catch (error) {
      console.error(
        "Azure blob error:",
        error
      );

      setBlobError(
        "Unable to connect to Azure Blob Storage through backend."
      );
    } finally {
      setBlobLoading(false);
    }
  };

  useEffect(() => {
    loadRealBlobs();
  }, []);

  // --------------------------------------------------
  // APPLY LIFECYCLE RECOMMENDATION
  // --------------------------------------------------

  const applyLifecyclePolicy = async () => {
    try {
      setPolicyMessage(
        "Checking lifecycle recommendation..."
      );

      const response = await fetch(
        `${API_URL}/api/lifecycle`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            recordAge: 7,
            currentTier: "Hot",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success) {
        setPolicyMessage(
          `✓ ${data.message}`
        );
      } else {
        setPolicyMessage(
          "Lifecycle recommendation failed."
        );
      }
    } catch (error) {
      console.error(
        "Lifecycle error:",
        error
      );

      setPolicyMessage(
        "Unable to connect to lifecycle backend."
      );
    }
  };

  // --------------------------------------------------
  // START REHYDRATION
  // --------------------------------------------------

  const startRehydration = async () => {
    try {
      const selectedBlob =
        realBlobs.length > 0
          ? realBlobs[0].name
          : "audit-2019-001.txt";

      setRehydrationStatus(
        "Sending rehydration request..."
      );

      const response = await fetch(
        `${API_URL}/api/rehydrate`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            recordName: selectedBlob,
            priority: priority,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP error ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success) {
        setRehydrationStatus(
          `✓ ${data.message}`
        );

        // Refresh Azure information
        await loadRealBlobs();
      } else {
        setRehydrationStatus(
          data.message ||
            "Rehydration failed."
        );
      }
    } catch (error) {
      console.error(
        "Rehydration error:",
        error
      );

      setRehydrationStatus(
        "Unable to send rehydration request."
      );
    }
  };

  // --------------------------------------------------
  // FIRST BLOB
  // --------------------------------------------------

  const firstBlob =
    realBlobs.length > 0
      ? realBlobs[0]
      : null;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="app">

      {/* HEADER */}

      <header className="topbar">
        <div>
          <h1>
            Azure Storage Lifecycle Manager
          </h1>

          <p>
            Archive Data Optimization Dashboard
          </p>
        </div>

        <div
          className={
            backendConnected
              ? "connection connected"
              : "connection disconnected"
          }
        >
          <span className="status-dot"></span>

          {backendConnected
            ? "Backend Connected"
            : "Backend Disconnected"}
        </div>
      </header>

      {/* SUMMARY CARDS */}

      <section className="cards">

        <div className="card blue">
          <h3>Total Records</h3>

          <div className="number">
            {dashboard.totalRecords?.toLocaleString()}
          </div>

          <p>All stored records</p>
        </div>

        <div className="card blue">
          <h3>Total Storage</h3>

          <div className="number">
            {dashboard.totalStorage}
          </div>

          <p>Blob storage usage</p>
        </div>

        <div className="card red">
          <h3>Hot Tier</h3>

          <div className="number">
            {dashboard.hotRecords}
          </div>

          <p>Frequently accessed</p>
        </div>

        <div className="card lightblue">
          <h3>Cool Tier</h3>

          <div className="number">
            {dashboard.coolRecords}
          </div>

          <p>Infrequent access</p>
        </div>

        <div className="card purple">
          <h3>Archive Tier</h3>

          <div className="number">
            {dashboard.archiveRecords}
          </div>

          <p>Long-term records</p>
        </div>

        <div className="card green">
          <h3>Estimated Savings</h3>

          <div className="number">
            {dashboard.estimatedSavings}
          </div>

          <p>
            Using lifecycle optimization
          </p>
        </div>

      </section>

      {/* LIFECYCLE RECOMMENDATION */}

      <section className="panel">

        <h2>
          Lifecycle Recommendation
        </h2>

        <p className="section-description">
          Analyze old audit records and recommend
          the appropriate Azure Blob Storage tier.
        </p>

        <div className="recommendation-grid">

          <div className="recommendation-box">
            <span>
              Record Age
            </span>

            <strong>
              7 Years
            </strong>
          </div>

          <div className="recommendation-box">
            <span>
              Current Tier
            </span>

            <strong className="hot-text">
              Hot
            </strong>
          </div>

          <div className="recommendation-box">
            <span>
              Recommended Tier
            </span>

            <strong className="archive-text">
              Archive
            </strong>
          </div>

        </div>

        <button
          className="primary-button"
          onClick={applyLifecyclePolicy}
        >
          Apply Lifecycle Policy
        </button>

        {policyMessage && (
          <div className="success-message">
            {policyMessage}
          </div>
        )}

      </section>

      {/* REAL AZURE BLOB STORAGE */}

      <section className="panel">

        <div className="section-heading-row">

          <div>
            <h2>
              Real Azure Blob Storage
            </h2>

            <p className="section-description">
              Live information retrieved from the
              audit-records Azure Blob container.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadRealBlobs}
          >
            Refresh Azure Data
          </button>

        </div>

        {blobLoading && (
          <div className="loading-box">
            Loading Azure Blob Storage...
          </div>
        )}

        {blobError && (
          <div className="error-message">
            {blobError}
          </div>
        )}

        {!blobLoading &&
          !blobError &&
          realBlobs.length === 0 && (
            <div className="empty-message">
              No blobs found in audit-records
              container.
            </div>
          )}

        {!blobLoading &&
          !blobError &&
          realBlobs.map((blob) => (

            <div
              className="blob-card"
              key={blob.name}
            >

              <div className="blob-row">
                <span>Record</span>

                <strong>
                  {blob.name}
                </strong>
              </div>

              <div className="blob-row">
                <span>
                  Current Tier
                </span>

                <strong
                  className={
                    blob.tier === "Archive"
                      ? "archive-text"
                      : blob.tier === "Cool"
                      ? "cool-text"
                      : "hot-text"
                  }
                >
                  {blob.tier}
                </strong>
              </div>

              <div className="blob-row">
                <span>
                  Blob Type
                </span>

                <strong>
                  {blob.blobType ||
                    "BlockBlob"}
                </strong>
              </div>

              <div className="blob-row">
                <span>
                  Size
                </span>

                <strong>
                  {blob.size} Bytes
                </strong>
              </div>

              <div className="blob-row">
                <span>
                  Azure Status
                </span>

                <strong className="connected-text">
                  ● Connected
                </strong>
              </div>

              <div className="blob-row">
                <span>
                  Last Modified
                </span>

                <strong>
                  {blob.lastModified
                    ? new Date(
                        blob.lastModified
                      ).toLocaleString()
                    : "N/A"}
                </strong>
              </div>

              {blob.archiveStatus && (
                <div className="blob-row">
                  <span>
                    Archive Status
                  </span>

                  <strong>
                    {blob.archiveStatus}
                  </strong>
                </div>
              )}

            </div>
          ))}

      </section>

      {/* ARCHIVE RETRIEVAL */}

      <section className="panel">

        <h2>
          Archive Retrieval
        </h2>

        <div className="retrieval-information">

          <p>
            <strong>
              Record:
            </strong>{" "}

            {firstBlob
              ? firstBlob.name
              : "audit-2019-001.txt"}
          </p>

          <p>
            <strong>
              Current Tier:
            </strong>{" "}

            <span
              className={
                firstBlob?.tier === "Hot"
                  ? "hot-text"
                  : firstBlob?.tier === "Cool"
                  ? "cool-text"
                  : "archive-text"
              }
            >
              {firstBlob
                ? firstBlob.tier
                : "Archive"}
            </span>
          </p>

          {firstBlob?.archiveStatus && (
            <p>
              <strong>
                Azure Status:
              </strong>{" "}

              {firstBlob.archiveStatus}
            </p>
          )}

        </div>

        <h3 className="priority-title">
          Retrieval Priority
        </h3>

        <div className="radio-group">

          <label>
            <input
              type="radio"
              name="priority"
              value="Standard"
              checked={
                priority === "Standard"
              }
              onChange={(e) =>
                setPriority(
                  e.target.value
                )
              }
            />

            Standard Rehydration
          </label>

          <label>
            <input
              type="radio"
              name="priority"
              value="High Priority"
              checked={
                priority ===
                "High Priority"
              }
              onChange={(e) =>
                setPriority(
                  e.target.value
                )
              }
            />

            High Priority Rehydration
          </label>

        </div>

        <p className="selected-priority">
          Selected Priority:{" "}

          <strong>
            {priority}
          </strong>
        </p>

        <button
          className="primary-button"
          onClick={startRehydration}
        >
          Start Rehydration
        </button>

        {rehydrationStatus && (
          <div className="success-message">
            {rehydrationStatus}
          </div>
        )}

      </section>

      {/* PROJECT ARCHITECTURE */}

      <section className="panel">

        <h2>
          Project Architecture
        </h2>

        <div className="architecture">

          <div className="architecture-box">
            React Dashboard
          </div>

          <div className="arrow">
            ↓
          </div>

          <div className="architecture-box">
            Node.js Lifecycle API
          </div>

          <div className="arrow">
            ↓
          </div>

          <div className="architecture-box azure-box">
            Azure Blob Storage
          </div>

          <div className="arrow">
            ↓
          </div>

          <div className="architecture-box">
            Hot → Cool → Archive
          </div>

        </div>

      </section>

      <footer>
        Azure Storage Lifecycle Management
        Hackathon MVP
      </footer>

    </div>
  );
}

export default App;
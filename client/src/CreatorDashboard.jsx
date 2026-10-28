
import { useEffect, useState } from "react";
import axios from "axios";
import "./CreatorDashboard.css";

const API_URL = "http://localhost:5000/api";

export default function CreatorDashboard() {
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [whatsappLinks, setWhatsappLinks] = useState({});
  const [activeSection, setActiveSection] = useState("overview");

  const [portfolio, setPortfolio] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [portfolioMessage, setPortfolioMessage] = useState("");
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [rejectingId, setRejectingId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Creator WhatsApp Settings
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loadingPhone, setLoadingPhone] = useState(false);

  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    category: "Photography",
    imageUrl: "",
  });

  // Creator service management
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceMessage, setServiceMessage] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    category: "Graphic Design",
    price: "",
    deliveryTime: "2",
    dailyBookingLimit: "1",
    status: "Active",
  });

  const user = JSON.parse(
    localStorage.getItem("creatorStudioUser") || "{}"
  );

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("creatorStudioToken")}`,
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
const [servicesResponse, requestsResponse] = await Promise.all([
        axios.get(`${API_URL}/services/me`, {
          headers: headers(),
        }),
        axios.get(`${API_URL}/project-requests/received`, {
          headers: headers(),
        }),
      ]);

      const servicesData = servicesResponse.data;
      const requestsData = requestsResponse.data;

      setServices(
        Array.isArray(servicesData)
          ? servicesData
          : servicesData.services || servicesData.data || []
      );

      setRequests(
        Array.isArray(requestsData)
          ? requestsData
          : requestsData.requests || requestsData.data || []
      );
    } catch (e) {
      console.error("Load creator dashboard error:", e);

      setError(
        e.response?.data?.message ||
          "Unable to load dashboard. Please sign in again if your session has expired."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setServiceError("");
    setServiceMessage("");

    const price = Number(serviceForm.price);
    const deliveryTime = Number(serviceForm.deliveryTime);
    const dailyBookingLimit = Number(serviceForm.dailyBookingLimit);

    if (!serviceForm.title.trim() || !serviceForm.description.trim() || !serviceForm.category) {
      setServiceError("Please fill in the title, description, and category.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setServiceError("Enter a valid price (0 or more).");
      return;
    }
    if (!Number.isInteger(deliveryTime) || deliveryTime < 1) {
      setServiceError("Delivery time must be at least 1 day.");
      return;
    }
    if (!Number.isInteger(dailyBookingLimit) || dailyBookingLimit < 1) {
      setServiceError("Daily booking limit must be at least 1.");
      return;
    }

    try {
      setServiceSaving(true);
      const response = await axios.post(
        `${API_URL}/services`,
        {
          title: serviceForm.title.trim(),
          description: serviceForm.description.trim(),
          category: serviceForm.category,
          price,
          deliveryTime,
          dailyBookingLimit,
          status: serviceForm.status,
        },
        { headers: headers() }
      );

      setServiceForm({
        title: "",
        description: "",
        category: "Graphic Design",
        price: "",
        deliveryTime: "2",
        dailyBookingLimit: "1",
        status: "Active",
      });
      setShowServiceForm(false);
      setServiceMessage(response.data?.message || "Service created successfully.");
      await loadDashboard();
    } catch (e) {
      console.error("Create service error:", e);
      setServiceError(
        e.response?.data?.message || "Unable to create service. Check your login and server API."
      );
    } finally {
      setServiceSaving(false);
    }
  };

  const loadPortfolio = async () => {
    try {
      setPortfolioLoading(true);
      setPortfolioError("");

      const response = await axios.get(`${API_URL}/portfolio/me`, {
        headers: headers(),
      });

      setPortfolio(response.data.portfolio || []);
    } catch (e) {
      console.error("Load portfolio error:", e);

      setPortfolioError(
        e.response?.data?.message || "Unable to load portfolio."
      );
    } finally {
      setPortfolioLoading(false);
    }
  };

  // Load the creator's saved WhatsApp number
  const loadPhoneNumber = async () => {
    try {
      setLoadingPhone(true);
      setPhoneError("");

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: headers(),
      });

      const savedPhone = response.data?.user?.phone || "";
      setPhone(savedPhone);
    } catch (e) {
      console.error("Unable to load creator phone:", e);
      setPhone(user.phone || "");
      setPhoneError(
        e.response?.data?.message ||
          "Unable to load your saved number. Check your login and backend."
      );
    } finally {
      setLoadingPhone(false);
    }
  };

  // Save the creator's WhatsApp number
  const savePhoneNumber = async (e) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^\d{10,15}$/.test(cleanPhone)) {
      setPhoneError(
        "Enter a valid WhatsApp number with country code, e.g. 919876543210."
      );
      setPhoneMessage("");
      return;
    }

    try {
      setSavingPhone(true);
      setPhoneError("");
      setPhoneMessage("");

      const response = await axios.patch(
        `${API_URL}/auth/me/phone`,
        { phone: cleanPhone },
        { headers: headers() }
      );

      const savedPhone = response.data?.user?.phone || cleanPhone;

      setPhone(savedPhone);

      // Update the locally cached creator profile
      localStorage.setItem(
        "creatorStudioUser",
        JSON.stringify({ ...user, phone: savedPhone })
      );

      setPhoneMessage(
        response.data?.message || "WhatsApp number saved successfully!"
      );
    } catch (e) {
      console.error("Save creator phone error:", e);

      setPhoneError(
        e.response?.data?.message ||
          "Unable to save your WhatsApp number. Check the backend API."
      );
    } finally {
      setSavingPhone(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (activeSection === "whatsapp") {
      loadPhoneNumber();
    }
  }, [activeSection]);

  const handlePortfolioSubmit = async (e) => {
    e.preventDefault();
    setPortfolioError("");
    setPortfolioMessage("");

    try {
      setPortfolioLoading(true);

      await axios.post(`${API_URL}/portfolio`, portfolioForm, {
        headers: headers(),
      });

      setPortfolioForm({
        title: "",
        description: "",
        category: "Photography",
        imageUrl: "",
      });

      setShowPortfolioForm(false);
      setPortfolioMessage("Portfolio work added successfully!");

      await loadPortfolio();
    } catch (e) {
      setPortfolioError(
        e.response?.data?.message || "Unable to save portfolio work."
      );
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleRequestStatus = async (id, status, reason = "") => {
    const cleanReason = reason.trim();

    if (status === "Rejected" && !cleanReason) {
      setError("Please enter a rejection reason before declining this request.");
      return;
    }

    if (status === "Rejected" && cleanReason.length > 500) {
      setError("Rejection reason cannot exceed 500 characters.");
      return;
    }

    try {
      setUpdatingId(id);
      setError("");

      const response = await axios.patch(
        `${API_URL}/project-requests/${id}/status`,
        {
          status,
          ...(status === "Rejected"
            ? { rejectionReason: cleanReason }
            : {}),
        },
        {
          headers: headers(),
        }
      );

      const link = response.data?.whatsappLink;

      if (status === "Accepted" && link) {
        setWhatsappLinks((previous) => ({
          ...previous,
          [id]: link,
        }));
      } else if (status === "Accepted") {
        setWhatsappLinks((previous) => {
          const updated = { ...previous };
          delete updated[id];
          return updated;
        });
      }

      setRejectingId("");
      setRejectionReason("");

      await loadDashboard();

      if (status === "Accepted") {
        if (link) {
          window.alert(
            "Booking accepted successfully! You can use the WhatsApp button to contact the client."
          );
        } else {
          window.alert(
            "Booking accepted successfully! No client phone number is available, so a WhatsApp link could not be created."
          );
        }
      } else if (status === "Rejected") {
        window.alert("Project request rejected successfully.");
      } else {
        window.alert(`Project status updated to ${status}.`);
      }
    } catch (e) {
      console.error("Update project status error:", e);

      window.alert(
        e.response?.data?.message ||
          "Unable to update the project request."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("creatorStudioToken");
    localStorage.removeItem("creatorStudioUser");
    window.location.href = "/";
  };

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const pending = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const active = requests.filter((request) =>
    ["Accepted", "In Progress"].includes(request.status)
  ).length;

  const completed = requests.filter(
    (request) => request.status === "Completed"
  ).length;

  const clientName = (request) =>
    request.clientId?.name || request.clientId?.email || "Client";

  const serviceTitle = (request) =>
    request.projectTitle ||
    request.serviceId?.title ||
    "Project request";

  const date = (value) => {
    if (!value) return "Not specified";

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
      ? "Not specified"
      : parsed.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const statusClass = (status) =>
    `status-${(status || "pending").toLowerCase().replace(/\s+/g, "-")}`;

  const nav = [
    { id: "overview", icon: "◈", label: "Overview" },
    { id: "services", icon: "✳", label: "My services" },
    { id: "portfolio", icon: "▧", label: "My Portfolio" },
    {
      id: "requests",
      icon: "⌁",
      label: "Project requests",
      count: pending,
    },
    {
      id: "whatsapp",
      icon: "☎",
      label: "WhatsApp Settings",
    },
  ];

  return (
    <div className="dashboard-page dark-dashboard">
      <aside className="dashboard-sidebar">
        <a className="dashboard-brand" href="/">
          <span className="brand-icon">C</span>
          <span className="brand-word">
            Creator<span>Studio</span>
          </span>
        </a>

        <div className="sidebar-workspace">
          <span className="sidebar-label">WORKSPACE</span>

          <nav className="dashboard-nav">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${
                  activeSection === item.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveSection(item.id);
                  setError("");
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>

                {item.count > 0 && (
                  <span className="creator-nav-count">
                    {item.count}
                  </span>
                )}
              </button>
            ))}

            <a className="nav-item marketplace-link" href="/">
              <span className="nav-icon">↗</span>
              <span className="nav-label">View marketplace</span>
            </a>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {(user.name || "C").charAt(0).toUpperCase()}
            </div>

            <div className="sidebar-user-copy">
              <strong>{user.name || "Creator"}</strong>
              <small>
                <i className="online-dot" /> Creator account
              </small>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            ↪ <span>Sign out</span>
          </button>

          <div className="sidebar-version">
            CREATORSTUDIO <b>•</b> WORKSPACE
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="creator-overline">
              <i className="overline-dot" /> CREATOR WORKSPACE
            </p>

            <h1>
              {activeSection === "overview"
                ? "Your dashboard"
                : activeSection === "services"
                  ? "My services"
                  : activeSection === "portfolio"
                    ? "My Portfolio"
                    : activeSection === "requests"
                      ? "Project requests"
                      : "WhatsApp Settings"}
            </h1>

            <p className="header-subtitle">
              {activeSection === "overview"
                ? "Your creative business, at a glance."
                : activeSection === "services"
                  ? "Showcase your expertise and manage your offers."
                  : activeSection === "portfolio"
                    ? "Manage and showcase your best creative work."
                    : activeSection === "requests"
                      ? "Stay on top of every opportunity coming your way."
                      : "Manage the WhatsApp number saved to your creator account."}
            </p>
          </div>

          <div className="header-actions">
            <span className="live-pill">
              <i className="online-dot" /> WORKSPACE LIVE
            </span>

            <button
              className="creator-refresh-button"
              type="button"
              onClick={() => {
                loadDashboard();
                if (activeSection === "portfolio") loadPortfolio();
                if (activeSection === "whatsapp") loadPhoneNumber();
              }}
              disabled={loading}
            >
              <span>↻</span> Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="creator-error">
            <b>!</b> {error}
          </div>
        )}

        {activeSection === "whatsapp" ? (
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">CREATOR ACCOUNT</span>
                <h2>My WhatsApp Settings</h2>
                <p>
                  Save the WhatsApp number associated with your creator account.
                </p>
              </div>
            </div>

            <div
              className="creator-mini-service"
              style={{
                maxWidth: "560px",
                padding: "28px",
                boxSizing: "border-box",
              }}
            >
              <form onSubmit={savePhoneNumber}>
                <label
                  htmlFor="creatorWhatsAppPhone"
                  style={{
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: 600,
                  }}
                >
                  Your WhatsApp number with country code
                </label>

                <input
                  id="creatorWhatsAppPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError("");
                    setPhoneMessage("");
                  }}
                  placeholder="919876543210"
                  maxLength={20}
                  autoComplete="tel"
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px",
                    borderRadius: "10px",
                    border: "1px solid #45415c",
                    background: "#11111d",
                    color: "#ffffff",
                    marginBottom: "12px",
                  }}
                />

                <p
                  style={{
                    fontSize: "13px",
                    opacity: 0.75,
                    lineHeight: 1.7,
                    marginBottom: "18px",
                  }}
                >
                  India: enter 91 followed by your 10-digit mobile number.
                  Example: 919876543210. Do not include the + sign.
                </p>

                {phoneError && (
                  <p
                    role="alert"
                    style={{
                      color: "#ff7373",
                      marginBottom: "14px",
                    }}
                  >
                    {phoneError}
                  </p>
                )}

                {phoneMessage && (
                  <p
                    role="status"
                    style={{
                      color: "#45d6a0",
                      marginBottom: "14px",
                    }}
                  >
                    {phoneMessage}
                  </p>
                )}

                <button
                  type="submit"
                  className="creator-accept"
                  disabled={savingPhone || loadingPhone}
                >
                  {loadingPhone
                    ? "Loading number..."
                    : savingPhone
                      ? "Saving..."
                      : "Save WhatsApp Number"}
                </button>
              </form>
            </div>

            <div className="creator-empty" style={{ marginTop: "24px" }}>
              <div className="empty-symbol">☎</div>
              <h3>How WhatsApp notifications work</h3>
              <p>
                When a booking is accepted and a WhatsApp link is available,
                you can open the client's chat and send the prepared message
                manually. Your saved number does not automatically switch
                the account logged into WhatsApp Desktop.
              </p>
            </div>
          </section>
        ) : loading ? (
          <div className="creator-loading">
            <span className="loading-orbit" />
            <strong>Preparing your workspace</strong>
            <p>Loading your services and project activity…</p>
          </div>
        ) : (
          <>
            {activeSection === "overview" && (
              <>
                <section className="creator-welcome">
                  <div className="welcome-grid-glow" />

                  <div className="welcome-copy">
                    <span className="creator-welcome-tag">
                      YOUR CREATIVE JOURNEY
                    </span>

                    <h2>
                      Make great things
                      <br />
                      <span>happen, {user.name || "Creator"}.</span>
                    </h2>

                    <p>
                      Your next opportunity could be one project away.
                      Keep your services sharp and your requests moving.
                    </p>

                    <div className="welcome-actions">
                      <button
                        className="welcome-primary"
                        onClick={() => setActiveSection("requests")}
                      >
                        Review requests <span>↗</span>
                      </button>

                      <button
                        className="welcome-secondary"
                        onClick={() => setActiveSection("services")}
                      >
                        Explore services
                      </button>
                    </div>
                  </div>

                  <div className="welcome-visual" aria-hidden="true">
                    <div className="visual-orbit orbit-one" />
                    <div className="visual-orbit orbit-two" />
                    <div className="visual-core">✦</div>
                    <div className="visual-chip chip-top">
                      ✧ Creative mode
                    </div>
                    <div className="visual-chip chip-bottom">
                      <i className="online-dot" /> Ready to create
                    </div>
                  </div>

                  <div className="welcome-index">
                    01 <span>/ 03</span>
                  </div>
                </section>

                <section className="dashboard-stats">
                  {[
                    [
                      "✳",
                      "YOUR CATALOG",
                      "Total services",
                      services.length,
                      "Services on your profile",
                      "violet",
                    ],
                    [
                      "⌁",
                      "NEEDS ATTENTION",
                      "Pending requests",
                      pending,
                      "Waiting for your response",
                      "cyan",
                    ],
                    [
                      "◉",
                      "IN MOTION",
                      "Active projects",
                      active,
                      "Accepted or in progress",
                      "blue",
                    ],
                    [
                      "✓",
                      "MILESTONES",
                      "Completed projects",
                      completed,
                      "Successfully delivered",
                      "green",
                    ],
                  ].map(([icon, kicker, label, value, sub, tone]) => (
                    <article
                      className={`stat-card stat-${tone}`}
                      key={label}
                    >
                      <div className="stat-topline">
                        <span className="stat-icon">{icon}</span>
                        <span className="stat-trend">{kicker}</span>
                      </div>
                      <p>{label}</p>
                      <h2>{String(value).padStart(2, "0")}</h2>
                      <small>{sub}</small>
                      <div className="stat-accent" />
                    </article>
                  ))}
                </section>

                <section className="dashboard-section">
                  <div className="section-heading">
                    <div>
                      <span className="section-kicker">
                        STAY IN THE LOOP
                      </span>
                      <h2>Recent project requests</h2>
                      <p>Fresh opportunities from clients.</p>
                    </div>

                    <button onClick={() => setActiveSection("requests")}>
                      All requests <span>↗</span>
                    </button>
                  </div>

                  {requests.length === 0 ? (
                    <div className="creator-empty">
                      <div className="empty-symbol">⌁</div>
                      <h3>Your next project starts here</h3>
                      <p>
                        When a client requests one of your services, their
                        project details and booking date will appear here.
                      </p>
                      <button
                        className="empty-action"
                        onClick={() => setActiveSection("requests")}
                      >
                        Open project inbox <span>→</span>
                      </button>
                    </div>
                  ) : (
                    <div className="creator-request-list">
                      {requests.slice(0, 5).map((request) => (
                        <article
                          className="creator-request-card"
                          key={request._id}
                        >
                          <div className="creator-request-avatar">
                            {clientName(request).charAt(0).toUpperCase()}
                          </div>

                          <div className="creator-request-info">
                            <h3>{serviceTitle(request)}</h3>
                            <p>
                              {clientName(request)}{" "}
                              <span className="meta-separator">/</span>{" "}
                              {date(request.bookingDate)}
                            </p>
                            <strong>{money(request.budget)}</strong>
                          </div>

                          <span
                            className={`creator-status ${statusClass(
                              request.status
                            )}`}
                          >
                            {request.status || "Pending"}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dashboard-section">
                  <div className="section-heading">
                    <div>
                      <span className="section-kicker">WHAT YOU OFFER</span>
                      <h2>Your services</h2>
                      <p>Your creative work, ready to be discovered.</p>
                    </div>

                    <button onClick={() => setActiveSection("services")}>
                      Manage services <span>↗</span>
                    </button>
                  </div>

                  {services.length === 0 ? (
                    <div className="creator-empty compact-empty">
                      <div className="empty-symbol">✳</div>
                      <h3>Your showcase is ready for its first service</h3>
                      <p>
                        Your active service listings will appear here.
                      </p>
                      <button
                        className="empty-action"
                        onClick={() => setActiveSection("services")}
                      >
                        Open service manager <span>→</span>
                      </button>
                    </div>
                  ) : (
                    <div className="creator-mini-service-grid">
                      {services.slice(0, 3).map((service) => (
                        <article
                          className="creator-mini-service"
                          key={service._id}
                        >
                          <span>
                            {service.category || "Creative service"}
                          </span>
                          <h3>{service.title}</h3>
                          <p>{service.description}</p>
                          <strong>{money(service.price)}</strong>
                          <small>
                            Delivery: {service.deliveryTime || "Flexible"} days
                          </small>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {activeSection === "services" && (
              <section className="dashboard-section services-page-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">
                      YOUR CREATIVE CATALOG
                    </span>
                    <h2>Services you offer</h2>
                    <p>Keep your offers clear, current, and client-ready.</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span className="service-total">
                      {services.length} SERVICES
                    </span>
                    <button
                      type="button"
                      className="creator-accept"
                      onClick={() => {
                        setShowServiceForm((value) => !value);
                        setServiceError("");
                        setServiceMessage("");
                      }}
                    >
                      {showServiceForm ? "Cancel" : "+ Add Service"}
                    </button>
                  </div>
                </div>

                {serviceMessage && <div role="status" className="portfolio-success">{serviceMessage}</div>}
                {serviceError && <div role="alert" className="creator-error">{serviceError}</div>}

                {showServiceForm && (
                  <form className="portfolio-form" onSubmit={handleServiceSubmit} style={{ marginBottom: "24px" }}>
                    <label htmlFor="service-title">Service title *</label>
                    <input
                      id="service-title"
                      value={serviceForm.title}
                      onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                      maxLength={150}
                      required
                      placeholder="e.g. Social Media Poster Design"
                    />

                    <label htmlFor="service-description">Description *</label>
                    <textarea
                      id="service-description"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                      maxLength={1000}
                      rows={4}
                      required
                      placeholder="Describe what the client will receive..."
                    />

                    <label htmlFor="service-category">Category *</label>
                    <select
                      id="service-category"
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                      required
                    >
                      <option>Graphic Design</option>
                      <option>Photography</option>
                      <option>Web Development</option>
                      <option>Video Editing</option>
                      <option>UI/UX Design</option>
                      <option>Content Writing</option>
                      <option>Other</option>
                    </select>

                    <label htmlFor="service-price">Price (₹) *</label>
                    <input
                      id="service-price"
                      type="number"
                      min="0"
                      step="1"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                      required
                      placeholder="500"
                    />

                    <label htmlFor="service-delivery">Delivery time (days) *</label>
                    <input
                      id="service-delivery"
                      type="number"
                      min="1"
                      step="1"
                      value={serviceForm.deliveryTime}
                      onChange={(e) => setServiceForm({ ...serviceForm, deliveryTime: e.target.value })}
                      required
                    />

                    <label htmlFor="service-limit">Maximum bookings per day *</label>
                    <input
                      id="service-limit"
                      type="number"
                      min="1"
                      step="1"
                      value={serviceForm.dailyBookingLimit}
                      onChange={(e) => setServiceForm({ ...serviceForm, dailyBookingLimit: e.target.value })}
                      required
                    />

                    <label htmlFor="service-status">Status</label>
                    <select
                      id="service-status"
                      value={serviceForm.status}
                      onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}
                    >
                      <option value="Active">Active (visible to clients)</option>
                      <option value="Inactive">Inactive (hidden from browsing)</option>
                    </select>

                    <button type="submit" className="creator-accept" disabled={serviceSaving}>
                      {serviceSaving ? "Publishing..." : "Publish Service"}
                    </button>
                  </form>
                )}

                {services.length === 0 ? (
                  <div className="creator-empty services-empty">
                    <div className="empty-illustration">
                      <div className="empty-card empty-card-back" />
                      <div className="empty-card empty-card-front">
                        <span>✳</span>
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className="empty-plus">+</div>
                    </div>

                    <span className="section-kicker">A BLANK CANVAS</span>
                    <h3>Nothing here. Yet.</h3>
                    <p>
                      Your service catalog is empty. Publish a service to
                      make your creative work discoverable in the marketplace.
                    </p>
                    <p className="empty-note">
                      Use the “+ Add Service” button above to publish your first service.
                    </p>
                  </div>
                ) : (
                  <div className="creator-mini-service-grid">
                    {services.map((service) => (
                      <article
                        className="creator-mini-service"
                        key={service._id}
                      >
                        <div className="service-card-top">
                          <span>
                            {service.category || "Creative service"}
                          </span>
                          <span
                            className={`service-status ${
                              service.status === "Inactive" ? "inactive" : ""
                            }`}
                          >
                            {service.status || "Active"}
                          </span>
                        </div>

                        <h3>{service.title}</h3>
                        <p>{service.description || "No description added."}</p>

                        <div className="service-card-footer">
                          <strong>{money(service.price)}</strong>
                          <small>
                            ◷ {service.deliveryTime || "Flexible"} days
                          </small>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeSection === "portfolio" && (
              <section className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">YOUR CREATIVE WORK</span>
                    <h2>My Portfolio</h2>
                    <p>Show clients what you can create.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPortfolioForm(!showPortfolioForm);
                      setPortfolioError("");
                      setPortfolioMessage("");
                    }}
                  >
                    {showPortfolioForm ? "Cancel" : "+ Add Work"}
                  </button>
                </div>

                {portfolioMessage && (
                  <div className="portfolio-success">{portfolioMessage}</div>
                )}

                {portfolioError && (
                  <div className="creator-error">{portfolioError}</div>
                )}

                {showPortfolioForm && (
                  <form
                    className="portfolio-form"
                    onSubmit={handlePortfolioSubmit}
                  >
                    <label htmlFor="portfolio-title">Project title *</label>
                    <input
                      id="portfolio-title"
                      value={portfolioForm.title}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          title: e.target.value,
                        })
                      }
                      maxLength={150}
                      required
                      placeholder="e.g. Wedding Photography"
                    />

                    <label htmlFor="portfolio-category">Category *</label>
                    <select
                      id="portfolio-category"
                      value={portfolioForm.category}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          category: e.target.value,
                        })
                      }
                      required
                    >
                      <option>Photography</option>
                      <option>Graphic Design</option>
                      <option>Web Development</option>
                      <option>Video Editing</option>
                      <option>UI/UX Design</option>
                      <option>Other</option>
                    </select>

                    <label htmlFor="portfolio-description">Description</label>
                    <textarea
                      id="portfolio-description"
                      value={portfolioForm.description}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          description: e.target.value,
                        })
                      }
                      maxLength={1000}
                      rows={4}
                      placeholder="Describe your work..."
                    />

                    <label htmlFor="portfolio-image">
                      Image URL (optional)
                    </label>
                    <input
                      id="portfolio-image"
                      type="url"
                      value={portfolioForm.imageUrl}
                      onChange={(e) =>
                        setPortfolioForm({
                          ...portfolioForm,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="https://example.com/my-work.jpg"
                    />

                    <button type="submit" disabled={portfolioLoading}>
                      {portfolioLoading ? "Saving..." : "Save Portfolio Work"}
                    </button>
                  </form>
                )}

                {portfolioLoading && portfolio.length === 0 ? (
                  <p>Loading portfolio...</p>
                ) : portfolio.length === 0 ? (
                  <div className="creator-empty">
                    <div className="empty-symbol">▧</div>
                    <h3>Your portfolio starts here</h3>
                    <p>
                      Add your best projects so clients can discover your skills.
                    </p>
                    <button
                      type="button"
                      className="empty-action"
                      onClick={() => setShowPortfolioForm(true)}
                    >
                      + Add your first work
                    </button>
                  </div>
                ) : (
                  <div className="creator-mini-service-grid">
                    {portfolio.map((item) => (
                      <article
                        className="creator-mini-service"
                        key={item._id}
                      >
                        {item.imageUrl && (
                          <img
                            className="portfolio-image"
                            src={item.imageUrl}
                            alt={item.title}
                            loading="lazy"
                          />
                        )}

                        <span>{item.category}</span>
                        <h3>{item.title}</h3>
                        <p>{item.description || "No description added."}</p>

                        <button
                          type="button"
                          className="creator-reject"
                          onClick={async () => {
                            if (!window.confirm(`Delete "${item.title}"?`)) {
                              return;
                            }

                            try {
                              setPortfolioError("");

                              await axios.delete(
                                `${API_URL}/portfolio/${item._id}`,
                                { headers: headers() }
                              );

                              setPortfolio((previous) =>
                                previous.filter((work) => work._id !== item._id)
                              );

                              setPortfolioMessage("Portfolio work deleted.");
                            } catch (e) {
                              setPortfolioError(
                                e.response?.data?.message ||
                                  "Unable to delete portfolio work."
                              );
                            }
                          }}
                        >
                          Delete work
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeSection === "requests" && (
              <section className="dashboard-section requests-page-section">
                <div className="section-heading">
                  <div>
                    <span className="section-kicker">CLIENT INBOX</span>
                    <h2>Incoming project requests</h2>
                    <p>Review the brief, then accept or reject each request.</p>
                  </div>

                  <span className="service-total">
                    {requests.length} TOTAL
                  </span>
                </div>

                {requests.length === 0 ? (
                  <div className="creator-empty services-empty">
                    <div className="empty-symbol">⌁</div>
                    <h3>Your inbox is quiet for now</h3>
                    <p>
                      New project requests from clients will appear here when
                      they book your services.
                    </p>
                    <a className="empty-action" href="/">
                      Visit marketplace <span>↗</span>
                    </a>
                  </div>
                ) : (
                  <div className="creator-request-list">
                    {requests.map((request) => (
                      <article
                        className="creator-request-card creator-request-full"
                        key={request._id}
                      >
                        <div className="creator-request-avatar">
                          {clientName(request).charAt(0).toUpperCase()}
                        </div>

                        <div className="creator-request-info">
                          <div className="request-title-line">
                            <h3>{serviceTitle(request)}</h3>

                            <span
                              className={`creator-status ${statusClass(
                                request.status
                              )}`}
                            >
                              {request.status || "Pending"}
                            </span>
                          </div>

                          <p>Client: {clientName(request)}</p>

                          <div className="request-detail-grid">
                            <div>
                              <small>BOOKING DATE</small>
                              <strong>{date(request.bookingDate)}</strong>
                            </div>

                            <div>
                              <small>EXPECTED DELIVERY</small>
                              <strong>{date(request.expectedDeliveryDate)}</strong>
                            </div>

                            <div>
                              <small>PROJECT BUDGET</small>
                              <strong>{money(request.budget)}</strong>
                            </div>
                          </div>

                          {request.description && (
                            <p className="creator-request-description">
                              {request.description}
                            </p>
                          )}

                          {request.rejectionReason && (
                            <p className="rejection-note">
                              Reason: {request.rejectionReason}
                            </p>
                          )}

                          {request.status === "Pending" && (
                            <div className="creator-request-actions">
                              <button
                                type="button"
                                className="creator-accept"
                                disabled={updatingId === request._id}
                                onClick={() =>
                                  handleRequestStatus(request._id, "Accepted")
                                }
                              >
                                {updatingId === request._id
                                  ? "Updating…"
                                  : "✓ Accept request"}
                              </button>

                              {rejectingId !== request._id && (
                                <button
                                  type="button"
                                  className="creator-reject"
                                  disabled={updatingId === request._id}
                                  onClick={() => {
                                    setError("");
                                    setRejectingId(request._id);
                                    setRejectionReason("");
                                  }}
                                >
                                  Decline
                                </button>
                              )}
                            </div>
                          )}

                          {request.status === "Pending" &&
                            rejectingId === request._id && (
                              <form
                                className="rejection-form"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleRequestStatus(
                                    request._id,
                                    "Rejected",
                                    rejectionReason
                                  );
                                }}
                              >
                                <label htmlFor={`reason-${request._id}`}>
                                  Reason for rejection
                                </label>
                                <textarea
                                  id={`reason-${request._id}`}
                                  value={rejectionReason}
                                  onChange={(e) =>
                                    setRejectionReason(e.target.value)
                                  }
                                  placeholder="Explain why you are declining this request..."
                                  maxLength={500}
                                  rows={3}
                                  required
                                />
                                <div className="creator-request-actions">
                                  <button
                                    type="submit"
                                    className="creator-reject"
                                    disabled={
                                      updatingId === request._id ||
                                      !rejectionReason.trim()
                                    }
                                  >
                                    {updatingId === request._id
                                      ? "Declining…"
                                      : "Confirm decline"}
                                  </button>
                                  <button
                                    type="button"
                                    className="creator-refresh-button"
                                    disabled={updatingId === request._id}
                                    onClick={() => {
                                      setRejectingId("");
                                      setRejectionReason("");
                                      setError("");
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            )}

                          {request.status === "Accepted" &&
                            whatsappLinks[request._id] && (
                              <div className="creator-request-actions">
                                <button
                                  type="button"
                                  className="creator-accept"
                                  onClick={() =>
                                    window.open(
                                      whatsappLinks[request._id],
                                      "_blank",
                                      "noopener,noreferrer"
                                    )
                                  }
                                >
                                  Notify Client on WhatsApp
                                </button>
                              </div>
                            )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        <footer className="dashboard-footer">
          <span>© {new Date().getFullYear()} CreatorStudio</span>
          <span>
            BUILT FOR YOUR NEXT BIG IDEA <b>✦</b>
          </span>
        </footer>
      </main>
    </div>
  );
}

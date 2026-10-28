
import { useEffect, useState } from "react";
import axios from "axios";
import "./ClientDashboard.css";

const API_URL = "http://localhost:5000/api";

export default function ClientDashboard() {
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [markingRead, setMarkingRead] = useState(null);

  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loadingPhone, setLoadingPhone] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("creatorStudioUser") || "{}"
  );

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("creatorStudioToken")}`,
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/project-requests/sent`, {
          headers: getHeaders(),
        }),
        axios.get(`${API_URL}/notifications`, {
          headers: getHeaders(),
        }),
      ]);

      const projectResult = results[0];
      const notificationResult = results[1];

      if (projectResult.status === "fulfilled") {
        const data = projectResult.value.data;

        setProjects(
          Array.isArray(data)
            ? data
            : data.requests || data.projectRequests || data.data || []
        );
      } else {
        throw projectResult.reason;
      }

      if (notificationResult.status === "fulfilled") {
        const data = notificationResult.value.data;

        setNotifications(
          Array.isArray(data)
            ? data
            : data.notifications || data.data || []
        );
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Client dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your dashboard. Please sign in again if your session has expired."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPhoneNumber = async () => {
    try {
      setLoadingPhone(true);

      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: getHeaders(),
      });

      const currentPhone = response.data?.user?.phone || "";
      setPhone(currentPhone);
    } catch (err) {
      // The phone number may still be available in local storage.
      setPhone(user.phone || "");
      console.error("Unable to load saved phone number:", err);
    } finally {
      setLoadingPhone(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeSection === "settings") {
      loadPhoneNumber();
    }
  }, [activeSection]);

  const savePhoneNumber = async (e) => {
    e.preventDefault();

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^\d{10,15}$/.test(cleanPhone)) {
      setPhoneError(
        "Enter a valid number with country code, e.g. 919876543210."
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
        { headers: getHeaders() }
      );

      const savedPhone = response.data?.user?.phone || cleanPhone;

      setPhone(savedPhone);

      const updatedUser = {
        ...user,
        phone: savedPhone,
      };

      localStorage.setItem(
        "creatorStudioUser",
        JSON.stringify(updatedUser)
      );

      setPhoneMessage(
        response.data?.message || "WhatsApp number saved successfully!"
      );
    } catch (err) {
      console.error("Save phone number failed:", err);

      setPhoneError(
        err.response?.data?.message ||
          "Unable to save your number. Please check your login and try again."
      );
    } finally {
      setSavingPhone(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (!notificationId || markingRead) return;

    try {
      setMarkingRead(notificationId);
      setError("");

      await axios.patch(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: getHeaders() }
      );

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: true, read: true }
            : item
        )
      );
    } catch (err) {
      console.error("Mark notification as read failed:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark notification as read."
      );
    } finally {
      setMarkingRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setError("");

      await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        { headers: getHeaders() }
      );

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          read: true,
        }))
      );
    } catch (err) {
      console.error("Mark all notifications as read failed:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    }
  };

  const logout = () => {
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

  const statusClass = (status = "Pending") =>
    `status-${status.toLowerCase().replace(/\s+/g, "-")}`;

  const projectTitle = (project) =>
    project.serviceId?.title || project.projectTitle || "Creative project";

  const creatorName = (project) =>
    project.creatorId?.name || project.creatorId?.email || "Creator";

  const inProgress = projects.filter((p) =>
    ["Accepted", "In Progress"].includes(p.status)
  ).length;

  const pending = projects.filter((p) => p.status === "Pending").length;
  const completed = projects.filter((p) => p.status === "Completed").length;

  const unread = notifications.filter(
    (n) => !(n.isRead || n.read)
  ).length;

  const navItems = [
    { id: "overview", icon: "◈", label: "Overview" },
    { id: "projects", icon: "▤", label: "My projects", count: pending },
    { id: "notifications", icon: "♧", label: "Notifications", count: unread },
    { id: "settings", icon: "☎", label: "WhatsApp Settings" },
  ];

  const notificationTitle = (item) => {
    const messages = {
      NEW_PROJECT_REQUEST: "New project request",
      REQUEST_ACCEPTED: "Project request accepted",
      REQUEST_REJECTED: "Project request rejected",
      PROJECT_IN_PROGRESS: "Project started",
      PROJECT_COMPLETED: "Project completed",
    };

    return item.message || messages[item.type] || item.title || "New update";
  };

  const notificationDate = (item) =>
    date(item.createdAt || item.updatedAt);

  return (
    <div className="client-page client-dark-dashboard">
      <aside className="client-sidebar">
        <a className="client-brand" href="/">
          <span className="client-brand-icon">C</span>
          <span>
            Creator<span className="client-brand-accent">Studio</span>
          </span>
        </a>

        <div className="client-sidebar-workspace">
          <span className="client-sidebar-label">WORKSPACE</span>

          <nav className="client-nav" aria-label="Client navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`client-nav-item ${
                  activeSection === item.id ? "active" : ""
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="client-nav-icon">{item.icon}</span>
                <span className="client-nav-label">{item.label}</span>

                {item.count > 0 && (
                  <span className="client-nav-count">{item.count}</span>
                )}
              </button>
            ))}

            <a
              className="client-nav-item client-marketplace-link"
              href="/browse-services"
            >
              <span className="client-nav-icon">✦</span>
              <span className="client-nav-label">Browse services</span>
            </a>
          </nav>
        </div>

        <div className="client-sidebar-bottom">
          <div className="client-user">
            <div className="client-user-avatar">
              {(user.name || "C").charAt(0).toUpperCase()}
            </div>

            <div className="client-user-copy">
              <strong>{user.name || "CreatorStudio Client"}</strong>
              <small>
                <i className="client-online-dot" /> Client workspace
              </small>
            </div>
          </div>

          <button
            className="client-signout"
            type="button"
            onClick={logout}
          >
            ↪ <span>Sign out</span>
          </button>

          <div className="client-sidebar-footnote">
            CREATORSTUDIO <b>•</b> CLIENT SPACE
          </div>
        </div>
      </aside>

      <main className="client-main">
        <header className="client-header">
          <div>
            <p className="client-overline">
              <i /> CLIENT WORKSPACE
            </p>

            <h1>
              {activeSection === "overview"
                ? "Your creative space"
                : activeSection === "projects"
                  ? "My projects"
                  : activeSection === "notifications"
                    ? "Notifications"
                    : "WhatsApp Settings"}
            </h1>

            <p className="client-header-subtitle">
              {activeSection === "overview"
                ? "Track your projects and stay connected with your creators."
                : activeSection === "projects"
                  ? "Every brief, booking, and milestone in one place."
                  : activeSection === "notifications"
                    ? "The latest updates about your creative projects."
                    : "Add your WhatsApp number to receive booking updates."}
            </p>
          </div>

          <div className="client-header-actions">
            <span className="client-live">
              <i className="client-online-dot" /> ACCOUNT ACTIVE
            </span>

            <button
              className="client-refresh"
              type="button"
              onClick={loadDashboard}
              disabled={loading}
            >
              <span>↻</span> Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="client-error">
            <b>!</b> {error}
          </div>
        )}

        {loading ? (
          <div className="client-loading">
            <span className="client-spinner" />
            <strong>Loading your creative space</strong>
            <p>Gathering your projects and updates…</p>
          </div>
        ) : (
          <>
            {activeSection === "overview" && (
              <>
                <section className="client-hero">
                  <div className="client-hero-grid" />

                  <div className="client-hero-copy">
                    <span className="client-hero-tag">
                      YOUR CREATIVE JOURNEY
                    </span>

                    <h2>
                      Ideas become real
                      <br />
                      <span>when we create together.</span>
                    </h2>

                    <p>
                      Keep every project moving forward. Check your latest
                      updates or find the right creative partner for your next
                      idea.
                    </p>

                    <div className="client-hero-actions">
                      <a
                        href="/browse-services"
                        className="client-primary-action"
                      >
                        Explore services <span>↗</span>
                      </a>

                      <button
                        type="button"
                        className="client-secondary-action"
                        onClick={() => setActiveSection("projects")}
                      >
                        View my projects
                      </button>
                    </div>
                  </div>

                  <div className="client-hero-art" aria-hidden="true">
                    <div className="client-art-ring ring-a" />
                    <div className="client-art-ring ring-b" />
                    <div className="client-art-center">✦</div>
                    <span className="client-art-chip art-chip-one">
                      ✧ Your next idea
                    </span>
                    <span className="client-art-chip art-chip-two">
                      Made together
                    </span>
                  </div>

                  <span className="client-hero-number">
                    CREATIVE SPACE <b>01 / 03</b>
                  </span>
                </section>

                <section className="client-stats">
                  <article className="client-stat stat-purple">
                    <div className="client-stat-top">
                      <span>▤</span>
                      <small>ALL TIME</small>
                    </div>
                    <p>Total projects</p>
                    <h2>{String(projects.length).padStart(2, "0")}</h2>
                    <small className="client-stat-note">
                      All your project requests
                    </small>
                    <i />
                  </article>

                  <article className="client-stat stat-teal">
                    <div className="client-stat-top">
                      <span>◷</span>
                      <small>IN MOTION</small>
                    </div>
                    <p>In progress</p>
                    <h2>{String(inProgress).padStart(2, "0")}</h2>
                    <small className="client-stat-note">
                      Projects currently underway
                    </small>
                    <i />
                  </article>

                  <article className="client-stat stat-amber">
                    <div className="client-stat-top">
                      <span>⌁</span>
                      <small>AWAITING</small>
                    </div>
                    <p>Pending requests</p>
                    <h2>{String(pending).padStart(2, "0")}</h2>
                    <small className="client-stat-note">
                      Waiting for creator response
                    </small>
                    <i />
                  </article>

                  <article className="client-stat stat-blue">
                    <div className="client-stat-top">
                      <span>✓</span>
                      <small>DELIVERED</small>
                    </div>
                    <p>Completed</p>
                    <h2>{String(completed).padStart(2, "0")}</h2>
                    <small className="client-stat-note">
                      Projects marked complete
                    </small>
                    <i />
                  </article>
                </section>

                <section className="client-panel">
                  <div className="client-section-heading">
                    <div>
                      <span className="client-section-kicker">
                        PROJECT ACTIVITY
                      </span>
                      <h2>Recent projects</h2>
                      <p>Keep track of the work you have requested.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSection("projects")}
                    >
                      View all projects <span>↗</span>
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="client-empty">
                      <div className="client-empty-icon">▤</div>
                      <h3>Your project story starts here</h3>
                      <p>
                        Browse the marketplace and find a creator for your
                        next idea. Your project requests will appear here.
                      </p>
                      <a
                        className="client-empty-action"
                        href="/browse-services"
                      >
                        Browse creative services <span>→</span>
                      </a>
                    </div>
                  ) : (
                    <div className="client-project-list">
                      {projects.slice(0, 4).map((project) => (
                        <article
                          className="client-project-card"
                          key={project._id}
                        >
                          <div className="client-project-symbol">✳</div>

                          <div className="client-project-info">
                            <h3>{projectTitle(project)}</h3>
                            <p>
                              {creatorName(project)} <span>/</span> Requested{" "}
                              {date(project.createdAt)}
                            </p>
                            <strong>{money(project.budget)}</strong>
                          </div>

                          <span
                            className={`client-status ${statusClass(
                              project.status
                            )}`}
                          >
                            {project.status || "Pending"}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <section className="client-bottom-grid">
                  <article className="client-tip-card">
                    <span className="client-section-kicker">NEXT STEP</span>
                    <div className="client-tip-icon">✦</div>
                    <h3>Have a new idea?</h3>
                    <p>
                      Discover creative professionals and find a service that
                      matches your vision.
                    </p>
                    <a href="/browse-services">
                      Find your creator <span>↗</span>
                    </a>
                  </article>

                  <article className="client-panel client-recent-panel">
                    <div className="client-section-heading">
                      <div>
                        <span className="client-section-kicker">
                          STAY UPDATED
                        </span>
                        <h2>Latest notifications</h2>
                        <p>Important changes and project updates.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveSection("notifications")}
                      >
                        View all <span>↗</span>
                      </button>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="client-inline-empty">
                        <span>♧</span>
                        <p>
                          You're all caught up. New notifications will appear
                          here.
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 3).map((n, i) => (
                        <div
                          className="client-notification-row"
                          key={n._id || n.id || i}
                        >
                          <span className="notification-pip" />
                          <div>
                            <strong>{notificationTitle(n)}</strong>
                            <small>{notificationDate(n)}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </article>
                </section>
              </>
            )}

            {activeSection === "projects" && (
              <section className="client-panel client-full-page">
                <div className="client-section-heading">
                  <div>
                    <span className="client-section-kicker">
                      YOUR PROJECT BOARD
                    </span>
                    <h2>All projects</h2>
                    <p>Review status, budget, and creator details.</p>
                  </div>

                  <span className="client-total-pill">
                    {projects.length} PROJECTS
                  </span>
                </div>

                {projects.length === 0 ? (
                  <div className="client-empty client-empty-large">
                    <div className="client-empty-icon">▤</div>
                    <h3>No projects yet</h3>
                    <p>
                      Once you send a project request, it will show up here
                      with its status and booking details.
                    </p>
                    <a
                      className="client-empty-action"
                      href="/browse-services"
                    >
                      Browse services <span>↗</span>
                    </a>
                  </div>
                ) : (
                  <div className="client-project-list">
                    {projects.map((project) => (
                      <article
                        className="client-project-card client-project-full"
                        key={project._id}
                      >
                        <div className="client-project-symbol">✳</div>

                        <div className="client-project-info">
                          <h3>{projectTitle(project)}</h3>
                          <p>Creator: {creatorName(project)}</p>

                          <div className="client-project-details">
                            <div>
                              <small>REQUESTED</small>
                              <strong>{date(project.createdAt)}</strong>
                            </div>
                            <div>
                              <small>BOOKING DATE</small>
                              <strong>{date(project.bookingDate)}</strong>
                            </div>
                            <div>
                              <small>EXPECTED DELIVERY</small>
                              <strong>{date(project.expectedDeliveryDate)}</strong>
                            </div>
                            <div>
                              <small>BUDGET</small>
                              <strong>{money(project.budget)}</strong>
                            </div>
                          </div>

                          {project.description && (
                            <p className="client-project-description">
                              {project.description}
                            </p>
                          )}

                          {project.rejectionReason && (
                            <p className="client-rejection">
                              Creator's reason: {project.rejectionReason}
                            </p>
                          )}
                        </div>

                        <span
                          className={`client-status ${statusClass(
                            project.status
                          )}`}
                        >
                          {project.status || "Pending"}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeSection === "notifications" && (
              <section className="client-panel client-full-page">
                <div className="client-section-heading">
                  <div>
                    <span className="client-section-kicker">
                      YOUR ACTIVITY FEED
                    </span>
                    <h2>Notifications</h2>
                    <p>Updates related to your project requests.</p>
                    <p>
                      {unread} unread notification{unread === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div>
                    <span className="client-total-pill">
                      {notifications.length} UPDATES
                    </span>

                    {unread > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        style={{ marginLeft: "12px" }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="client-empty client-empty-large">
                    <div className="client-empty-icon">♧</div>
                    <h3>Nothing new right now</h3>
                    <p>
                      When a creator responds or a project status changes, the
                      update will appear here.
                    </p>
                    <button
                      type="button"
                      className="client-empty-action"
                      onClick={loadDashboard}
                    >
                      Refresh updates <span>↻</span>
                    </button>
                  </div>
                ) : (
                  <div className="client-notifications-list">
                    {notifications.map((n, i) => {
                      const isRead = Boolean(n.isRead || n.read);

                      return (
                        <article
                          className="client-notification-card"
                          key={n._id || n.id || i}
                        >
                          <span className="client-notification-icon">✦</span>

                          <div>
                            <strong>{notificationTitle(n)}</strong>

                            {n.description && <p>{n.description}</p>}

                            <small>{notificationDate(n)}</small>
                            <small>Type: {n.type || "GENERAL"}</small>

                            {!isRead && (
                              <button
                                type="button"
                                onClick={() => markAsRead(n._id)}
                                disabled={markingRead === n._id}
                              >
                                {markingRead === n._id
                                  ? "Marking..."
                                  : "Mark as read"}
                              </button>
                            )}

                            {isRead && <small>✓ Read</small>}
                          </div>

                          <span
                            className={`client-read-indicator ${
                              isRead ? "read" : ""
                            }`}
                          />
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {activeSection === "settings" && (
              <section className="client-panel client-full-page">
                <div className="client-section-heading">
                  <div>
                    <span className="client-section-kicker">
                      ACCOUNT SETTINGS
                    </span>
                    <h2>WhatsApp number</h2>
                    <p>
                      Add your WhatsApp number so creators can contact you
                      about accepted project requests.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={savePhoneNumber}
                  style={{ maxWidth: "520px" }}
                >
                  <label
                    htmlFor="clientWhatsAppPhone"
                    style={{
                      display: "block",
                      marginBottom: "10px",
                    }}
                  >
                    WhatsApp number with country code
                  </label>

                  {loadingPhone ? (
                    <p>Loading saved number...</p>
                  ) : (
                    <input
                      id="clientWhatsAppPhone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError("");
                        setPhoneMessage("");
                      }}
                      placeholder="919876543210"
                      maxLength={16}
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
                  )}

                  <p style={{ fontSize: "13px", opacity: 0.75 }}>
                    For an Indian number, enter 91 followed by your 10-digit
                    mobile number. Enter digits only, without the + sign.
                  </p>

                  {phoneError && (
                    <p role="alert" style={{ color: "#ff7373" }}>
                      {phoneError}
                    </p>
                  )}

                  {phoneMessage && (
                    <p role="status" style={{ color: "#45d6a0" }}>
                      {phoneMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="client-primary-action"
                    disabled={savingPhone || loadingPhone}
                  >
                    {savingPhone ? "Saving..." : "Save WhatsApp Number"}
                  </button>
                </form>
              </section>
            )}
          </>
        )}

        <footer className="client-footer">
          <span>© {new Date().getFullYear()} CreatorStudio</span>
          <span>
            MADE FOR GOOD IDEAS <b>✦</b>
          </span>
        </footer>
      </main>
    </div>
  );
}


import { useEffect, useState } from "react";
import axios from "axios";
import "./BookService.css";

const API_URL = "http://localhost:5000/api";

export default function BookService() {
  const serviceId = window.location.pathname.split("/").filter(Boolean).pop();
  const token = localStorage.getItem("creatorStudioToken");
  const user = JSON.parse(localStorage.getItem("creatorStudioUser") || "{}");

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    projectTitle: "",
    description: "",
    budget: "",
    bookingDate: "",
  });

  useEffect(() => {
    let mounted = true;

    const fetchService = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_URL}/services`);
        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : data.services || data.data || [];

        const found = list.find((item) => item._id === serviceId);

        if (!found) {
          throw new Error(
            "This service could not be found. It may have been removed or is no longer available."
          );
        }

        if (mounted) {
          setService(found);
          setForm((current) => ({
            ...current,
            projectTitle: current.projectTitle || found.title || "",
            budget: current.budget || String(found.price || ""),
          }));
        }
      } catch (err) {
        console.error("Book service load error:", err);

        if (mounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load this service. Please try again."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchService();

    return () => {
      mounted = false;
    };
  }, [serviceId]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  const submitRequest = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (user.role && user.role !== "client") {
      setError("Please sign in with a client account to request a service.");
      return;
    }

    if (
      !form.projectTitle.trim() ||
      !form.description.trim() ||
      !form.budget ||
      !form.bookingDate
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (Number(form.budget) <= 0) {
      setError("Budget must be greater than zero.");
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(
        `${API_URL}/project-requests`,
        {
          serviceId,
          projectTitle: form.projectTitle.trim(),
          description: form.description.trim(),
          budget: Number(form.budget),
          bookingDate: form.bookingDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Your project request has been sent to the creator.");

      setForm((current) => ({
        ...current,
        description: "",
      }));
    } catch (err) {
      console.error("Book service submit error:", err);

      if (err.response?.status === 409) {
        setError(
          "Slot Full! This creator is not available on the selected date. Please choose another date."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Could not send your request. Please check the details and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="book-page">
      <header className="book-topbar">
        <a href="/" className="book-brand">
          <span className="book-brand-icon">C</span>
          <span>
            Creator<span>Studio</span>
          </span>
        </a>

        <nav className="book-nav">
          <a href="/">Home</a>
          <a href="/browse-services">Browse services</a>
          <a href="/client-dashboard">My dashboard</a>
        </nav>

        <a className="book-top-cta" href="/browse-services">
          ← Back to services
        </a>
      </header>

      <main className="book-main">
        <div className="book-breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/browse-services">Services</a>
          <span>/</span>
          <strong>Request a service</strong>
        </div>

        {loading ? (
          <div className="book-loading">
            <span className="book-spinner" />
            <strong>Preparing your booking</strong>
            <p>Loading service details…</p>
          </div>
        ) : !service ? (
          <div className="book-error-state">
            <span>!</span>
            <h2>Service unavailable</h2>
            <p>{error || "We couldn't find this service."}</p>
            <a href="/browse-services">Return to services ↗</a>
          </div>
        ) : (
          <>
            <section className="book-heading">
              <div>
                <span className="book-eyebrow">
                  <i /> START A PROJECT
                </span>
                <h1>
                  Let's make
                  <br />
                  <span>something great.</span>
                </h1>
                <p>
                  Share a few details about your idea. The creator will review
                  your request and get back to you.
                </p>
              </div>

              <div className="book-heading-art" aria-hidden="true">
                <div className="book-ring ring-one" />
                <div className="book-ring ring-two" />
                <div className="book-art-symbol">✦</div>
                <span className="book-art-label">YOUR NEXT IDEA</span>
              </div>
            </section>

            <div className="book-layout">
              <section className="book-form-panel">
                <div className="book-panel-heading">
                  <div>
                    <span className="book-section-kicker">PROJECT BRIEF</span>
                    <h2>Tell us what you need</h2>
                    <p>
                      Give the creator enough context to understand your vision.
                    </p>
                  </div>

                  <span className="book-step-badge">
                    STEP 01 <b>/ 01</b>
                  </span>
                </div>

                {error && (
                  <div
                    className="book-alert book-alert-error"
                    role="alert"
                    aria-live="polite"
                  >
                    <b>!</b>
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div
                    className="book-alert book-alert-success"
                    role="status"
                    aria-live="polite"
                  >
                    <b>✓</b>
                    <span>
                      {success}
                      <br />
                      <a href="/client-dashboard">View your dashboard ↗</a>
                    </span>
                  </div>
                )}

                <form onSubmit={submitRequest}>
                  <div className="book-form-grid">
                    <div className="book-field book-field-full">
                      <label htmlFor="projectTitle">
                        Project title <span>*</span>
                      </label>
                      <input
                        id="projectTitle"
                        name="projectTitle"
                        value={form.projectTitle}
                        onChange={updateField}
                        placeholder="e.g. Brand identity for my new café"
                        maxLength={100}
                        required
                      />
                      <small>A short name that describes your project.</small>
                    </div>

                    <div className="book-field book-field-full">
                      <label htmlFor="description">
                        Project description <span>*</span>
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={updateField}
                        placeholder="Tell the creator about your goals, style, requirements, references, and what success looks like…"
                        rows={6}
                        maxLength={3000}
                        required
                      />
                      <small>
                        Include important details, deadlines, and preferences.
                      </small>
                    </div>

                    <div className="book-field">
                      <label htmlFor="budget">
                        Your budget (₹) <span>*</span>
                      </label>
                      <div className="book-input-prefix">
                        <span>₹</span>
                        <input
                          id="budget"
                          name="budget"
                          type="number"
                          min="1"
                          step="1"
                          value={form.budget}
                          onChange={updateField}
                          placeholder="Enter budget"
                          required
                        />
                      </div>
                      <small>Service listing: {money(service.price)}</small>
                    </div>

                    <div className="book-field">
                      <label htmlFor="bookingDate">
                        Preferred booking date <span>*</span>
                      </label>
                      <input
                        id="bookingDate"
                        name="bookingDate"
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={form.bookingDate}
                        onChange={updateField}
                        required
                      />
                      <small>Choose the date you would like to book.</small>
                    </div>
                  </div>

                  <div className="book-form-footer">
                    <span>
                      <b>*</b> Required fields
                    </span>
                    <button type="submit" disabled={submitting}>
                      {submitting ? "Sending request…" : "Send project request"}
                      <span>↗</span>
                    </button>
                  </div>
                </form>
              </section>

              <aside className="book-summary-column">
                <section className="book-service-summary">
                  <div className="book-summary-art">
                    <span className="book-summary-tag">
                      {service.category || "CREATIVE SERVICE"}
                    </span>
                    <div className="book-summary-symbol">✦</div>
                    <span className="book-summary-number">
                      CS / 0{String(service._id || "").slice(-1) || "1"}
                    </span>
                  </div>

                  <div className="book-summary-content">
                    <span className="book-section-kicker">
                      YOU'RE REQUESTING
                    </span>
                    <h2>{service.title}</h2>
                    <p>
                      {service.description ||
                        "A tailored creative service for your project."}
                    </p>

                    <div className="book-creator">
                      <span>
                        {String(
                          service.creatorId?.name ||
                            service.creatorId?.username ||
                            service.creator?.name ||
                            "C"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <div>
                        <small>YOUR CREATOR</small>
                        <strong>
                          {service.creatorId?.name ||
                            service.creatorId?.username ||
                            service.creator?.name ||
                            "Creative Professional"}
                        </strong>
                      </div>

                      <i />
                    </div>

                    <div className="book-summary-price">
                      <div>
                        <small>LISTED PRICE</small>
                        <strong>{money(service.price)}</strong>
                      </div>
                      <span>
                        ◷ {service.deliveryTime || "Flexible"} day delivery
                      </span>
                    </div>
                  </div>
                </section>

                <section className="book-trust-card">
                  <div className="book-trust-icon">✧</div>
                  <div>
                    <strong>Made for collaboration</strong>
                    <p>
                      Your request goes to the creator for review. You can
                      track its status from your client dashboard.
                    </p>
                  </div>
                </section>

                <div className="book-privacy-note">
                  <span>◈</span>
                  <p>
                    Your project details are shared with the selected creator
                    so they can review your request.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}

        <footer className="book-footer">
          <span>© {new Date().getFullYear()} CreatorStudio</span>
          <span>
            GOOD IDEAS DESERVE GREAT CREATORS <b>✦</b>
          </span>
        </footer>
      </main>
    </div>
  );
}

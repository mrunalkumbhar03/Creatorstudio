
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Home.css";

const API_URL = "http://localhost:5000/api";

const categories = [
  "All Services",
  "Photography",
  "Graphic Design",
  "Video Editing",
  "Web Design",
  "Social Media",
];

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Services");
  const [budget, setBudget] = useState("10000");

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await axios.get(`${API_URL}/services`);
        setServices(response.data.services || []);
      } catch (err) {
        console.error("Unable to load services:", err);
        setError("Services could not be loaded. Please check that your backend is running.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    const maxBudget = budget === "" ? Infinity : Number(budget);

    return services.filter((service) => {
      const matchesSearch =
        !query ||
        `${service.title} ${service.description} ${service.category} ${
          service.creatorId?.name || ""
        }`
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "All Services" ||
        (service.category || "").toLowerCase().includes(category.toLowerCase());

      const matchesBudget =
        budget === "" ||
        (Number.isFinite(maxBudget) &&
          Number(service.price) <= maxBudget);

      return matchesSearch && matchesCategory && matchesBudget;
    });
  }, [services, search, category, budget]);

  const handleBook = (serviceId) => {
    const token = localStorage.getItem("creatorStudioToken");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const user = JSON.parse(
      localStorage.getItem("creatorStudioUser") || "{}"
    );

    if (user.role !== "client") {
      alert("Please sign in with a client account to book a service.");
      return;
    }

    window.location.href = `/book-service/${serviceId}`;
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <a className="home-brand" href="/">
          <span className="home-brand-icon">C</span>
          <span>CreatorStudio</span>
        </a>

        <nav className="home-nav">
          <a href="#services">Explore Services</a>
          <a href="#categories">Categories</a>
          <a href="#how-it-works">How It Works</a>
        </nav>

        <div className="home-header-actions">
          <a className="home-login" href="/login">
            Log in
          </a>
          <a className="home-get-started" href="/login?mode=register">
            Get Started
          </a>
        </div>
      </header>

      <main>
        <section className="home-hero">
          <div className="home-hero-content">
            <span className="home-eyebrow">
              YOUR IDEA. THE RIGHT CREATIVE.
            </span>

            <h1>
              Great ideas deserve
              <span> great creators.</span>
            </h1>

            <p>
              Discover photographers, designers, video editors, and other
              creative professionals for your next project.
            </p>

            <form
              className="home-search"
              onSubmit={(e) => {
                e.preventDefault();
                document
                  .getElementById("services")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="home-search-icon">⌕</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="What service are you looking for?"
                aria-label="Search services"
              />
              <button type="submit">Search services</button>
            </form>

            <div className="home-popular">
              <span>Popular:</span>
              {["Logo Design", "Photography", "Video Editing"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSearch(item);
                    document
                      .getElementById("services")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="home-hero-art" aria-label="Creative work collage">
            <div className="hero-art-main">
              <img
                src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=85"
                alt="Photographer capturing a creative portrait"
              />
            </div>
            <div className="hero-art-small hero-art-design">
              <img
                src="/images/creative-design.jpg"
                alt="Creative graphic design work"
              />
            </div>
            <div className="hero-art-small hero-art-workspace">
              <img
                src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=500&q=85"
                alt="Modern creative workspace"
              />
            </div>
            <div className="hero-floating-note">
              <span className="hero-note-icon">✦</span>
              <div>
                <strong>Ideas into impact</strong>
                <small>Made together</small>
              </div>
            </div>
          </div>
        </section>

        <section className="home-categories" id="categories">
          <div>
            <span className="home-eyebrow">FIND YOUR CREATIVE</span>
            <h2>Explore by category</h2>
          </div>

          <div className="category-chips">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={category === item ? "category-chip selected" : "category-chip"}
                onClick={() => {
                  setCategory(item);
                  document
                    .getElementById("services")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {item === "All Services" && <span>✦</span>}
                {item === "Photography" && <span>◎</span>}
                {item === "Graphic Design" && <span>◈</span>}
                {item === "Video Editing" && <span>▷</span>}
                {item === "Web Design" && <span>⌘</span>}
                {item === "Social Media" && <span>♡</span>}
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="home-marketplace" id="services">
          <div className="marketplace-heading">
            <div>
              <span className="home-eyebrow">MADE FOR YOUR NEXT PROJECT</span>
              <h2>Explore creative services</h2>
              <p>Find the right talent without losing sight of your budget.</p>
            </div>
            <a href="/browse-services" className="view-all-services">
              View all services <span>↗</span>
            </a>
          </div>

          <div className="marketplace-layout">
            <aside className="home-filter">
              <h3>Refine your search</h3>

              <label htmlFor="budget">Your maximum budget</label>
              <div className="budget-input-wrap">
                <span>₹</span>
                <input
                  id="budget"
                  type="number"
                  min="0"
                  placeholder="10000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <p className="filter-hint">
                Only show services priced within your budget.
              </p>

              <div className="filter-divider" />

              <h4>Categories</h4>
              {categories.map((item) => (
                <label className="filter-option" key={item}>
                  <input
                    type="radio"
                    name="serviceCategory"
                    checked={category === item}
                    onChange={() => setCategory(item)}
                  />
                  <span>{item}</span>
                </label>
              ))}

              <button
                type="button"
                className="clear-filters"
                onClick={() => {
                  setBudget("");
                  setSearch("");
                  setCategory("All Services");
                }}
              >
                Clear filters
              </button>
            </aside>

            <div className="home-services-area">
              <div className="services-results-bar">
                <span>
                  <strong>{filteredServices.length}</strong>{" "}
                  {filteredServices.length === 1 ? "service" : "services"} found
                </span>
                <span className="results-budget">
                  {budget !== "" && `Budget: up to ${formatPrice(budget)}`}
                </span>
              </div>

              {loading && (
                <div className="home-state">
                  <div className="home-spinner" />
                  <p>Finding creative services for you...</p>
                </div>
              )}

              {!loading && error && (
                <div className="home-state home-error">
                  <h3>We couldn't load services</h3>
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && filteredServices.length === 0 && (
                <div className="home-state">
                  <span className="empty-search-icon">⌕</span>
                  <h3>No matching services yet</h3>
                  <p>Try a higher budget or choose a different category.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setBudget("");
                      setSearch("");
                      setCategory("All Services");
                    }}
                  >
                    Show all services
                  </button>
                </div>
              )}

              <div className="home-service-grid">
                {filteredServices.slice(0, 9).map((service, index) => (
                  <article className="home-service-card" key={service._id}>
                    <div className={`service-card-art service-art-${index % 3}`}>
                      <div className="service-art-symbol">
                        {index % 3 === 0 ? "✳" : index % 3 === 1 ? "◈" : "✦"}
                      </div>
                      <span>{service.category || "Creative service"}</span>
                    </div>

                    <div className="service-card-body">
                      <div className="service-creator-line">
                        <span className="creator-avatar">
                          {(service.creatorId?.name || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <span>{service.creatorId?.name || "Creative professional"}</span>
                      </div>

                      <h3>{service.title}</h3>
                      <p className="service-description">
                        {service.description || "A creative service tailored to your project."}
                      </p>

                      <div className="service-card-meta">
                        <span>◷ {service.deliveryTime || "Flexible"} days</span>
                        <span>✦ Creative work</span>
                      </div>

                      <div className="service-card-bottom">
                        <div>
                          <small>Starting at</small>
                          <strong>{formatPrice(service.price)}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBook(service._id)}
                        >
                          Book <span>↗</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {!loading && !error && filteredServices.length > 9 && (
                <button
                  className="load-more-services"
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("services")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Showing the first 9 services
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="home-how" id="how-it-works">
          <span className="home-eyebrow">SIMPLE FROM START TO FINISH</span>
          <h2>Your next project, made easier.</h2>

          <div className="home-how-grid">
            <article>
              <span className="how-number">01</span>
              <h3>Discover</h3>
              <p>Search creative services by category and budget.</p>
            </article>
            <article>
              <span className="how-number">02</span>
              <h3>Choose</h3>
              <p>Compare service details, prices, and delivery times.</p>
            </article>
            <article>
              <span className="how-number">03</span>
              <h3>Collaborate</h3>
              <p>Send a project request and connect with a creator.</p>
            </article>
          </div>
        </section>

        <section className="home-cta">
          <div>
            <span className="home-eyebrow">FOR CREATIVE PROFESSIONALS</span>
            <h2>Your talent deserves to be discovered.</h2>
            <p>Create your profile, showcase your work, and find your next client.</p>
          </div>
          <a href="/login?mode=register">Join as a creator <span>↗</span></a>
        </section>
      </main>

      <footer className="home-footer">
        <a className="home-brand" href="/">
          <span className="home-brand-icon">C</span>
          <span>CreatorStudio</span>
        </a>
        <span>Built for creative minds. © 2026 CreatorStudio.</span>
        <div>
          <a href="/login">Log in</a>
          <a href="/login?mode=register">Create account</a>
        </div>
      </footer>
    </div>
  );
}

export default Home;

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./BrowseServices.css";

const API_URL = "http://localhost:5000/api";

const CATEGORIES = [
  "All services",
  "Photography",
  "Graphic Design",
  "Video Editing",
  "Web Development",
  "Content Creation",
  "Other",
];

const categoryIcon = (category = "") => {
  const value = category.toLowerCase();
  if (value.includes("photo")) return "◉";
  if (value.includes("design") || value.includes("logo")) return "✳";
  if (value.includes("video") || value.includes("edit")) return "▶";
  if (value.includes("web") || value.includes("development")) return "⌘";
  if (value.includes("content") || value.includes("writing")) return "✎";
  return "✦";
};

const creatorName = (service) =>
  service.creatorId?.name || service.creator?.name || service.creatorName || "Creative professional";

export default function BrowseServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All services");
  const [maxBudget, setMaxBudget] = useState("Any budget");
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState("grid");

  const user = JSON.parse(localStorage.getItem("creatorStudioUser") || "{}");

  useEffect(() => {
    let mounted = true;
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${API_URL}/services`);
        const data = response.data;
        const list = Array.isArray(data) ? data : data.services || data.data || [];
        if (mounted) setServices(list);
      } catch (err) {
        console.error("Browse services error:", err);
        if (mounted) setError(err.response?.data?.message || "Unable to load services. Please make sure the backend is running.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchServices();
    return () => { mounted = false; };
  }, []);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = services.filter((service) => {
      const text = `${service.title || ""} ${service.description || ""} ${service.category || ""} ${creatorName(service)}`.toLowerCase();
      const matchesSearch = !term || text.includes(term);
      const matchesCategory = category === "All services" ||
        (service.category || "").toLowerCase().includes(category.toLowerCase()) ||
        (category === "Graphic Design" && /logo|graphic|design/i.test(service.title || ""));
      const price = Number(service.price) || 0;
      const matchesBudget = maxBudget === "Any budget" ||
        (maxBudget === "Under ₹5,000" && price < 5000) ||
        (maxBudget === "₹5,000–₹10,000" && price >= 5000 && price <= 10000) ||
        (maxBudget === "₹10,000–₹25,000" && price > 10000 && price <= 25000) ||
        (maxBudget === "₹25,000+" && price > 25000);
      return matchesSearch && matchesCategory && matchesBudget;
    });

    return [...list].sort((a, b) => {
      if (sort === "price-low") return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (sort === "price-high") return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (sort === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return 0;
    });
  }, [services, search, category, maxBudget, sort]);

  const openBooking = (service) => {
    const token = localStorage.getItem("creatorStudioToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    if (user.role && user.role !== "client") {
      window.alert("Please sign in with a client account to request a service.");
      return;
    }
    window.location.href = `/book-service/${service._id}`;
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All services");
    setMaxBudget("Any budget");
    setSort("recommended");
  };

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  return (
    <div className="browse-page">
      <header className="browse-topbar">
        <a href="/" className="browse-brand"><span className="browse-brand-icon">C</span><span>Creator<span>Studio</span></span></a>
        <nav className="browse-topnav">
          <a href="/">Home</a>
          <a href="/browse-services" className="selected">Browse services</a>
          {localStorage.getItem("creatorStudioToken") ? (
            <a href={user.role === "creator" ? "/creator-dashboard" : "/client-dashboard"}>Dashboard</a>
          ) : <a href="/login">Sign in</a>}
        </nav>
        <a className="browse-top-cta" href={localStorage.getItem("creatorStudioToken") ? (user.role === "creator" ? "/creator-dashboard" : "/client-dashboard") : "/login?mode=register"}>
          {localStorage.getItem("creatorStudioToken") ? "My workspace" : "Join CreatorStudio"} <span>↗</span>
        </a>
      </header>

      <main className="browse-main">
        <section className="browse-hero">
          <div className="browse-hero-grid" />
          <div className="browse-hero-copy">
            <span className="browse-eyebrow"><i /> THE CREATIVE MARKETPLACE</span>
            <h1>Find your next<br /><span>creative partner.</span></h1>
            <p>Discover talented creators, compare services, and turn the idea in your head into something real.</p>
            <div className="browse-searchbar">
              <span>⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Try logo design, photography, video…" aria-label="Search services" />
              <button type="button" onClick={() => document.getElementById("browse-results")?.scrollIntoView({ behavior: "smooth" })}>Search <span>↗</span></button>
            </div>
            <div className="browse-hero-meta"><span><b>✦</b> Independent creators</span><span><b>◈</b> Clear pricing</span><span><b>✓</b> Direct project requests</span></div>
          </div>
          <div className="browse-hero-art" aria-hidden="true">
            <div className="browse-art-ring ring-one" /><div className="browse-art-ring ring-two" />
            <div className="browse-art-card art-card-one"><span>CREATIVE BRIEF</span><i /><i /><i /><b>✳</b></div>
            <div className="browse-art-card art-card-two"><span>✦</span><strong>Make it<br />memorable.</strong><small>YOUR NEXT IDEA</small></div>
            <div className="browse-art-orb">✦</div>
          </div>
          <div className="browse-hero-foot"><span>DISCOVER <b>01</b></span><span>IDEAS START HERE ↘</span></div>
        </section>

        <section className="browse-categories">
          <div><span className="browse-section-kicker">EXPLORE YOUR OPTIONS</span><h2>What are you creating?</h2></div>
          <div className="browse-category-chips">
            {CATEGORIES.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item === "All services" ? "✦" : categoryIcon(item)} <span>{item}</span></button>)}
          </div>
        </section>

        <section className="browse-results-section" id="browse-results">
          <aside className="browse-filter-panel">
            <div className="browse-filter-title"><div><span className="browse-section-kicker">REFINE SEARCH</span><h2>Filters</h2></div><button type="button" onClick={clearFilters}>Reset</button></div>
            <label className="browse-field-label" htmlFor="browse-category">Category</label>
            <select id="browse-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((item) => <option key={item}>{item}</option>)}
            </select>
            <label className="browse-field-label" htmlFor="browse-budget">Your budget</label>
            <select id="browse-budget" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)}>
              {["Any budget", "Under ₹5,000", "₹5,000–₹10,000", "₹10,000–₹25,000", "₹25,000+"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <div className="browse-filter-note"><span>✦</span><div><strong>Good work, clear prices.</strong><p>Compare listed services and choose the right fit for your brief.</p></div></div>
          </aside>

          <div className="browse-results">
            <div className="browse-results-heading">
              <div><span className="browse-section-kicker">CURATED FOR YOUR NEXT IDEA</span><h2>Explore services <span>{filteredServices.length}</span></h2><p>Find the right skills for your next project.</p></div>
              <div className="browse-result-controls">
                <label htmlFor="browse-sort">Sort by</label>
                <select id="browse-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="recommended">Recommended</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
                </select>
                <div className="browse-view-toggle"><button type="button" className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view">▦</button><button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view">☷</button></div>
              </div>
            </div>

            {error && <div className="browse-error"><b>!</b>{error}<button type="button" onClick={() => window.location.reload()}>Retry</button></div>}
            {loading ? <div className="browse-loading"><span /><strong>Finding creative services</strong><p>Loading available services…</p></div> :
              filteredServices.length === 0 ? <div className="browse-empty"><div>⌕</div><h3>No services match those filters</h3><p>Try another search term or reset your filters to see all available services.</p><button type="button" onClick={clearFilters}>Clear all filters ↗</button></div> :
                <div className={`browse-service-grid ${view === "list" ? "list-view" : ""}`}>
                  {filteredServices.map((service, index) => <article className="browse-service-card" key={service._id || index}>
                    <div className={`browse-service-art service-art-${index % 5}`}><span className="service-art-category">{service.category || "CREATIVE SERVICE"}</span><span className="service-art-icon">{categoryIcon(service.category || service.title)}</span><span className="service-art-index">{String(index + 1).padStart(2, "0")}</span><div className="service-art-glow" /></div>
                    <div className="browse-service-body">
                      <div className="browse-creator-line"><span className="browse-creator-avatar">{creatorName(service).charAt(0).toUpperCase()}</span><span>{creatorName(service)}</span><span className="browse-creator-badge">CREATOR</span></div>
                      <h3>{service.title || "Creative service"}</h3><p className="browse-service-description">{service.description || "A tailored creative service for your next project."}</p>
                      <div className="browse-service-meta"><span>◷ {service.deliveryTime || "Flexible"} day delivery</span><span>◈ {service.dailyBookingLimit || 1} slot/day</span></div>
                      <div className="browse-service-footer"><div><small>STARTING AT</small><strong>{money(service.price)}</strong></div><button type="button" onClick={() => openBooking(service)}>View & request <span>↗</span></button></div>
                    </div>
                  </article>)}
                </div>}
          </div>
        </section>

        <section className="browse-how"><div><span className="browse-section-kicker">SIMPLE BY DESIGN</span><h2>From idea to done.</h2><p>A straightforward way to work with creative talent.</p></div><div className="browse-how-steps"><article><span>01</span><h3>Discover</h3><p>Browse services and compare creators.</p></article><article><span>02</span><h3>Send a brief</h3><p>Choose a service and share your project details.</p></article><article><span>03</span><h3>Create together</h3><p>Track the request and stay connected.</p></article></div></section>
      </main>

      <footer className="browse-footer"><a href="/" className="browse-brand"><span className="browse-brand-icon">C</span><span>Creator<span>Studio</span></span></a><span>GOOD IDEAS DESERVE GREAT CREATORS <b>✦</b></span><span>© {new Date().getFullYear()} CreatorStudio</span></footer>
    </div>
  );
}

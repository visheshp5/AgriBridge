import { useMemo, useState } from "react";
import "./App.css";

const INITIAL_CROPS = ["Wheat", "Rice", "Potato", "Mustard", "Maize"];

const DEMO_MARKETS = [
  { id: "agra", name: "Agra Mandi", type: "Mandi", distance: 42, price: 2650, transport: 1400, handling: 250, commission: 150, freshness: "Updated today, 9:15 AM", buyers: 8, note: "Strong demand for quality wheat" },
  { id: "hathras", name: "Hathras Mandi", type: "Mandi", distance: 35, price: 2580, transport: 1100, handling: 220, commission: 130, freshness: "Updated today, 8:40 AM", buyers: 5, note: "Lower transport cost" },
  { id: "mathura", name: "Mathura Mandi", type: "Mandi", distance: 8, price: 2500, transport: 400, handling: 180, commission: 125, freshness: "Updated today, 9:00 AM", buyers: 11, note: "Closest option with active buyers" },
];

const BUYERS = [
  { id: "b1", name: "Shree Krishna Foods", location: "Mathura, UP", crops: "Wheat, Rice", rating: "4.8", verified: true, price: 2675, distance: 12, quantity: "10–50 quintals", payment: "Within 2 days" },
  { id: "b2", name: "Brij Agro Traders", location: "Agra, UP", crops: "Wheat, Mustard", rating: "4.6", verified: true, price: 2700, distance: 39, quantity: "20–100 quintals", payment: "On delivery" },
  { id: "b3", name: "Kisan Direct Procurement", location: "Hathras, UP", crops: "Wheat, Potato, Maize", rating: "4.7", verified: true, price: 2600, distance: 31, quantity: "5–75 quintals", payment: "Within 24 hours" },
];

const NEWS = [
  { category: "Market update", crop: "Wheat", title: "Regional wheat arrivals remain steady across nearby mandis", source: "AgriBridge Market Desk", time: "Today · 9:30 AM", summary: "Compare the latest available quotes and account for transport expenses before choosing a selling destination." },
  { category: "Weather", crop: "All crops", title: "Check local weather before scheduling produce transport", source: "Local advisory", time: "Today · 8:10 AM", summary: "Review current local forecasts and confirm road and loading conditions before dispatching a shipment." },
  { category: "Policy", crop: "Rice", title: "Keep sale receipts and quality details for every transaction", source: "Farmer guidance", time: "Yesterday", summary: "A clear record of quantity, grade, agreed price and deductions can help resolve disputes." },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Home", icon: "⌂" },
  { id: "sell", label: "Want to sell", icon: "↗" },
  { id: "history", label: "Selling history", icon: "▤" },
  { id: "news", label: "Mandi news", icon: "◉" },
  { id: "earnings", label: "Total earnings", icon: "₹" },
  { id: "deals", label: "Active deals", icon: "⇄" },
  { id: "profile", label: "Profile", icon: "♙" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

const BUYER_NAV_ITEMS = [
  { id: "dashboard", label: "Home", icon: "⌂" },
  { id: "buy", label: "Find produce", icon: "⌕" },
  { id: "offers", label: "Incoming offers", icon: "⇄" },
  { id: "history", label: "Purchase history", icon: "▤" },
  { id: "news", label: "Market news", icon: "◉" },
  { id: "profile", label: "Profile", icon: "♙" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

const DEMO_TRANSACTIONS = [
  { id: "AG-1048", crop: "Wheat", date: "18 Oct 2026", quantity: 18, quality: "FAQ Grade", price: 2520, gross: 45360, expenses: 1720, net: 43640, buyer: "Brij Agro Traders", status: "Completed" },
  { id: "AG-1039", crop: "Potato", date: "11 Oct 2026", quantity: 25, quality: "Grade A", price: 1350, gross: 33750, expenses: 2150, net: 31600, buyer: "Mathura Fresh Produce", status: "Completed" },
  { id: "AG-1021", crop: "Rice", date: "02 Oct 2026", quantity: 12, quality: "Grade A", price: 3180, gross: 38160, expenses: 1380, net: 36780, buyer: "Shree Krishna Foods", status: "Completed" },
];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

function Icon({ children, className = "" }) {
  return <span className={`icon ${className}`} aria-hidden="true">{children}</span>;
}

function App() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("Kisan");
  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [registration, setRegistration] = useState({
    name: "", phone: "", email: "", password: "", confirmPassword: "", role: "farmer",
    state: "", district: "", village: "",
  });

  function updateRegistration(field, value) {
    setRegistration((current) => ({ ...current, [field]: value }));
  }

  function submitRegistration(event) {
    event.preventDefault();
    if (registration.password !== registration.confirmPassword) {
      window.alert("Passwords do not match. Please confirm your password.");
      return;
    }
    setUserName(registration.name.trim());
    const fullLocation = [registration.village, registration.district, registration.state]
      .filter(Boolean).join(", ");
    if (fullLocation) {
      setLocation(fullLocation);
      setSearchLocation(fullLocation);
    }
    signIn(registration.role, "register");
  }
  const [page, setPage] = useState("landing");
  const [language, setLanguage] = useState("English");
  const [location, setLocation] = useState("Mathura, Uttar Pradesh");
  const [locationEditing, setLocationEditing] = useState(false);
  const [locationDraft, setLocationDraft] = useState(location);
  const [voiceListening, setVoiceListening] = useState(false);
  const [toast, setToast] = useState("");
  const [crop, setCrop] = useState("Wheat");
  const [customCrop, setCustomCrop] = useState("");
  const [quantity, setQuantity] = useState("20");
  const [quality, setQuality] = useState("FAQ Grade");
  const [searchLocation, setSearchLocation] = useState("Mathura, Uttar Pradesh");
  const [searchType, setSearchType] = useState("all");
  const [negotiationBuyer, setNegotiationBuyer] = useState(null);
  const [counterPrice, setCounterPrice] = useState("2750");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [transactions, setTransactions] = useState(DEMO_TRANSACTIONS);
  const [historyCrop, setHistoryCrop] = useState("All crops");
  const [historyPeriod, setHistoryPeriod] = useState("All time");
  const [newsFilter, setNewsFilter] = useState("All news");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [savedCrops, setSavedCrops] = useState(INITIAL_CROPS.slice(0, 3));
  const [offerStatus, setOfferStatus] = useState({});
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const effectiveCrop = crop === "Other" ? customCrop.trim() || "New crop" : crop;
  const quantityNumber = Math.max(0, Number(quantity) || 0);
  const farmerTotalEarnings = transactions.reduce((sum, item) => sum + item.net, 0);
  const isBuyer = role === "buyer";
  const navItems = isBuyer ? BUYER_NAV_ITEMS : NAV_ITEMS;

  const marketResults = useMemo(() => {
    const basePriceAdjust = effectiveCrop.toLowerCase() === "rice" ? 550 : effectiveCrop.toLowerCase() === "potato" ? -1300 : effectiveCrop.toLowerCase() === "mustard" ? 900 : effectiveCrop.toLowerCase() === "maize" ? -350 : 0;
    const rows = DEMO_MARKETS.map((market) => {
      const price = market.price + basePriceAdjust;
      const gross = price * quantityNumber;
      const costs = market.transport + market.handling + market.commission;
      return { ...market, price, gross, costs, net: gross - costs };
    });
    return rows.sort((a, b) => b.net - a.net);
  }, [effectiveCrop, quantityNumber]);

  const buyerResults = useMemo(() => {
    const q = buyerSearch.toLowerCase();
    return BUYERS.filter((buyer) =>
      `${buyer.name} ${buyer.location} ${buyer.crops}`.toLowerCase().includes(q)
    );
  }, [buyerSearch]);

  const filteredTransactions = transactions.filter((item) => {
    const matchesCrop = historyCrop === "All crops" || item.crop === historyCrop;
    const matchesPeriod = historyPeriod === "All time" ||
      (historyPeriod === "Last 30 days" && ["18 Oct 2026", "11 Oct 2026", "02 Oct 2026"].includes(item.date));
    return matchesCrop && matchesPeriod;
  });

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

  function signIn(selectedRole, mode = "login") {
    setRole(selectedRole);
    setPage("dashboard");
    if (mode !== "register") {
      setUserName(selectedRole === "farmer" ? "Ramesh ji" : "Brij Agro");
      setLocation(selectedRole === "farmer" ? "Mathura, Uttar Pradesh" : "Agra, Uttar Pradesh");
      setSearchLocation(selectedRole === "farmer" ? "Mathura, Uttar Pradesh" : "Agra, Uttar Pradesh");
    }
    notify(mode === "register" ? "Demo account created. Welcome to AgriBridge!" : "Welcome back! You are signed in with a demo account.");
  }

  function logout() {
    setRole("");
    setPage("landing");
    setNegotiationBuyer(null);
    setToast("");
  }

  function navigate(nextPage) {
    setPage(nextPage);
    setNegotiationBuyer(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notify("Voice commands are not supported in this browser. Try Chrome or use the text controls.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === "Hindi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.onstart = () => setVoiceListening(true);
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => {
      setVoiceListening(false);
      notify("We couldn't hear that clearly. Please try again.");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (transcript.includes("sell") || transcript.includes("बेच")) navigate(isBuyer ? "buy" : "sell");
      else if (transcript.includes("history") || transcript.includes("इतिहास")) navigate("history");
      else if (transcript.includes("news") || transcript.includes("समाचार")) navigate("news");
      else notify(`Heard: “${event.results[0][0].transcript}”. Try “sell produce”, “history” or “news”.`);
    };
    recognition.start();
  }

  function openNegotiation(buyer) {
    setNegotiationBuyer(buyer);
    setCounterPrice(String(buyer.price || 2650));
    setChatMessages([
      { from: "system", text: `Conversation started with ${buyer.name}. Keep all price and delivery terms in this chat.` },
      { from: "buyer", text: `Hello! We are interested in ${effectiveCrop}. Our indicative offer is ${formatMoney(buyer.price || 2650)} per quintal.` },
    ]);
  }

  function sendChatMessage() {
    if (!chatMessage.trim()) return;
    setChatMessages((previous) => [...previous, { from: "farmer", text: chatMessage.trim() }]);
    setChatMessage("");
  }

  function submitCounterOffer() {
    if (!negotiationBuyer || Number(counterPrice) <= 0) return;
    setChatMessages((previous) => [...previous, { from: "farmer", text: `Counter-offer: ${formatMoney(counterPrice)} per quintal for ${quantityNumber} quintals. Please review.` }]);
    notify("Counter-offer sent in this demo.");
  }

  function acceptOffer(buyer) {
    setOfferStatus((previous) => ({ ...previous, [buyer.id]: "Accepted" }));
    notify(`Offer from ${buyer.name} accepted in this demo.`);
  }

  function renderLanding() {
    return (
      <div className="landing-page">
        <header className="public-nav">
          <button className="brand" onClick={() => navigate("landing")}><span className="brand-mark">a.</span><span>AgriBridge<span className="brand-dot">.</span></span></button>
          <nav><a href="#how-it-works">Features</a><a href="#about" onClick={(event) => { event.preventDefault(); navigate("about"); }}>About us</a><a href="#contact">Contact</a></nav>
          <div className="public-actions">
            <button className="button button-quiet" onClick={() => navigate("login")}>Log in</button>
            <button className="button button-primary" onClick={() => navigate("register")}>Create account <span>↗</span></button>
          </div>
        </header>

        <section className="landing-hero">
          <div className="landing-copy">
            <span className="eyebrow"><span className="eyebrow-line" /> BETTER MARKETS. BETTER RETURNS.</span>
            <h1>Your harvest deserves <em>a better deal.</em></h1>
            <p>Compare market prices, discover trusted buyers and understand your expected returns—all in one simple place.</p>
            <div className="landing-cta">
              <button className="button button-primary button-large" onClick={() => navigate("register")}>Get started <span>→</span></button>
              <button className="button button-outline button-large" onClick={() => navigate("login")}>I already have an account</button>
            </div>
            <div className="trust-line"><span className="trust-check">✓</span> Designed for farmers and agricultural buyers</div>
          </div>
          <div className="landing-visual">
            <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85" alt="Golden agricultural fields at sunrise" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement.classList.add("image-unavailable"); }} />
            <div className="visual-card visual-card-top"><span className="mini-icon">↗</span><div><strong>Compare your options</strong><small>Prices, costs and expected returns</small></div></div>
            <div className="visual-card visual-card-bottom"><span className="status-dot" /><div><small>YOUR NEXT STEP</small><strong>Make an informed sale</strong></div></div>
            <div className="visual-caption">FROM FIELD <span>→</span> TO BETTER RETURNS</div>
          </div>
        </section>

        <section className="value-strip" id="how-it-works">
          <div><span className="value-icon">⌕</span><strong>Compare markets</strong><p>See available prices and costs side by side.</p></div>
          <div><span className="value-icon">♧</span><strong>Find buyers</strong><p>Explore potential buyers for your produce.</p></div>
          <div><span className="value-icon">₹</span><strong>Understand returns</strong><p>Estimate what you may earn after expenses.</p></div>
        </section>

        <section className="about-section" id="about">
          <div><span className="eyebrow">ABOUT AGRIBRIDGE</span><h2>Clear information.<br /><em>Confident decisions.</em></h2></div>
          <p>AgriBridge brings market information, buyer discovery and selling tools together so farmers and buyers can make better-informed decisions. We aim to make agricultural trade easier to understand, one transaction at a time.</p>
        </section>

        <section className="role-cta">
          <div><span className="eyebrow">GET STARTED TODAY</span><h2>Choose how you'll use AgriBridge.</h2><p>Try the prototype with a demo farmer or buyer account.</p></div>
          <div className="role-buttons"><button className="button button-primary" onClick={() => signIn("farmer", "register")}>Continue as farmer <span>→</span></button><button className="button button-outline" onClick={() => signIn("buyer", "register")}>Continue as buyer <span>→</span></button></div>
        </section>
        <PublicFooter />
      </div>
    );
  }

  function renderAbout() {
    return (
      <div className="landing-page about-page">
        <header className="public-nav">
          <button className="brand" onClick={() => navigate("landing")}><span className="brand-mark">a.</span><span>AgriBridge<span className="brand-dot">.</span></span></button>
          <nav><a href="#" onClick={(event) => { event.preventDefault(); navigate("landing"); }}>Home</a><a className="nav-current" href="#about-story">About</a><a href="#about-features">Features</a><a href="#about-contact">Contact</a></nav>
          <div className="public-actions"><button className="button button-quiet" onClick={() => navigate("login")}>Log in</button><button className="button button-primary" onClick={() => navigate("register")}>Register <span>↗</span></button></div>
        </header>
        <section className="about-hero" id="about-story"><div><span className="eyebrow">ABOUT AGRIBRIDGE</span><h1>Making agricultural trade <em>clearer and fairer.</em></h1><p>AgriBridge is a farmer-first agricultural marketplace that brings market insights, buyer connections and decision-support tools into one accessible experience.</p><button className="button button-primary" onClick={() => navigate("register")}>Get started <span>→</span></button></div><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85" alt="A young plant growing in rich soil" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement.classList.add("image-unavailable"); }} /></section>
        <section className="about-pillars" id="about-features">{[{icon:"◎",title:"Our mission",text:"Help farmers make informed selling decisions and reach better opportunities."},{icon:"◉",title:"Our vision",text:"A stronger, more transparent agricultural marketplace for every participant."},{icon:"♧",title:"What we do",text:"Connect farmers and buyers with market information, negotiation and profit estimates."},{icon:"♙",title:"Our impact",text:"Support clearer pricing, better preparation and more confident transactions."}].map((item)=><article key={item.title}><span>{item.icon}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</section>
        <section className="about-contact" id="about-contact"><div><span className="eyebrow">START WITH A BETTER DECISION</span><h2>Built around real agricultural decisions.</h2><p>Explore the demo as a farmer or buyer and see how the workflows fit together.</p></div><div className="role-buttons"><button className="button button-primary" onClick={() => signIn("farmer", "register")}>Continue as farmer <span>→</span></button><button className="button button-outline" onClick={() => signIn("buyer", "register")}>Continue as buyer <span>→</span></button></div></section>
        <PublicFooter />
      </div>
    );
  }

  function renderAuth() {
    const isRegister = page === "register";
    return (
      <div className={`auth-page ${isRegister ? "auth-register-page" : ""}`}>
        <button className="brand auth-brand" onClick={() => navigate("landing")}><span className="brand-mark">a.</span><span>AgriBridge<span className="brand-dot">.</span></span></button>
        <div className={`auth-layout ${isRegister ? "auth-layout-register" : ""}`}>
        <div className="auth-card">
          <div className="auth-heading"><span className="eyebrow">{isRegister ? "JOIN AGRIBRIDGE" : "WELCOME BACK"}</span><h1>{isRegister ? "Create your account" : "Log in to AgriBridge"}</h1><p>{isRegister ? "Add your details to get started." : "Select your demo account to continue."}</p></div>
          {isRegister ? (
            <form className="registration-form" onSubmit={submitRegistration}>
              <label className="field-label">Full name<input className="field-control" autoComplete="name" placeholder="Enter your full name" value={registration.name} onChange={(event) => updateRegistration("name", event.target.value)} required /></label>
              <div className="registration-grid">
                <label className="field-label">Phone number<input className="field-control" type="tel" autoComplete="tel" inputMode="tel" pattern="[+0-9()\- ]{7,20}" placeholder="Enter phone number" value={registration.phone} onChange={(event) => updateRegistration("phone", event.target.value)} required /></label>
                <label className="field-label">Email ID<input className="field-control" type="email" autoComplete="email" placeholder="you@example.com" value={registration.email} onChange={(event) => updateRegistration("email", event.target.value)} required /></label>
              </div>
              <label className="field-label">Password<div className="password-input-wrap"><input className="field-control" type={showRegistrationPassword ? "text" : "password"} autoComplete="new-password" minLength="6" placeholder="Create a password (6+ characters)" value={registration.password} onChange={(event) => updateRegistration("password", event.target.value)} required /><button className="password-eye" type="button" aria-label={showRegistrationPassword ? "Hide password" : "Show password"} title={showRegistrationPassword ? "Hide password" : "Show password"} onClick={() => setShowRegistrationPassword((visible) => !visible)}>{showRegistrationPassword ? "Hide" : "Show"}</button></div></label>
              <label className="field-label">Confirm password<div className="password-input-wrap"><input className="field-control" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" minLength="6" placeholder="Re-enter your password" value={registration.confirmPassword} onChange={(event) => updateRegistration("confirmPassword", event.target.value)} required /></div><button className="password-eye confirm-password-eye" type="button" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} title={showConfirmPassword ? "Hide password" : "Show password"} onClick={() => setShowConfirmPassword((visible) => !visible)}>{showConfirmPassword ? "Hide" : "Show"}</button></label>
              <label className="field-label">Role<select className="field-control" value={registration.role} onChange={(event) => updateRegistration("role", event.target.value)}><option value="farmer">Farmer</option><option value="buyer">Buyer</option></select></label>
              <div className="registration-section-label">YOUR LOCATION</div>
              <div className="registration-grid registration-location-grid">
                <label className="field-label">State<input className="field-control" autoComplete="address-level1" placeholder="e.g. Uttar Pradesh" value={registration.state} onChange={(event) => updateRegistration("state", event.target.value)} required /></label>
                <label className="field-label">District<input className="field-control" autoComplete="address-level2" placeholder="Enter district" value={registration.district} onChange={(event) => updateRegistration("district", event.target.value)} required /></label>
                <label className="field-label registration-village">Village<input className="field-control" autoComplete="address-level3" placeholder="Enter village" value={registration.village} onChange={(event) => updateRegistration("village", event.target.value)} required /></label>
              </div>
              <button className="button button-primary registration-submit" type="submit">Create account <span>→</span></button>
            </form>
          ) : (
            <>
              <label className="field-label">Email or mobile number<input className="field-control" placeholder="demo@agribridge.in" defaultValue="demo@agribridge.in" /></label>
              <label className="field-label login-password-label">Password<div className="password-input-wrap"><input className="field-control" placeholder="Demo password" type={showLoginPassword ? "text" : "password"} defaultValue="agribridge" /><button className="password-eye" type="button" aria-label={showLoginPassword ? "Hide password" : "Show password"} title={showLoginPassword ? "Hide password" : "Show password"} onClick={() => setShowLoginPassword((visible) => !visible)}>{showLoginPassword ? "Hide" : "Show"}</button></div></label>
              <div className="role-choice-label">CONTINUE AS</div>
              <div className="role-choice-grid">
                <button className="role-choice" onClick={() => signIn("farmer", "login")}><span className="role-choice-icon">♧</span><strong>Farmer</strong><small>Sell crops and track earnings</small><span className="role-choice-arrow">→</span></button>
                <button className="role-choice" onClick={() => signIn("buyer", "login")}><span className="role-choice-icon buyer-icon">▤</span><strong>Buyer</strong><small>Find produce and manage offers</small><span className="role-choice-arrow">→</span></button>
              </div>
            </>
          )}
          <p className="auth-note"><Icon>i</Icon> Demo mode only. Details are not saved to a server.</p>
          <p className="auth-switch">{isRegister ? "Already have an account?" : "New to AgriBridge?"} <button onClick={() => navigate(isRegister ? "login" : "register")}>{isRegister ? "Log in" : "Create account"}</button></p>
          <button className="back-link" onClick={() => navigate("landing")}>← Back to home</button>
        </div>
        <aside className="auth-visual"><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=85" alt="Sunlight over an agricultural field" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement.classList.add("image-unavailable"); }} /><div className="auth-visual-overlay"><span className="eyebrow">GROW · CONNECT · PROSPER</span><h2>Better connections.<br/>Better opportunities.</h2><div className="auth-benefit">✓ Real-time market information</div><div className="auth-benefit">✓ Buyer discovery and negotiation</div><div className="auth-benefit">✓ Clearer selling decisions</div></div></aside>
        </div>
        <p className="auth-footer">AgriBridge · Connecting farmers to better market opportunities</p>
      </div>
    );
  }

  function renderHeader() {
    return (
      <header className="app-header">
        <button className="brand" onClick={() => navigate("dashboard")}><span className="brand-mark">a.</span><span>AgriBridge<span className="brand-dot">.</span></span></button>
        <div className="header-tools">
          <div className="location-control">
            <Icon>⌖</Icon>
            {locationEditing ? <><input aria-label="Location" value={locationDraft} onChange={(event) => setLocationDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (setLocation(locationDraft), setSearchLocation(locationDraft), setLocationEditing(false), notify("Location updated."))} /><button onClick={() => { setLocation(locationDraft); setSearchLocation(locationDraft); setLocationEditing(false); notify("Location updated."); }}>Save</button></> : <><span>{location}</span><button aria-label="Change location" title="Change location" onClick={() => { setLocationDraft(location); setLocationEditing(true); }}>⌄</button></>}
          </div>
          <label className="language-select"><Icon>文</Icon><select aria-label="Language" value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>Hindi</option></select></label>
          <button className={`voice-button ${voiceListening ? "listening" : ""}`} onClick={startVoice} title="Voice commands"><Icon>♩</Icon><span>{voiceListening ? "Listening…" : "Voice"}</span></button>
          <button className="avatar-button" title="Profile" onClick={() => navigate("profile")}>{(userName || "K").trim().charAt(0).toUpperCase()}</button>
        </div>
      </header>
    );
  }

  function renderSidebar() {
    return (
      <aside className="sidebar">
        <div className="sidebar-profile"><div className="profile-avatar">{isBuyer ? "B" : "R"}</div><div><strong>{userName}</strong><small>{isBuyer ? "Verified buyer · Demo" : "Farmer account · Demo"}</small></div></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map((item) => <button key={item.id} className={`side-nav-item ${page === item.id ? "selected" : ""}`} onClick={() => navigate(item.id)}><Icon>{item.icon}</Icon><span>{item.label}</span>{item.id === "deals" && <span className="nav-count">2</span>}</button>)}
        </nav>
        <div className="sidebar-help"><span className="help-spark">✳</span><strong>Need a hand?</strong><p>Use voice assistance or explore the help section.</p><button onClick={() => navigate("help")}>Get help <span>→</span></button></div>
        <button className="side-logout" onClick={logout}><Icon>↪</Icon> Log out</button>
      </aside>
    );
  }

  function PageHeading({ eyebrow, title, description, action }) {
    return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
  }

  function MetricCard({ label, value, note, icon, tone = "" }) {
    return <div className={`metric-card ${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong>{value}</strong><small>{note}</small></div>;
  }

  function renderDashboard() {
    const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
    return (
      <>
        <div className="welcome-banner"><div><span className="eyebrow">{isBuyer ? "BUYER WORKSPACE" : "YOUR FARMER WORKSPACE"}</span><h1>{greeting}, {userName.split(" ")[0]} <span className="wave">✳</span></h1><p>{isBuyer ? "Find quality produce, manage offers and keep your procurement moving." : "What would you like to do today? Your next selling decision starts here."}</p></div><div className="welcome-art"><span>♧</span><small>{isBuyer ? "SMARTER SOURCING" : "GROW. COMPARE. EARN."}</small></div></div>
        <div className="metric-grid">
          <MetricCard label={isBuyer ? "Purchases completed" : "Total net earnings"} value={isBuyer ? "12" : formatMoney(farmerTotalEarnings)} note={isBuyer ? "Across your demo account" : "From 3 completed demo sales"} icon="₹" />
          <MetricCard label={isBuyer ? "Open purchase requests" : "Active deals"} value={isBuyer ? "4" : "2"} note={isBuyer ? "Awaiting supplier response" : "1 offer · 1 negotiation"} icon="⇄" tone="metric-green" />
          <MetricCard label={isBuyer ? "Offers to review" : "Saved crops"} value={isBuyer ? "3" : savedCrops.length} note={isBuyer ? "Respond when you're ready" : "Your frequently sold crops"} icon="▤" tone="metric-gold" />
        </div>
        <div className="section-title-row"><div><h2>What would you like to do?</h2><p>Choose a task to get started.</p></div></div>
        <div className="action-grid">
          {(isBuyer ? [
            { id: "buy", icon: "⌕", title: "Find produce", text: "Browse available crops and connect with farmers", cta: "Explore listings", tone: "green" },
            { id: "offers", icon: "⇄", title: "Incoming offers", text: "Review offers and negotiate terms", cta: "Review offers", tone: "gold" },
            { id: "history", icon: "▤", title: "Purchase history", text: "Track previous purchases and records", cta: "View history", tone: "blue" },
            { id: "news", icon: "◉", title: "Market news", text: "Follow crops and markets that matter", cta: "Read updates", tone: "purple" },
          ] : [
            { id: "sell", icon: "↗", title: "Sell produce", text: "Compare mandis, buyers and estimated returns", cta: "Find best option", tone: "green" },
            { id: "history", icon: "▤", title: "Selling history", text: "Review sales, expenses and net profit", cta: "View transactions", tone: "gold" },
            { id: "news", icon: "◉", title: "Mandi news", text: "See crop and local market updates", cta: "Read updates", tone: "blue" },
            { id: "crops", icon: "♧", title: "My crops", text: "Manage your usual crops and preferences", cta: "Manage crops", tone: "purple" },
          ]).map((item) => <button key={item.id} className="action-card" onClick={() => navigate(item.id)}><span className={`action-icon ${item.tone}`}>{item.icon}</span><strong>{item.title}</strong><p>{item.text}</p><span className="action-cta">{item.cta} <b>→</b></span></button>)}
        </div>
        <div className="dashboard-bottom-grid">
          <section className="panel opportunity-panel"><div className="panel-heading"><div><span className="eyebrow">{isBuyer ? "PROCUREMENT OPPORTUNITY" : "MARKET OPPORTUNITY"}</span><h2>{isBuyer ? "Wheat available nearby" : "A market worth comparing"}</h2></div><span className="panel-spark">✳</span></div><div className="opportunity-content"><div className="crop-avatar">♧</div><div className="opportunity-details"><strong>{isBuyer ? "Wheat · FAQ Grade" : "Agra Mandi · Wheat"}</strong><span>{isBuyer ? "From nearby demo suppliers" : "42 km from your selected location"}</span></div><div className="opportunity-price"><strong>{isBuyer ? "₹2,675" : formatMoney(marketResults[0]?.price || 2650)}</strong><small>per quintal · demo</small></div></div><button className="text-action" onClick={() => navigate(isBuyer ? "buy" : "sell")}>{isBuyer ? "Browse available produce" : "Compare all selling options"} <span>→</span></button></section>
          <section className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">QUICK OVERVIEW</span><h2>Recent activity</h2></div><button className="subtle-link" onClick={() => navigate(isBuyer ? "history" : "history")}>View all →</button></div>{(isBuyer ? [{ title: "Wheat purchase request", subtitle: "Awaiting supplier response", status: "Pending" }, { title: "Rice · 12 quintals", subtitle: "Completed 02 Oct 2026", status: "Completed" }] : [{ title: "Wheat · 18 quintals", subtitle: "Brij Agro Traders · 18 Oct", status: "Completed" }, { title: "Potato · 25 quintals", subtitle: "Mathura Fresh Produce · 11 Oct", status: "Completed" }]).map((activity) => <div className="activity-item" key={activity.title}><span className="activity-check">{activity.status === "Completed" ? "✓" : "…"}</span><div><strong>{activity.title}</strong><small>{activity.subtitle}</small></div><span className={`status-pill ${activity.status === "Completed" ? "success" : "pending"}`}>{activity.status}</span></div>)}</section>
        </div>
      </>
    );
  }

  function renderSellPage() {
    const selectedCrop = effectiveCrop;
    return (
      <>
        <PageHeading eyebrow="SELL PRODUCE" title="Find your best selling option." description="Compare potential buyers and mandis by expected return, not just the listed price." action={<button className="button button-outline" onClick={() => navigate("crops")}>♧ My saved crops</button>} />
        <div className="sell-stepper"><div className="sell-step active"><span>1</span><strong>Select crop</strong></div><i></i><div className="sell-step active"><span>2</span><strong>Enter details</strong></div><i></i><div className="sell-step"><span>3</span><strong>Find buyers</strong></div><i></i><div className="sell-step"><span>4</span><strong>AI suggestion</strong></div></div>
        <section className="panel sell-form-panel">
          <div className="form-section-heading"><span className="step-badge">01</span><div><h2>Tell us about your produce</h2><p>Use your saved crop or enter a new one.</p></div></div>
          <div className="sell-form-grid">
            <label className="field-label">CROP TYPE<select className="field-control" value={crop} onChange={(event) => setCrop(event.target.value)}>{[...new Set([...savedCrops, ...INITIAL_CROPS]), "Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
            {crop === "Other" && <label className="field-label">NEW CROP NAME<input className="field-control" value={customCrop} onChange={(event) => setCustomCrop(event.target.value)} placeholder="Enter crop name" /></label>}
            <label className="field-label">QUANTITY (QUINTALS)<input className="field-control" type="number" min="0.1" max="100000" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
            <label className="field-label">CROP CONDITION<select className="field-control" value={quality} onChange={(event) => setQuality(event.target.value)}><option>FAQ Grade</option><option>Grade A</option><option>Grade B</option><option>Organic (self-reported)</option><option>Needs inspection</option></select></label>
            <label className="field-label">SELLING AREA<input className="field-control" value={searchLocation} onChange={(event) => setSearchLocation(event.target.value)} /></label>
          </div>
          <div className="form-bottom-row"><span className="inline-info"><Icon>i</Icon> Your location is prefilled. You can edit it above or in the header.</span><button className="button button-primary" disabled={!quantityNumber || quantityNumber > 100000 || (crop === "Other" && !customCrop.trim())} onClick={() => { setSearchType("all"); document.getElementById("market-results")?.scrollIntoView({ behavior: "smooth" }); notify("Showing illustrative demo estimates."); }}>Find buyers & mandis <span>→</span></button></div>
        </section>

        <section className="recommendation-panel">
          <div className="recommendation-mark">✳</div><div className="recommendation-copy"><span className="eyebrow">AGRIBRIDGE AI ASSISTANT · DEMO</span><h2>Start with net return—not just price.</h2><p>For {quantityNumber || 0} quintals of {selectedCrop}, compare each destination's listed price against transport, handling and commission estimates. The top result below is the highest calculated demo net return, not a live AI prediction.</p><div className="reason-tags"><span>✓ Expense-aware comparison</span><span>✓ Distance included</span><span>i Sample data</span></div></div>
          <div className="recommendation-result"><small>TOP DEMO ESTIMATE</small><strong>{formatMoney(marketResults[0]?.net || 0)}</strong><span>{marketResults[0]?.name || "No result"} · net return</span></div>
        </section>

        <div className="section-title-row results-title" id="market-results"><div><span className="eyebrow">AVAILABLE OPTIONS</span><h2>Compare buyers and mandis</h2><p>{quantityNumber} quintals · {quality} · {searchLocation}</p></div><label className="compact-filter"><span>SHOW</span><select value={searchType} onChange={(event) => setSearchType(event.target.value)}><option value="all">All options</option><option value="mandi">Mandis</option><option value="buyer">Buyers</option></select></label></div>
        <div className="market-option-list">
          {searchType !== "buyer" && marketResults.map((market, index) => <article className={`market-option ${index === 0 ? "recommended-option" : ""}`} key={market.id}><div className="option-main"><div className="option-avatar">{market.type === "Mandi" ? "⌂" : "▤"}</div><div className="option-name"><div className="option-title-row"><h3>{market.name}</h3>{index === 0 && <span className="recommended-tag">TOP ESTIMATED RETURN</span>}</div><p>{market.distance} km away · {market.buyers} active buyers · {market.freshness}</p><span className="option-note">{market.note}</span></div></div><div className="option-metrics"><div><small>PRICE / QUINTAL</small><strong>{formatMoney(market.price)}</strong></div><div><small>EST. EXPENSES</small><strong>{formatMoney(market.costs)}</strong></div><div className="net-metric"><small>EST. NET RETURN</small><strong>{formatMoney(market.net)}</strong></div></div><div className="option-footer"><span className="inline-info"><Icon>i</Icon> Estimate for this shipment; verify final charges before selling.</span><button className="button button-outline" onClick={() => notify(`Details for ${market.name}: price and expenses are illustrative demo values.`)}>View details</button><button className="button button-primary" onClick={() => openNegotiation({ ...market, name: market.name, price: market.price, location: searchLocation })}>Contact / negotiate <span>→</span></button></div></article>)}
          {searchType !== "mandi" && BUYERS.map((buyer) => <article className="market-option" key={buyer.id}><div className="option-main"><div className="option-avatar buyer-avatar">▤</div><div className="option-name"><div className="option-title-row"><h3>{buyer.name} {buyer.verified && <span className="verified-mark">✓ Verified demo</span>}</h3></div><p>{buyer.location} · {buyer.distance} km away · Rating {buyer.rating}/5</p><span className="option-note">{buyer.crops} · {buyer.quantity} · Payment: {buyer.payment}</span></div></div><div className="option-metrics"><div><small>INDICATIVE OFFER</small><strong>{formatMoney(buyer.price)}</strong></div><div><small>PAYMENT</small><strong className="small-metric">{buyer.payment}</strong></div><div className="net-metric"><small>EST. NET AFTER COSTS</small><strong>{formatMoney(buyer.price * quantityNumber - buyer.distance * 22 - 450)}</strong></div></div><div className="option-footer"><span className="inline-info"><Icon>i</Icon> Indicative demo offer; terms require confirmation.</span><button className="button button-outline" onClick={() => notify(`${buyer.name}: ${buyer.crops}; ${buyer.payment}. Demo profile.`)}>View profile</button><button className="button button-primary" onClick={() => openNegotiation(buyer)}>Negotiate <span>→</span></button></div></article>)}
        </div>
      </>
    );
  }

  function renderHistory() {
    return (
      <>
        <PageHeading eyebrow={isBuyer ? "PURCHASE RECORDS" : "SELLING RECORDS"} title={isBuyer ? "Your purchase history." : "Your selling history."} description="Review completed transactions, amounts, expenses and estimated net results." />
        <div className="metric-grid history-metrics"><MetricCard label="Completed transactions" value={transactions.length} note="Demo records" icon="▤" /><MetricCard label="Total net earnings" value={formatMoney(farmerTotalEarnings)} note="Across listed transactions" icon="₹" tone="metric-green" /><MetricCard label="Average net per sale" value={formatMoney(farmerTotalEarnings / Math.max(transactions.length, 1))} note="Calculated from demo records" icon="↗" tone="metric-gold" /></div>
        <section className="panel history-panel"><div className="history-toolbar"><div><h2>All transactions</h2><p>Choose filters to find a particular sale.</p></div><div className="history-filters"><label><span>CROP</span><select value={historyCrop} onChange={(event) => setHistoryCrop(event.target.value)}><option>All crops</option>{INITIAL_CROPS.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>PERIOD</span><select value={historyPeriod} onChange={(event) => setHistoryPeriod(event.target.value)}><option>All time</option><option>Last 30 days</option></select></label></div></div>
          <div className="table-scroll"><table className="data-table"><thead><tr><th>TRANSACTION</th><th>DATE</th><th>CROP / QUANTITY</th><th>GROSS AMOUNT</th><th>EXPENSES</th><th>NET PROFIT</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredTransactions.map((item) => <tr key={item.id}><td><strong>{item.id}</strong><small>{item.buyer}</small></td><td>{item.date}</td><td><strong>{item.crop}</strong><small>{item.quantity} quintals · {item.quality}</small></td><td>{formatMoney(item.gross)}</td><td>{formatMoney(item.expenses)}</td><td className="profit-cell">{formatMoney(item.net)}</td><td><span className="status-pill success">{item.status}</span></td><td><button className="table-action" onClick={() => setSelectedTransaction(item)}>Details ↗</button></td></tr>)}</tbody></table></div>
          {filteredTransactions.length === 0 && <div className="empty-state"><span>⌕</span><h3>No transactions found</h3><p>Try changing the crop or date filter.</p></div>}
        </section>
        {selectedTransaction && <div className="modal-backdrop" onClick={() => setSelectedTransaction(null)}><section className="modal-card transaction-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedTransaction(null)}>×</button><span className="eyebrow">TRANSACTION DETAILS</span><h2>{selectedTransaction.id}</h2><p className="modal-intro">{selectedTransaction.date} · {selectedTransaction.status}</p><div className="detail-grid">{[["Crop", selectedTransaction.crop], ["Quantity", `${selectedTransaction.quantity} quintals`], ["Quality", selectedTransaction.quality], ["Buyer", selectedTransaction.buyer], ["Price / quintal", formatMoney(selectedTransaction.price)], ["Gross amount", formatMoney(selectedTransaction.gross)], ["Total expenses", formatMoney(selectedTransaction.expenses)], ["Net profit", formatMoney(selectedTransaction.net)]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><p className="demo-disclaimer">Sample transaction for prototype demonstration.</p></section></div>}
      </>
    );
  }

  function renderNews() {
    const filteredNews = NEWS.filter((item) => newsFilter === "All news" || item.category === newsFilter || (newsFilter === "My crops" && (item.crop === effectiveCrop || item.crop === "All crops")));
    return (
      <>
        <PageHeading eyebrow="AGRICULTURAL UPDATES" title={isBuyer ? "Market news that matters." : "News for your crops and region."} description={`Updates relevant to ${location}. Demo headlines are shown for layout testing.`} action={<button className="button button-outline" onClick={() => notify("News refresh is a demo action; connect a verified news source to enable live updates.")}>↻ Refresh</button>} />
        <div className="news-filter-row">{["All news", "Market update", "Weather", "Policy", "My crops"].map((item) => <button key={item} className={`filter-chip ${newsFilter === item ? "active" : ""}`} onClick={() => setNewsFilter(item)}>{item}</button>)}</div>
        <div className="news-layout"><div className="news-list">{filteredNews.map((item, index) => <article className="news-card" key={item.title}><div className={`news-art news-art-${index % 3}`}><span>{item.category === "Weather" ? "☼" : item.category === "Policy" ? "▤" : "♧"}</span><small>{item.category.toUpperCase()}</small></div><div className="news-content"><div className="news-meta"><span>{item.source}</span><span>{item.time}</span></div><h2>{item.title}</h2><p>{item.summary}</p><div className="news-card-footer"><span className="news-crop-tag">{item.crop}</span><button className="text-action" onClick={() => notify("Full article view will be connected to a verified news source.")}>Read update <span>→</span></button></div></div></article>)}{filteredNews.length === 0 && <div className="empty-state"><span>◉</span><h3>No news in this category</h3><p>Choose another filter to see more updates.</p></div>}</div><aside className="panel news-aside"><span className="eyebrow">YOUR NEWS FEED</span><h2>Make updates relevant to you.</h2><p>Choose your crops and location to tailor the news feed as the platform grows.</p><button className="button button-outline full-width" onClick={() => navigate("crops")}>Manage my crops</button><div className="news-aside-rule" /><strong>Source transparency</strong><p className="small-muted">These are sample headlines. Live news requires integration with reliable agricultural and weather sources.</p></aside></div>
      </>
    );
  }

  function renderCrops() {
    const [unused] = [null];
    return (
      <>
        <PageHeading eyebrow="YOUR PRODUCE" title="My crops." description="Keep your usual crops handy to make future selling searches faster." />
        <section className="panel crops-panel"><div className="panel-heading"><div><h2>Saved crop list</h2><p>Select crops you regularly grow or trade.</p></div><span className="count-badge">{savedCrops.length} saved</span></div><div className="saved-crop-grid">{INITIAL_CROPS.map((item, index) => { const saved = savedCrops.includes(item); return <button key={item} className={`saved-crop-card ${saved ? "is-saved" : ""}`} onClick={() => setSavedCrops((previous) => saved ? previous.filter((cropName) => cropName !== item) : [...previous, item])}><span className={`crop-symbol crop-symbol-${index}`}>{["♧", "⌁", "✿", "❋", "♨"][index]}</span><strong>{item}</strong><small>{saved ? "Saved to your list" : "Tap to add crop"}</small><span className="crop-save-state">{saved ? "✓ Saved" : "+ Add crop"}</span></button>; })}</div><div className="crop-panel-footer"><p>Your saved crops are stored in this demo session only.</p><button className="button button-primary" onClick={() => navigate(isBuyer ? "buy" : "sell")}>{isBuyer ? "Find produce" : "Sell a crop"} <span>→</span></button></div></section>
      </>
    );
  }

  function renderBuyerPage() {
    return (
      <>
        <PageHeading eyebrow="PROCUREMENT MARKETPLACE" title="Find produce to buy." description="Browse illustrative supplier listings and start a conversation about price, quality and delivery." />
        <section className="panel buyer-search-panel"><label className="search-box"><Icon>⌕</Icon><input value={buyerSearch} onChange={(event) => setBuyerSearch(event.target.value)} placeholder="Search crop, buyer or location…" /></label><label className="compact-filter"><span>LOCATION</span><select value={searchLocation} onChange={(event) => setSearchLocation(event.target.value)}><option>Mathura, Uttar Pradesh</option><option>Agra, Uttar Pradesh</option><option>Hathras, Uttar Pradesh</option></select></label></section>
        <div className="buyer-listings">{buyerResults.map((buyer) => <article className="buyer-listing panel" key={buyer.id}><div className="buyer-listing-top"><div className="buyer-avatar-large">{buyer.name.charAt(0)}</div><div className="buyer-listing-title"><h2>{buyer.crops.split(",")[0]} available from {buyer.name}</h2><p>{buyer.location} · {buyer.distance} km away</p></div><span className="verified-mark">✓ Verified demo</span></div><div className="buyer-listing-metrics"><div><small>INDICATIVE PRICE</small><strong>{formatMoney(buyer.price)}<small> / quintal</small></strong></div><div><small>AVAILABLE QUANTITY</small><strong>{buyer.quantity}</strong></div><div><small>QUALITY</small><strong>FAQ / Grade A</strong></div><div><small>PAYMENT TERMS</small><strong>{buyer.payment}</strong></div></div><div className="buyer-listing-bottom"><span className="inline-info"><Icon>i</Icon> Supplier and price details are sample data.</span><button className="button button-outline" onClick={() => notify(`Demo supplier ${buyer.name} profile opened.`)}>View details</button><button className="button button-primary" onClick={() => openNegotiation(buyer)}>Contact supplier <span>→</span></button></div></article>)}{buyerResults.length === 0 && <div className="empty-state"><span>⌕</span><h3>No matching listings</h3><p>Try a different crop or location.</p></div>}</div>
      </>
    );
  }

  function renderOffers() {
    return (
      <>
        <PageHeading eyebrow="OFFER MANAGEMENT" title="Offers and negotiations." description="Review incoming proposals, respond with your terms and keep a record of each decision." />
        <div className="offer-list">{[{ id: "o1", name: "Ramesh Kumar", crop: "Wheat · 20 quintals", price: 2600, location: "Mathura, UP", state: "Needs response" }, { id: "o2", name: "Sita Devi", crop: "Rice · 15 quintals", price: 3150, location: "Hathras, UP", state: "Counter-offer received" }, { id: "o3", name: "Mohan Singh", crop: "Potato · 30 quintals", price: 1420, location: "Agra, UP", state: "Needs response" }].map((offer) => <article className="panel offer-card" key={offer.id}><div className="offer-card-head"><div className="buyer-avatar-large">{offer.name.charAt(0)}</div><div><h2>{offer.name}</h2><p>{offer.crop} · {offer.location}</p></div><span className={`status-pill ${offerStatus[offer.id] === "Accepted" ? "success" : "pending"}`}>{offerStatus[offer.id] || offer.state}</span></div><div className="offer-price-row"><div><small>OFFERED PRICE</small><strong>{formatMoney(offer.price)} <small>/ quintal</small></strong></div><div><small>INDICATIVE TOTAL</small><strong>{formatMoney(offer.price * (offer.id === "o1" ? 20 : offer.id === "o2" ? 15 : 30))}</strong></div></div><div className="offer-actions"><button className="button button-outline" onClick={() => openNegotiation({ ...offer, id: offer.id, price: offer.price, name: offer.name })}>Counter / chat</button><button className="button button-primary" disabled={offerStatus[offer.id] === "Accepted"} onClick={() => acceptOffer({ ...offer, id: offer.id })}>{offerStatus[offer.id] === "Accepted" ? "Accepted" : "Accept offer"} <span>✓</span></button><button className="button button-danger-quiet" onClick={() => { setOfferStatus((previous) => ({ ...previous, [offer.id]: "Rejected" })); notify("Offer rejected in this demo."); }}>Reject</button></div></article>)}</div>
      </>
    );
  }

  function renderDeals() {
    return (
      <>
        <PageHeading eyebrow="DEAL TRACKER" title="Keep every deal on track." description="A single view of offers, negotiations, confirmed terms and completed transactions." />
        <div className="deal-status-grid">{[{ label: "Awaiting response", value: "2", tone: "gold" }, { label: "In negotiation", value: "1", tone: "blue" }, { label: "Confirmed", value: "1", tone: "green" }, { label: "Completed", value: transactions.length, tone: "purple" }].map((item) => <div className="panel deal-status-card" key={item.label}><span className={`deal-status-icon ${item.tone}`}>⇄</span><small>{item.label}</small><strong>{item.value}</strong></div>)}</div>
        <section className="panel deal-table-panel"><div className="panel-heading"><div><h2>Recent deals</h2><p>Sample deal records for the prototype.</p></div></div><div className="deal-row deal-row-head"><span>DEAL</span><span>OTHER PARTY</span><span>AMOUNT</span><span>STATUS</span><span>ACTION</span></div>{[{ id: "DL-2201", crop: "Wheat · 20 quintals", other: "Shree Krishna Foods", amount: "₹53,000", status: "In negotiation" }, { id: "DL-2198", crop: "Rice · 12 quintals", other: "Brij Agro Traders", amount: "₹38,160", status: "Confirmed" }, { id: "DL-2180", crop: "Potato · 25 quintals", other: "Mathura Fresh Produce", amount: "₹33,750", status: "Completed" }].map((deal) => <div className="deal-row" key={deal.id}><div><strong>{deal.id}</strong><small>{deal.crop}</small></div><span>{deal.other}</span><strong>{deal.amount}</strong><span className={`status-pill ${deal.status === "Completed" ? "success" : "pending"}`}>{deal.status}</span><button className="table-action" onClick={() => deal.status === "Completed" ? navigate("history") : openNegotiation({ name: deal.other, price: 2650, id: deal.id })}>{deal.status === "Completed" ? "View record" : "Open deal"} ↗</button></div>)}</section>
      </>
    );
  }

  function renderProfile() {
    return (
      <>
        <PageHeading eyebrow="ACCOUNT SETTINGS" title="Your profile." description="Review your demo profile and shared application preferences." />
        <section className="panel profile-panel"><div className="profile-panel-heading"><div className="profile-avatar profile-avatar-large">{userName.trim().charAt(0).toUpperCase()}</div><div><h2>{userName}</h2><p>{isBuyer ? "Buyer account" : "Farmer account"} · Demo prototype</p></div><span className="status-pill success">Active demo</span></div><div className="profile-fields"><label className="field-label">DISPLAY NAME<input className="field-control" value={userName} onChange={(event) => setUserName(event.target.value)} /></label><label className="field-label">LOCATION<input className="field-control" value={location} onChange={(event) => setLocation(event.target.value)} /></label><label className="field-label">PREFERRED LANGUAGE<select className="field-control" value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>Hindi</option></select></label><label className="field-label">ACCOUNT ROLE<input className="field-control" value={isBuyer ? "Buyer" : "Farmer"} readOnly /></label></div><div className="profile-actions"><button className="button button-primary" onClick={() => notify("Profile updated for this demo session.")}>Save preferences</button><button className="button button-outline" onClick={logout}>Log out</button></div><p className="demo-disclaimer">This prototype does not save account information to a database.</p></section>
      </>
    );
  }

  function renderHelp() {
    return (
      <>
        <PageHeading eyebrow="SUPPORT" title="How can we help?" description="Simple guidance for using the AgriBridge prototype." />
        <div className="help-grid">{[{ title: "Compare selling options", text: "Enter crop, quantity, condition and location. Review each market's estimated price and costs before deciding." }, { title: "Negotiate an offer", text: "Open a buyer conversation, send a message or counter-offer, and wait for the other party to respond." }, { title: "Understand net return", text: "Net return is an estimate after the listed expenses. Confirm actual charges, quality terms and delivery arrangements before accepting a deal." }, { title: "Language and voice", text: "Use the language selector in the header. Voice commands depend on browser speech-recognition support." }].map((item) => <article className="panel help-card" key={item.title}><span className="help-card-icon">✳</span><h2>{item.title}</h2><p>{item.text}</p></article>)}</div>
      </>
    );
  }

  function renderNegotiationModal() {
    if (!negotiationBuyer) return null;
    return (
      <div className="modal-backdrop" onClick={() => setNegotiationBuyer(null)}>
        <section className="modal-card negotiation-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="negotiation-title">
          <header className="negotiation-header"><div className="buyer-avatar-large">{(negotiationBuyer.name || "B").charAt(0)}</div><div><h2 id="negotiation-title">{negotiationBuyer.name}</h2><p>Price negotiation · Demo conversation</p></div><button className="modal-close" onClick={() => setNegotiationBuyer(null)} aria-label="Close negotiation">×</button></header>
          <div className="conversation-context"><span>PRODUCE</span><strong>{effectiveCrop} · {quantityNumber} quintals · {quality}</strong><span>LOCATION</span><strong>{searchLocation}</strong></div>
          <div className="chat-messages">{chatMessages.map((message, index) => <div key={`${message.from}-${index}`} className={`chat-line ${message.from}`}><span className="chat-sender">{message.from === "farmer" ? "You" : message.from === "buyer" ? negotiationBuyer.name : "AgriBridge"}</span><p>{message.text}</p></div>)}</div>
          <div className="counter-offer-box"><label className="field-label">YOUR COUNTER-OFFER (₹ / QUINTAL)<div className="counter-input-row"><input className="field-control" type="number" min="1" value={counterPrice} onChange={(event) => setCounterPrice(event.target.value)} /><button className="button button-primary" onClick={submitCounterOffer}>Send counter <span>→</span></button></div></label></div>
          <form className="chat-compose" onSubmit={(event) => { event.preventDefault(); sendChatMessage(); }}><input className="field-control" value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="Ask a question or discuss terms…" /><button className="button button-outline" type="submit">Send</button></form>
          <div className="negotiation-footer"><button className="button button-danger-quiet" onClick={() => { setNegotiationBuyer(null); notify("Negotiation rejected/closed in this demo."); }}>Reject / close</button><button className="button button-outline" onClick={() => { setNegotiationBuyer(null); notify("Offer saved for later review in this demo."); }}>Decide later</button><button className="button button-primary" onClick={() => { setNegotiationBuyer(null); notify("Your intent to accept was recorded in the demo. Final deal confirmation requires both parties."); }}>Accept offer <span>✓</span></button></div>
          <p className="demo-disclaimer">Prototype only: messages and offers are not sent to a real buyer or stored on the backend.</p>
        </section>
      </div>
    );
  }

  if (page === "landing") return <>{renderLanding()}{toast && <div className="toast">{toast}</div>}</>;
  if (page === "about") return <>{renderAbout()}{toast && <div className="toast">{toast}</div>}</>;
  if (page === "login" || page === "register") return <>{renderAuth()}{toast && <div className="toast">{toast}</div>}</>;

  return (
    <div className="app-shell">
      {renderHeader()}
      <div className="app-body">{renderSidebar()}<main className="workspace">
        {page === "dashboard" && renderDashboard()}
        {page === "sell" && !isBuyer && renderSellPage()}
        {page === "buy" && isBuyer && renderBuyerPage()}
        {page === "history" && renderHistory()}
        {page === "news" && renderNews()}
        {page === "crops" && !isBuyer && renderCrops()}
        {page === "offers" && isBuyer && renderOffers()}
        {page === "deals" && !isBuyer && renderDeals()}
        {page === "profile" && renderProfile()}
        {page === "settings" && renderProfile()}
        {page === "earnings" && <><PageHeading eyebrow="YOUR MONEY, CLEARLY TRACKED" title="Total earnings." description="A simple view of completed sales and what remained after recorded expenses." /><div className="metric-grid"><MetricCard label="Total net earnings" value={formatMoney(farmerTotalEarnings)} note="Across demo transactions" icon="₹" tone="metric-green"/><MetricCard label="Gross sales" value={formatMoney(transactions.reduce((sum,item)=>sum+item.gross,0))} note="Before recorded expenses" icon="↗"/><MetricCard label="Recorded expenses" value={formatMoney(transactions.reduce((sum,item)=>sum+item.expenses,0))} note="Transport and other costs" icon="▤" tone="metric-gold"/></div><section className="panel history-panel"><div className="panel-heading"><div><h2>Earnings by transaction</h2><p>Open a transaction to see its full breakdown.</p></div><button className="button button-outline" onClick={() => navigate("history")}>View history →</button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>DATE</th><th>CROP</th><th>GROSS</th><th>EXPENSES</th><th>NET EARNINGS</th></tr></thead><tbody>{transactions.map(item=><tr key={item.id}><td>{item.date}</td><td>{item.crop}</td><td>{formatMoney(item.gross)}</td><td>{formatMoney(item.expenses)}</td><td className="profit-cell">{formatMoney(item.net)}</td></tr>)}</tbody></table></div></section></>}
        {page === "help" && renderHelp()}
        {((page === "sell" && isBuyer) || (page === "buy" && !isBuyer) || (page === "offers" && !isBuyer) || (page === "crops" && isBuyer) || (page === "deals" && isBuyer)) && <div className="panel access-note"><h2>This section belongs to the other workspace.</h2><p>Switch to the relevant demo role to explore this feature.</p><button className="button button-primary" onClick={() => signIn(isBuyer ? "farmer" : "buyer")}>Switch demo role <span>→</span></button></div>}
      </main></div>
      {renderNegotiationModal()}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function PublicFooter() {
  return <footer className="public-footer"><button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><span className="brand-mark">a.</span><span>AgriBridge<span className="brand-dot">.</span></span></button><p>Connecting farmers to better market opportunities.</p><span>BUILT FOR BETTER DECISIONS</span></footer>;
}

export default App;

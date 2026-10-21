"use client";

import { useEffect, useMemo, useState } from "react";
import {
  featuredIds,
  heroPhotos,
  categories,
  combos,
  dishes,
  restaurant,
  type Combo,
  type Dish,
} from "./menu-data";

type Lang = "en" | "hi";
// Anything that can go into the cart: a dish or a combo, in one shape.
type Item = Pick<Dish, "id" | "name" | "description" | "price" | "veg" | "photo" | "spice">;
type CartLine = {
  key: string;
  itemId: string;
  name: string;
  price: number;
  photo: string;
  qty: number;
  spicePref?: string;
  note?: string;
};
// Real order data from the POS/kitchen. Stays null until an order is actually placed.
type ActiveOrder = { number: string; status: string; lines: CartLine[] };
type ServiceKind = "waiter" | "water" | "bill";

const copy = {
  en: {
    search: "Search dishes, drinks, combos…",
    myOrder: "My order",
    upNext: "Up next",
    explore: "Explore full menu",
    addToOrder: "Add to order",
    popular: "Bestsellers",
    popularEyebrow: "Guest favourites",
    seeDetails: "See details",
    popularSub: "Our most-ordered dishes, along with a few more you’ll love.",
    prevDish: "Previous dish",
    nextDish: "Next dish",
    drinks: "Drinks & beverages",
    drinksSub: "Fresh coolers, coffee and chai to go with your meal.",
    drinksEyebrow: "Refreshments",
    viewAllDrinks: "View all drinks",
    desserts: "Desserts",
    dessertsSub: "Sweet endings",
    viewAll: "View all",
    menu: "Full menu",
    menuSub: "Pick a category to see its dishes",
    vegOnly: "Veg only",
    add: "Add",
    waiter: "Call waiter",
    water: "Water",
    bill: "Get bill",
    requested: "Requested",
    empty: "Your cart is empty",
    view: "View order",
    items: "items",
    item: "item",
    allergy: "Food allergy or dietary need? Add a note to any dish, or call a waiter — we’re happy to help.",
  },
  hi: {
    search: "डिश, ड्रिंक, कॉम्बो खोजें…",
    myOrder: "मेरा ऑर्डर",
    upNext: "अगला",
    explore: "पूरा मेन्यू देखें",
    addToOrder: "ऑर्डर में जोड़ें",
    popular: "बेस्टसेलर",
    popularEyebrow: "मेहमानों की पसंद",
    seeDetails: "डिटेल देखें",
    popularSub: "सबसे ज़्यादा ऑर्डर होने वाली डिश, और कुछ और जो आपको पसंद आएंगी।",
    prevDish: "पिछली डिश",
    nextDish: "अगली डिश",
    drinks: "ड्रिंक्स",
    drinksSub: "खाने के साथ ताज़ा कूलर, कॉफ़ी और चाय।",
    drinksEyebrow: "ताज़गी",
    viewAllDrinks: "सभी ड्रिंक्स देखें",
    desserts: "मिठाई",
    dessertsSub: "मीठा अंत",
    viewAll: "सब देखें",
    menu: "पूरा मेन्यू",
    menuSub: "डिश देखने के लिए कैटेगरी चुनें",
    vegOnly: "सिर्फ़ वेज",
    add: "जोड़ें",
    waiter: "वेटर बुलाएं",
    water: "पानी",
    bill: "बिल",
    requested: "भेज दिया",
    empty: "कार्ट खाली है",
    view: "ऑर्डर देखें",
    items: "आइटम",
    item: "आइटम",
    allergy: "किसी चीज़ से एलर्जी है? डिश में नोट जोड़ें या वेटर को बुलाएं।",
  },
} satisfies Record<Lang, Record<string, string>>;

// Banner slides: welcome-style messages only (no prices or offers). One per photo in `heroPhotos`.
const slideCopy: Record<Lang, { eyebrow: string; title: string; accent: string; text: string }[]> = {
  en: [
    {
      eyebrow: `Welcome to ${restaurant.name}`,
      title: "Authentic Indian flavours.",
      accent: "Order right from your table.",
      text: "Browse the full menu, choose your dishes and send your order straight to the kitchen.",
    },
    {
      eyebrow: "Easy ordering",
      title: "Your table, your pace.",
      accent: "Order now, add more anytime.",
      text: "Start with a few dishes and keep adding through your meal. Everything comes to your table.",
    },
    {
      eyebrow: "We’re here to help",
      title: "Service is one tap away.",
      accent: "Call a waiter, ask for water or get the bill.",
      text: "Use the buttons at the bottom of the screen whenever you need us.",
    },
  ],
  hi: [
    {
      eyebrow: `${restaurant.name} में आपका स्वागत है`,
      title: "असली भारतीय स्वाद।",
      accent: "सीधे अपनी टेबल से ऑर्डर करें।",
      text: "पूरा मेन्यू देखें, डिश चुनें और ऑर्डर सीधे किचन तक भेजें।",
    },
    {
      eyebrow: "आसान ऑर्डर",
      title: "आपकी टेबल, आपकी रफ़्तार।",
      accent: "अभी ऑर्डर करें, बाद में और जोड़ें।",
      text: "कुछ डिश से शुरू करें और खाने के दौरान और जोड़ते रहें। सब कुछ आपकी टेबल पर आएगा।",
    },
    {
      eyebrow: "हम मदद के लिए हैं",
      title: "सर्विस बस एक टैप दूर।",
      accent: "वेटर बुलाएं, पानी मंगाएं या बिल लें।",
      text: "जब भी ज़रूरत हो, स्क्रीन के नीचे दिए बटन इस्तेमाल करें।",
    },
  ],
};

const SPICE_PREFS = ["Mild", "Medium", "Spicy"];
const QUICK_NOTES = ["No onion", "No garlic", "Less oil", "Jain"];
// How long a service button shows "Requested" in this demo. Real status comes from the staff app.
const SERVICE_COOLDOWN_MS = 30_000;
const SLIDE_MS = 7000;

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const comboToItem = (c: Combo): Item => ({ ...c, description: c.includes, veg: true });

const iconPaths = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.3-4.3",
  bag: "M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h3",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5 10 17l9-10",
  up: "M12 19V5m-6 6 6-6 6 6",
  chat: "M5 5h14v10H9l-4 4V5Z",
  left: "m15 6-6 6 6 6",
  right: "m9 6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
} as const;

function Icon({ name, size = 18 }: { name: keyof typeof iconPaths; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={iconPaths[name]} />
    </svg>
  );
}

function Photo({ src, alt, className, eager }: { src: string; alt: string; className: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`${className} photo-frame`}>
      {failed ? (
        <span className="photo-fallback">{alt}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} />
      )}
    </div>
  );
}

function VegMark({ veg }: { veg: boolean }) {
  return (
    <span className={`veg-mark ${veg ? "is-veg" : "is-nonveg"}`} aria-label={veg ? "Vegetarian" : "Non-vegetarian"} />
  );
}

const SPICE_LABELS = ["", "Mild", "Medium spicy", "Hot"];

function SpiceMeter({ level }: { level?: number }) {
  if (!level) return null;
  return (
    <span className={`spice spice-${level}`} aria-label={`Spice level: ${SPICE_LABELS[level]}`}>
      <span className="spice-flames" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <svg key={n} className={n <= level ? "is-on" : ""} width="10" height="12" viewBox="0 0 10 12">
            <path d="M5 0C5.5 3 9 4.5 9 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 1.5.8 2.3 1.5 2.3C4.5 4 4 2 5 0Z" fill="currentColor" />
          </svg>
        ))}
      </span>
      {SPICE_LABELS[level]}
    </span>
  );
}

function SectionHead({
  id,
  title,
  sub,
  children,
}: {
  id: string;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <h2 id={id}>{title}</h2>
      {sub && <p className="muted">{sub}</p>}
      {children}
    </div>
  );
}

function AddControl({
  qty,
  label,
  name,
  onAdd,
  onRemove,
  size = "md",
}: {
  qty: number;
  label: string;
  name?: string;
  onAdd: () => void;
  onRemove: () => void;
  size?: "md" | "sm" | "round";
}) {
  if (qty === 0) {
    if (size === "round") {
      return (
        <button className="add-round" type="button" onClick={onAdd} aria-label={`${label} ${name ?? ""}`.trim()}>
          <Icon name="plus" size={18} />
        </button>
      );
    }
    return (
      <button className={`add-btn add-btn-${size}`} type="button" onClick={onAdd}>
        {label} <span aria-hidden="true">+</span>
      </button>
    );
  }
  return (
    <div className={`stepper add-btn-${size === "round" ? "sm" : size}`}>
      <button type="button" onClick={onRemove} aria-label="Remove one">−</button>
      <span aria-live="polite">{qty}</span>
      <button type="button" onClick={onAdd} aria-label="Add one">+</button>
    </div>
  );
}

type CardProps = {
  item: Item;
  qty: number;
  label: string;
  onAdd: () => void;
  onRemove: () => void;
  onOpen: () => void;
};

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("starters");
  const [vegOnly, setVegOnly] = useState(false);
  const [drawer, setDrawer] = useState<"closed" | "cart" | "placed">("closed");
  const [orderNote, setOrderNote] = useState("");
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [requests, setRequests] = useState<Partial<Record<ServiceKind, number>>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [bump, setBump] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const t = copy[lang];

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close sheets with Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelected(null);
      setDrawer("closed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const slides = heroPhotos.flatMap((p, i) => {
    const c = slideCopy[lang][i];
    return c ? [{ key: `slide-${i}`, ...c, ...p }] : [];
  });

  // Auto-advance the banner unless the guest is interacting with it or prefers less motion.
  // Restarts on every slide change, so manual navigation always gets a full SLIDE_MS.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setSlide((s) => (s + 1) % slides.length), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [slide, paused, slides.length]);

  const goTo = (i: number) => setSlide((i + slides.length) % slides.length);
  const [swipeX, setSwipeX] = useState<number | null>(null);

  const qtyOf = (id: string) => cart.reduce((s, l) => s + (l.itemId === id ? l.qty : 0), 0);
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.qty * l.price, 0);
  const orderedTotal = activeOrder?.lines.reduce((s, l) => s + l.qty * l.price, 0) ?? 0;
  const orderedCount = activeOrder?.lines.reduce((s, l) => s + l.qty, 0) ?? 0;
  const plural = (n: number) => `${n} ${n === 1 ? t.item : t.items}`;

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const addLine = (item: Item, qty = 1, spicePref?: string, note?: string) => {
    const key = [item.id, spicePref ?? "", note ?? ""].join("|");
    setCart((c) =>
      c.some((l) => l.key === key)
        ? c.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
        : [...c, { key, itemId: item.id, name: item.name, price: item.price, photo: item.photo, qty, spicePref, note }],
    );
    setBump((b) => b + 1);
  };
  const changeLine = (key: string, delta: number) =>
    setCart((c) => c.flatMap((l) => (l.key !== key ? [l] : l.qty + delta > 0 ? [{ ...l, qty: l.qty + delta }] : [])));
  // The card stepper removes from the most recently added line of that dish.
  const removeOne = (itemId: string) => {
    const last = [...cart].reverse().find((l) => l.itemId === itemId);
    if (last) changeLine(last.key, -1);
  };

  const placeOrder = () => {
    // Replace with the real POS call; number and status must come from the kitchen system.
    const lines = orderNote.trim() ? cart.map((l, i) => (i === 0 ? { ...l, note: [l.note, `Order note: ${orderNote.trim()}`].filter(Boolean).join(" · ") } : l)) : cart;
    setActiveOrder((prev) => ({
      number: prev?.number ?? String(Math.floor(100 + Math.random() * 900)),
      status: "Sent to kitchen",
      lines: [...(prev?.lines ?? []), ...lines],
    }));
    setCart([]);
    setOrderNote("");
    setDrawer("placed");
  };

  const requestService = (kind: ServiceKind, msg: string) => {
    setRequests((r) => ({ ...r, [kind]: Date.now() }));
    notify(msg);
    window.setTimeout(() => setRequests((r) => ({ ...r, [kind]: undefined })), SERVICE_COOLDOWN_MS);
  };

  const popular = useMemo(
    () =>
      dishes
        .filter((d) => d.orderRank !== undefined)
        .sort((a, b) => a.orderRank! - b.orderRank!),
    [],
  );
  // Slider items: ranked bestsellers first (labelled by rank), then featured dishes (labelled by category).
  const bestItems = useMemo(() => {
    const ranked = popular.map((d) => ({ dish: d, tag: d.orderRank === 1 ? "#1 Best seller" : `#${d.orderRank} Most ordered` }));
    const more = featuredIds
      .map((id) => dishes.find((d) => d.id === id))
      .filter((d): d is Dish => !!d && d.orderRank === undefined)
      .map((d) => ({ dish: d, tag: categories.find((c) => c.id === d.category)?.label ?? "" }));
    return [...ranked, ...more];
  }, [popular]);
  const inCategory = (id: string) => dishes.filter((d) => d.category === id);
  const results = query.trim()
    ? dishes.filter((d) => `${d.name} ${d.description}`.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const countFor = (categoryId: string) =>
    categoryId === "combos"
      ? combos.length
      : dishes.filter((d) => d.category === categoryId && (!vegOnly || d.veg)).length;
  const categoryItems: Item[] =
    activeCategory === "combos"
      ? combos.map(comboToItem)
      : dishes.filter((d) => d.category === activeCategory && (!vegOnly || d.veg));
  const activeLabel = categories.find((c) => c.id === activeCategory)?.label ?? "";

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const openCategory = (id: string) => {
    setActiveCategory(id);
    window.setTimeout(() => scrollTo("menu"), 30);
  };

  const cardProps = (item: Item): CardProps => ({
    item,
    qty: qtyOf(item.id),
    label: t.add,
    onAdd: () => addLine(item),
    onRemove: () => removeOne(item.id),
    onOpen: () => setSelected(item),
  });

  const promoProps = (c: Combo) => ({
    combo: c,
    qty: qtyOf(c.id),
    label: t.addToOrder,
    onAdd: () => addLine(comboToItem(c)),
    onRemove: () => removeOne(c.id),
    onOpen: () => setSelected(comboToItem(c)),
  });

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#" aria-label={`${restaurant.name} home`}>
          <span className="brand-mark" aria-hidden="true">s.</span>
          <span className="brand-copy">
            <strong>{restaurant.name}</strong>
            <span><span className="table-dot" />Table {restaurant.table}</span>
          </span>
        </a>

        <label className="search">
          <Icon name="search" />
          <input
            type="search"
            placeholder={t.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the menu"
          />
          {query && (
            <button className="search-clear" type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <Icon name="close" size={16} />
            </button>
          )}
        </label>

        <button className="pill" type="button" onClick={() => setLang(lang === "en" ? "hi" : "en")}>
          {lang === "en" ? "EN / हि" : "हि / EN"}
        </button>
        <button className="pill pill-dark" type="button" onClick={() => setDrawer("cart")}>
          <Icon name="bag" />
          {t.myOrder}
          {itemCount > 0 && <span className="badge" key={bump}>{itemCount}</span>}
        </button>
      </header>

      <main className="content">
        {activeOrder && (
          <button className="order-status" type="button" onClick={() => setDrawer("cart")}>
            <span className="status-dot" />
            <strong>Order #{activeOrder.number}</strong>
            <span>{activeOrder.status}</span>
            <span className="muted">· {plural(orderedCount)} · {rupees(orderedTotal)}</span>
            <span className="status-link">Details <Icon name="arrow" size={16} /></span>
          </button>
        )}

        {query.trim() ? (
          <section className="section section-first" aria-labelledby="results-title">
            <div className="section-head">
              <h2 id="results-title">Results for “{query.trim()}”</h2>
              <p className="muted">{plural(results.length)}</p>
              <button className="link" type="button" onClick={() => setQuery("")}>Clear</button>
            </div>
            {results.length === 0 ? (
              <div className="empty-state">
                <p>No dishes found for “{query.trim()}”.</p>
                <div className="chip-row">
                  {categories.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      className="chip"
                      type="button"
                      onClick={() => {
                        setQuery("");
                        openCategory(c.id);
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="list-grid">
                {results.map((d) => <DishRow key={d.id} {...cardProps(d)} />)}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* 1. Banner carousel: welcome first, then real combos */}
            <section
              className={`hero${paused ? " is-paused" : ""}`}
              aria-roledescription="carousel"
              aria-label="Featured"
              style={{ "--slide-ms": `${SLIDE_MS}ms` } as React.CSSProperties}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              onPointerDown={(e) => { if (e.pointerType !== "mouse") setSwipeX(e.clientX); }}
              onPointerUp={(e) => {
                if (swipeX === null) return;
                const dx = e.clientX - swipeX;
                if (Math.abs(dx) > 50) goTo(slide + (dx < 0 ? 1 : -1));
                setSwipeX(null);
              }}
              onPointerCancel={() => setSwipeX(null)}
            >
              {slides.map((s, i) => {
                const Title = i === 0 ? "h1" : "h2";
                const active = i === slide;
                return (
                  <div
                    key={s.key}
                    className={`hero-slide${active ? " is-active" : ""}`}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${slides.length}`}
                    aria-hidden={!active}
                    inert={!active}
                  >
                    <Photo className="hero-photo" src={s.photo} alt={s.alt} eager={i === 0} />
                    <div className="hero-copy">
                      <span className="eyebrow">{s.eyebrow}</span>
                      <Title className="hero-title">
                        {s.title}
                        <span>{s.accent}</span>
                      </Title>
                      <p>{s.text}</p>
                      <button className="cta hero-cta" type="button" onClick={() => scrollTo("menu")}>
                        {t.explore} <Icon name="arrow" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {slides.length > 1 && (
                <>
                  {/* Back arrow + a preview card of the next slide. */}
                  <div className="hero-controls">
                    <button className="hero-prev" type="button" onClick={() => goTo(slide - 1)} aria-label="Previous slide">
                      <Icon name="left" size={22} />
                    </button>
                    {(() => {
                      const next = slides[(slide + 1) % slides.length];
                      return (
                        <button className="hero-next" type="button" onClick={() => goTo(slide + 1)} aria-label={`Next slide: ${next.title}`}>
                          <Photo key={next.key} className="hero-next-photo" src={next.photo} alt="" />
                          <span className="hero-next-copy">
                            <small>{t.upNext}</small>
                            <strong>{next.title}</strong>
                          </span>
                          <span className="hero-next-icon"><Icon name="right" size={20} /></span>
                        </button>
                      );
                    })()}
                  </div>
                  <div className="hero-dots">
                    <span className="hero-count" aria-hidden="true">
                      {String(slide + 1).padStart(2, "0")}<small> / {String(slides.length).padStart(2, "0")}</small>
                    </span>
                    {slides.map((s, i) => (
                      <button
                        key={s.key}
                        type="button"
                        className={i === slide ? "is-on" : ""}
                        onClick={() => goTo(i)}
                        aria-label={`Show slide ${i + 1}`}
                        aria-current={i === slide}
                      >
                        {/* Fills over the slide's display time; restarts when the slide or pause state changes. */}
                        {i === slide && <span key={`${slide}-${paused}`} className="hero-progress" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* 2. Bestsellers slider: round plates on a plain band, the centre one highlighted */}
            {bestItems.length > 0 && (
              <section className="section best-band" id="popular" aria-labelledby="popular-title">
                <div className="best-inner">
                  <div className="best-head">
                    <span className="eyebrow">{t.popularEyebrow}</span>
                    <h2 id="popular-title">{t.popular}</h2>
                    <p>{t.popularSub}</p>
                  </div>
                  <PlateCarousel
                    items={bestItems}
                    cardFor={cardProps}
                    after={
                      <button className="link" type="button" onClick={() => scrollTo("menu")}>
                        {t.viewAll} <Icon name="arrow" size={16} />
                      </button>
                    }
                    detailsLabel={t.seeDetails}
                    prevLabel={t.prevDish}
                    nextLabel={t.nextDish}
                  />
                </div>
              </section>
            )}

            {/* 3. Drinks & beverages */}
            {inCategory("drinks").length > 0 && (
              <section className="section drinks-section" id="drinks" aria-labelledby="drinks-title">
                <div className="drinks-intro">
                  <span className="eyebrow">{t.drinksEyebrow}</span>
                  <h2 id="drinks-title">{t.drinks}</h2>
                  <p>{t.drinksSub}</p>
                  <button className="link" type="button" onClick={() => openCategory("drinks")}>
                    {t.viewAllDrinks} <Icon name="arrow" size={16} />
                  </button>
                </div>
                <div className="drinks-grid">
                  {inCategory("drinks").map((d) => <ProductCard key={d.id} {...cardProps(d)} size="tall" />)}
                </div>
              </section>
            )}

            {/* 4. Combos + desserts */}
            <div className="promo-row" id="combos">
              {combos[0] && <PromoCard {...promoProps(combos[0])} tone="deep" />}
              <Shelf id="desserts" title={t.desserts} sub={t.dessertsSub} viewAll={t.viewAll} onViewAll={() => openCategory("desserts")}>
                {inCategory("desserts").map((d) => <ProductCard key={d.id} {...cardProps(d)} size="sm" />)}
              </Shelf>
              {combos[1] && <PromoCard {...promoProps(combos[1])} tone="gold" />}
            </div>

            {/* 5. Complete menu by category */}
            <section className="section" id="menu" aria-labelledby="menu-title">
              <SectionHead id="menu-title" title={t.menu} sub={t.menuSub}>
                <label className="veg-toggle">
                  <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
                  <span className="switch" aria-hidden="true" />
                  <VegMark veg /> {t.vegOnly}
                </label>
              </SectionHead>
              <div className="menu-chips" role="tablist" aria-label="Menu categories">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`chip${activeCategory === c.id ? " is-on" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === c.id}
                    onClick={() => setActiveCategory(c.id)}
                  >
                    {c.label} <small>{countFor(c.id)}</small>
                  </button>
                ))}
              </div>
              <div className="menu-panel" role="tabpanel">
                <h3 className="menu-panel-title">
                  {activeLabel}
                  <span>{plural(categoryItems.length)}</span>
                </h3>
                {categoryItems.length > 0 ? (
                  <div className="list-grid">
                    {categoryItems.map((d) => <DishRow key={d.id} {...cardProps(d)} />)}
                  </div>
                ) : (
                  <p className="empty-state">No dishes here{vegOnly ? " with Veg only on" : ""}.</p>
                )}
              </div>
              <p className="allergy-note"><Icon name="chat" size={18} /> {t.allergy}</p>
            </section>
          </>
        )}
      </main>

      {showTop && (
        <button className="to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
          <Icon name="up" size={20} />
        </button>
      )}

      {/* Compact service bar + persistent cart */}
      <footer className="service-bar">
        <div className="service-actions">
          <ServiceButton icon="bell" label={t.waiter} done={!!requests.waiter} doneLabel={t.requested} onClick={() => requestService("waiter", "A waiter is on the way")} />
          <ServiceButton icon="drop" label={t.water} done={!!requests.water} doneLabel={t.requested} onClick={() => requestService("water", "Water is on the way")} />
          <ServiceButton icon="receipt" label={t.bill} done={!!requests.bill} doneLabel={t.requested} disabled={!activeOrder} onClick={() => requestService("bill", "Your bill is being prepared")} />
        </div>
        <button className={`cart-summary${bump ? " has-bump" : ""}`} key={`cart-${bump}`} type="button" disabled={itemCount === 0} onClick={() => setDrawer("cart")}>
          {itemCount === 0 ? (
            <span className="muted-light"><Icon name="bag" /> {t.empty}</span>
          ) : (
            <>
              <span className="badge badge-light">{itemCount}</span>
              <span>{t.items} · <strong>{rupees(total)}</strong></span>
              <span className="cart-view">{t.view} <Icon name="arrow" size={16} /></span>
            </>
          )}
        </button>
      </footer>

      {selected && (
        <DishSheet
          item={selected}
          addLabel={t.add}
          onClose={() => setSelected(null)}
          onAdd={(qty, spicePref, note) => {
            addLine(selected, qty, spicePref, note);
            notify(`${selected.name} added to your order`);
            setSelected(null);
          }}
        />
      )}

      {drawer !== "closed" && (
        <div className="overlay overlay-right" onClick={() => setDrawer("closed")}>
          <aside className="drawer" role="dialog" aria-label="Your order" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h2>{drawer === "placed" ? "Order sent" : t.myOrder}</h2>
              <button className="icon-btn" type="button" onClick={() => setDrawer("closed")} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>

            {drawer === "placed" && activeOrder ? (
              <div className="placed">
                <span className="placed-icon"><Icon name="check" size={34} /></span>
                <h3>Order #{activeOrder.number} is with the kitchen</h3>
                <p className="muted">We’ll bring everything to Table {restaurant.table}. You can keep adding dishes any time.</p>
                <button className="cta cta-block" type="button" onClick={() => setDrawer("closed")}>Continue browsing</button>
                <button className="cta-outline" type="button" onClick={() => setDrawer("cart")}>View ordered items</button>
              </div>
            ) : (
              <>
                {cart.length === 0 ? (
                  <div className="drawer-empty">
                    <Icon name="bag" size={30} />
                    <p>{t.empty}</p>
                    <button className="cta-outline" type="button" onClick={() => { setDrawer("closed"); scrollTo("menu"); }}>{t.explore}</button>
                  </div>
                ) : (
                  <>
                    <p className="drawer-label">New items</p>
                    <ul className="drawer-lines">
                      {cart.map((l) => (
                        <li key={l.key}>
                          <Photo className="line-photo" src={l.photo} alt="" eager />
                          <span className="line-copy">
                            <strong>{l.name}</strong>
                            {(l.spicePref || l.note) && <small>{[l.spicePref, l.note].filter(Boolean).join(" · ")}</small>}
                            <span>{rupees(l.qty * l.price)}</span>
                          </span>
                          <AddControl qty={l.qty} label={t.add} size="sm" onAdd={() => changeLine(l.key, 1)} onRemove={() => changeLine(l.key, -1)} />
                        </li>
                      ))}
                    </ul>
                    <label className="order-note">
                      <span>Note for the kitchen (optional)</span>
                      <textarea rows={2} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="e.g. Serve starters first, allergic to peanuts" />
                    </label>
                    <div className="drawer-total">
                      <span>Subtotal</span>
                      <strong>{rupees(total)}</strong>
                    </div>
                    <p className="drawer-note">Taxes are added on the final bill. Coupons, bank/UPI offers and loyalty points are applied at payment.</p>
                    <button className="cta cta-block" type="button" onClick={placeOrder}>
                      Place order · {rupees(total)}
                    </button>
                  </>
                )}

                {activeOrder && (
                  <div className="ordered">
                    <p className="drawer-label">Already ordered · #{activeOrder.number} · {activeOrder.status}</p>
                    <ul className="ordered-lines">
                      {activeOrder.lines.map((l, i) => (
                        <li key={`${l.key}-${i}`}>
                          <span>{l.qty} × {l.name}{(l.spicePref || l.note) && <small> · {[l.spicePref, l.note].filter(Boolean).join(" · ")}</small>}</span>
                          <span>{rupees(l.qty * l.price)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="drawer-total small">
                      <span>Ordered so far</span>
                      <strong>{rupees(orderedTotal)}</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}

      {toast && <div className="toast" role="status"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  );
}

function ServiceButton({
  icon,
  label,
  done,
  doneLabel,
  disabled,
  onClick,
}: {
  icon: "bell" | "drop" | "receipt";
  label: string;
  done: boolean;
  doneLabel: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={done ? "is-done" : ""} type="button" disabled={disabled || done} onClick={onClick} aria-label={done ? `${label}: ${doneLabel}` : label}>
      <Icon name={done ? "check" : icon} /> <span>{done ? doneLabel : label}</span>
    </button>
  );
}

function Shelf({
  id,
  title,
  sub,
  viewAll,
  onViewAll,
  children,
}: {
  id: string;
  title: string;
  sub: string;
  viewAll: string;
  onViewAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="shelf" id={id} aria-labelledby={`${id}-title`}>
      <div className="shelf-head">
        <h2 id={`${id}-title`}>{title}</h2>
        <p className="muted">{sub}</p>
        <button className="link" type="button" onClick={onViewAll}>
          {viewAll} <Icon name="arrow" size={16} />
        </button>
      </div>
      <div className="shelf-row">{children}</div>
    </section>
  );
}

function ProductCard({
  item,
  qty,
  label,
  onAdd,
  onRemove,
  onOpen,
  badge,
  size = "md",
}: CardProps & { badge?: string; size?: "md" | "sm" | "tall" }) {
  return (
    <article className={`product product-${size}`}>
      <button className="product-media" type="button" onClick={onOpen} aria-label={`See details for ${item.name}`}>
        <Photo className="product-photo" src={item.photo} alt={item.name} />
        {badge && <span className="product-badge">{badge}</span>}
      </button>
      <div className="product-body">
        <button className="product-title" type="button" onClick={onOpen}>
          <VegMark veg={item.veg} /> <span>{item.name}</span>
        </button>
        {size !== "sm" && (
          <>
            <SpiceMeter level={item.spice} />
            <p className="product-desc">{item.description}</p>
          </>
        )}
        <div className="product-foot">
          <strong>{rupees(item.price)}</strong>
          <AddControl qty={qty} label={label} name={item.name} onAdd={onAdd} onRemove={onRemove} size="round" />
        </div>
      </div>
    </article>
  );
}

const PLATE_STEP_MS = 3000;

// Endless slider of round plates. The centre dish is highlighted; the rest step aside, smaller and lighter.
// Moves one dish every PLATE_STEP_MS, pauses on hover/touch, and supports arrows, tapping a side dish and swiping.
function PlateCarousel({
  items,
  cardFor,
  after,
  detailsLabel,
  prevLabel,
  nextLabel,
}: {
  items: { dish: Item; tag: string }[];
  cardFor: (item: Item) => CardProps;
  after?: React.ReactNode;
  detailsLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const n = items.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [swipeX, setSwipeX] = useState<number | null>(null);
  const go = (i: number) => setActive(((i % n) + n) % n);

  useEffect(() => {
    if (paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % n), PLATE_STEP_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, n]);

  return (
    <>
      <div
        className="best-stage"
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onPointerDown={(e) => { if (e.pointerType !== "mouse") { setSwipeX(e.clientX); setPaused(true); } }}
        onPointerUp={(e) => {
          if (swipeX === null) return;
          const dx = e.clientX - swipeX;
          if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1));
          setSwipeX(null);
          setPaused(false);
        }}
        onPointerCancel={() => { setSwipeX(null); setPaused(false); }}
      >
        {items.map(({ dish, tag }, i) => {
          // Shortest distance from the active dish, so the loop wraps both ways.
          let offset = (i - active + n) % n;
          if (offset > n / 2) offset -= n;
          const pos = offset === 0 ? "center" : Math.abs(offset) === 1 ? "near" : Math.abs(offset) === 2 ? "far" : "hidden";
          const card = cardFor(dish);
          const isCenter = pos === "center";
          return (
            <article
              key={dish.id}
              className={`carousel-item is-${pos}`}
              style={{ "--offset": offset } as React.CSSProperties}
              aria-hidden={!isCenter}
              inert={pos === "hidden"}
            >
              <button
                className="plate"
                type="button"
                onClick={isCenter ? card.onOpen : () => go(i)}
                aria-label={isCenter ? `See details for ${dish.name}` : `Show ${dish.name}`}
                tabIndex={isCenter ? 0 : -1}
              >
                <Photo className="plate-photo" src={dish.photo} alt={dish.name} />
              </button>
              <div className="plate-copy">
                {tag && <span className="plate-rank">{tag}</span>}
                <button className="plate-title" type="button" onClick={isCenter ? card.onOpen : () => go(i)} tabIndex={isCenter ? 0 : -1}>
                  <VegMark veg={dish.veg} /> {dish.name}
                </button>
                <p>{dish.description}</p>
                {isCenter && (
                  <button className="link plate-more" type="button" onClick={card.onOpen}>
                    {detailsLabel} <Icon name="arrow" size={16} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="best-nav">
        <button className="best-arrow" type="button" onClick={() => go(active - 1)} aria-label={prevLabel}>
          <Icon name="left" size={20} />
        </button>
        <span className="best-count" aria-hidden="true">
          {String(active + 1).padStart(2, "0")}<small> / {String(n).padStart(2, "0")}</small>
        </span>
        <button className="best-arrow" type="button" onClick={() => go(active + 1)} aria-label={nextLabel}>
          <Icon name="right" size={20} />
        </button>
        {after && <span className="best-nav-after">{after}</span>}
      </div>
    </>
  );
}

function PromoCard({
  combo,
  qty,
  label,
  onAdd,
  onRemove,
  onOpen,
  tone,
}: {
  combo: Combo;
  qty: number;
  label: string;
  onAdd: () => void;
  onRemove: () => void;
  onOpen: () => void;
  tone: "deep" | "gold";
}) {
  return (
    <article className={`promo promo-${tone}`}>
      <div className="promo-copy">
        <span className="promo-tag">{combo.regularPrice ? `Save ${rupees(combo.regularPrice - combo.price)}` : "Combo"}</span>
        <h3>{combo.name}</h3>
        <p>{combo.includes}</p>
        <div className="promo-foot">
          <span className="price-group">
            <strong>{rupees(combo.price)}</strong>
            {combo.regularPrice && <s>{rupees(combo.regularPrice)}</s>}
          </span>
          <AddControl qty={qty} label={label} onAdd={onAdd} onRemove={onRemove} size="sm" />
        </div>
      </div>
      <button className="promo-media" type="button" onClick={onOpen} aria-label={`See details for ${combo.name}`}>
        <Photo className="promo-photo" src={combo.photo} alt={combo.name} />
      </button>
    </article>
  );
}

function DishSheet({
  item,
  addLabel,
  onClose,
  onAdd,
}: {
  item: Item;
  addLabel: string;
  onClose: () => void;
  onAdd: (qty: number, spicePref?: string, note?: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [spicePref, setSpicePref] = useState<string | undefined>(item.spice ? SPICE_PREFS[1] : undefined);
  const [notes, setNotes] = useState<string[]>([]);
  const [custom, setCustom] = useState("");

  const toggleNote = (n: string) => setNotes((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));
  const note = [...notes, custom.trim()].filter(Boolean).join(", ") || undefined;

  return (
    <div className="overlay overlay-center" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={item.name} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-media">
          <Photo className="sheet-photo" src={item.photo} alt={item.name} />
          <button className="icon-btn sheet-close" type="button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">
          <div className="sheet-title">
            <h2><VegMark veg={item.veg} /> {item.name}</h2>
            <strong>{rupees(item.price)}</strong>
          </div>
          <SpiceMeter level={item.spice} />
          <p className="sheet-desc">{item.description}</p>

          {item.spice ? (
            <fieldset className="option-group">
              <legend>Spice preference</legend>
              <div className="chip-row">
                {SPICE_PREFS.map((s) => (
                  <button key={s} type="button" className={`chip${spicePref === s ? " is-on" : ""}`} aria-pressed={spicePref === s} onClick={() => setSpicePref(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset className="option-group">
            <legend>Cooking notes <small>(optional)</small></legend>
            <div className="chip-row">
              {QUICK_NOTES.map((n) => (
                <button key={n} type="button" className={`chip${notes.includes(n) ? " is-on" : ""}`} aria-pressed={notes.includes(n)} onClick={() => toggleNote(n)}>
                  {notes.includes(n) && <Icon name="check" size={14} />} {n}
                </button>
              ))}
            </div>
            <input className="note-input" type="text" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Anything else? e.g. extra gravy" maxLength={80} />
          </fieldset>

          <div className="sheet-foot">
            <div className="stepper add-btn-md">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Fewer">−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} aria-label="More">+</button>
            </div>
            <button className="cta sheet-add" type="button" onClick={() => onAdd(qty, item.spice ? spicePref : undefined, note)}>
              {addLabel} · {rupees(item.price * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DishRow({ item, qty, label, onAdd, onRemove, onOpen }: CardProps) {
  return (
    <article className="dish-row">
      <button className="row-open" type="button" onClick={onOpen} aria-label={`See details for ${item.name}`}>
        <Photo className="row-photo" src={item.photo} alt={item.name} />
      </button>
      <div className="row-copy">
        <button className="row-title" type="button" onClick={onOpen}>
          <VegMark veg={item.veg} /> {item.name}
        </button>
        <SpiceMeter level={item.spice} />
        <p>{item.description}</p>
        <div className="row-foot">
          <strong>{rupees(item.price)}</strong>
          <AddControl qty={qty} label={label} onAdd={onAdd} onRemove={onRemove} size="sm" />
        </div>
      </div>
    </article>
  );
}

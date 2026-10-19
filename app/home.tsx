"use client";

import { useEffect, useMemo, useState } from "react";
import {
  categories,
  combos,
  dishes,
  extraIds,
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
    heroEyebrow: "Welcome to",
    heroTitle: "Explore the Menu.",
    heroTitle2: "Order Directly From Your Table.",
    heroSub: "Pick what you like, add it to your order and we’ll bring it right to you.",
    start: "Start your order",
    browse: "Browse full menu",
    step1: "Choose your dishes",
    step1s: "Tap any dish for details",
    step2: "Tell us how you like it",
    step2s: "Spice level & cooking notes",
    step3: "Place your order",
    step3s: "We serve it at your table",
    popularEyebrow: "Guest favourites",
    popular: "Most ordered",
    popularSub: "Our guests’ top picks this month",
    combosEyebrow: "Better together",
    combos: "Combos & special offers",
    goesWell: "Goes well with your meal",
    menuEyebrow: "Everything we serve",
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
    heroEyebrow: "स्वागत है",
    heroTitle: "मेन्यू देखें।",
    heroTitle2: "अपनी टेबल से सीधे ऑर्डर करें।",
    heroSub: "जो पसंद हो चुनें, ऑर्डर में जोड़ें — हम आपकी टेबल पर ले आएंगे।",
    start: "ऑर्डर शुरू करें",
    browse: "पूरा मेन्यू",
    step1: "डिश चुनें",
    step1s: "डिटेल के लिए डिश पर टैप करें",
    step2: "अपनी पसंद बताएं",
    step2s: "तीखापन और कुकिंग नोट",
    step3: "ऑर्डर करें",
    step3s: "हम टेबल पर परोसेंगे",
    popularEyebrow: "मेहमानों की पसंद",
    popular: "सबसे ज़्यादा ऑर्डर",
    popularSub: "इस महीने मेहमानों की पसंद",
    combosEyebrow: "साथ में बेहतर",
    combos: "कॉम्बो और स्पेशल ऑफ़र",
    goesWell: "खाने के साथ",
    menuEyebrow: "हमारा पूरा मेन्यू",
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

const SPICE_PREFS = ["Mild", "Medium", "Spicy"];
const QUICK_NOTES = ["No onion", "No garlic", "Less oil", "Jain"];
// How long a service button shows "Requested" in this demo. Real status comes from the staff app.
const SERVICE_COOLDOWN_MS = 30_000;

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
  note: "M5 4h14v12l-4 4H5V4Zm10 12v4m0-4h4M8 9h8m-8 4h5",
  plate: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  chat: "M5 5h14v10H9l-4 4V5Z",
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
  eyebrow,
  title,
  sub,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function AddControl({
  qty,
  label,
  onAdd,
  onRemove,
  size = "md",
}: {
  qty: number;
  label: string;
  onAdd: () => void;
  onRemove: () => void;
  size?: "md" | "sm";
}) {
  if (qty === 0) {
    return (
      <button className={`add-btn add-btn-${size}`} type="button" onClick={onAdd}>
        {label} <span aria-hidden="true">+</span>
      </button>
    );
  }
  return (
    <div className={`stepper add-btn-${size}`}>
      <button type="button" onClick={onRemove} aria-label="Remove one">−</button>
      <span aria-live="polite">{qty}</span>
      <button type="button" onClick={onAdd} aria-label="Add one">+</button>
    </div>
  );
}

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
        .sort((a, b) => a.orderRank! - b.orderRank!)
        .slice(0, 4),
    [],
  );
  const extras = extraIds.map((id) => dishes.find((d) => d.id === id)!).filter(Boolean);
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

  const rowProps = (item: Item) => ({
    item,
    qty: qtyOf(item.id),
    label: t.add,
    onAdd: () => addLine(item),
    onRemove: () => removeOne(item.id),
    onOpen: () => setSelected(item),
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
              <div>
                <span className="eyebrow">{plural(results.length)}</span>
                <h2 id="results-title">Results for “{query.trim()}”</h2>
              </div>
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
                        setActiveCategory(c.id);
                        window.setTimeout(() => scrollTo("menu"), 50);
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="list-grid">
                {results.map((d) => <DishRow key={d.id} {...rowProps(d)} />)}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* 1. Welcome + food visual: the single primary banner */}
            <section className="hero" aria-labelledby="hero-title">
              <Photo className="hero-photo" src={restaurant.heroPhoto} alt="A freshly cooked pot of biryani" eager />
              <div className="hero-copy">
                <span className="eyebrow light">{t.heroEyebrow} {restaurant.name}</span>
                <h1 id="hero-title">
                  {t.heroTitle}
                  <span>{t.heroTitle2}</span>
                </h1>
                <p>{t.heroSub}</p>
                <div className="hero-actions">
                  <button className="cta" type="button" onClick={() => scrollTo("popular")}>
                    {t.start} <Icon name="arrow" />
                  </button>
                  <button className="cta-ghost" type="button" onClick={() => scrollTo("menu")}>
                    {t.browse}
                  </button>
                </div>
              </div>
            </section>

            {/* How ordering works: helps first-time guests, no promotions */}
            <ol className="steps" aria-label="How to order">
              <li><span className="step-icon"><Icon name="plate" size={20} /></span><span><strong>{t.step1}</strong><small>{t.step1s}</small></span></li>
              <li><span className="step-icon"><Icon name="note" size={20} /></span><span><strong>{t.step2}</strong><small>{t.step2s}</small></span></li>
              <li><span className="step-icon"><Icon name="check" size={20} /></span><span><strong>{t.step3}</strong><small>{t.step3s}</small></span></li>
            </ol>

            {/* 2. Popular dishes */}
            {popular.length > 0 && (
              <section className="section" id="popular" aria-labelledby="popular-title">
                <SectionHead id="popular-title" eyebrow={t.popularEyebrow} title={t.popular} sub={t.popularSub}>
                  <button className="link" type="button" onClick={() => scrollTo("menu")}>
                    {t.menu} <Icon name="arrow" size={16} />
                  </button>
                </SectionHead>
                <div className="popular-grid">
                  {popular.map((d) => (
                    <article className="dish-card" key={d.id}>
                      <button className="dish-media" type="button" onClick={() => setSelected(d)} aria-label={`See details for ${d.name}`}>
                        <Photo className="dish-photo" src={d.photo} alt={d.name} />
                        <span className="rank">#{d.orderRank}</span>
                      </button>
                      <div className="dish-body">
                        <button className="dish-title" type="button" onClick={() => setSelected(d)}>
                          <VegMark veg={d.veg} /> {d.name}
                        </button>
                        <SpiceMeter level={d.spice} />
                        <p>{d.description}</p>
                        <div className="dish-foot">
                          <strong>{rupees(d.price)}</strong>
                          <AddControl qty={qtyOf(d.id)} label={t.add} onAdd={() => addLine(d)} onRemove={() => removeOne(d.id)} />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Combos, offers and add-ons: secondary, after food discovery */}
            <section className="section" aria-labelledby="combos-title">
              <SectionHead id="combos-title" eyebrow={t.combosEyebrow} title={t.combos} />
              <div className="extras-layout">
                <div className="combo-list">
                  {combos.map((c) => (
                    <article className="combo-card" key={c.id}>
                      <button className="combo-media" type="button" onClick={() => setSelected(comboToItem(c))} aria-label={`See details for ${c.name}`}>
                        <Photo className="combo-photo" src={c.photo} alt={c.name} />
                      </button>
                      <div className="combo-body">
                        <span className="tag">{c.regularPrice ? `Save ${rupees(c.regularPrice - c.price)}` : "Combo"}</span>
                        <h3>{c.name}</h3>
                        <p>{c.includes}</p>
                        <div className="dish-foot">
                          <span className="price-group">
                            <strong>{rupees(c.price)}</strong>
                            {c.regularPrice && <s>{rupees(c.regularPrice)}</s>}
                          </span>
                          <AddControl qty={qtyOf(c.id)} label={t.add} onAdd={() => addLine(comboToItem(c))} onRemove={() => removeOne(c.id)} size="sm" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="addons">
                  <h3 className="addons-title">{t.goesWell}</h3>
                  {extras.map((d) => (
                    <div className="addon-row" key={d.id}>
                      <button className="addon-open" type="button" onClick={() => setSelected(d)}>
                        <Photo className="addon-photo" src={d.photo} alt={d.name} />
                        <span className="addon-copy">
                          <strong>{d.name}</strong>
                          <span>{rupees(d.price)}</span>
                        </span>
                      </button>
                      <AddControl qty={qtyOf(d.id)} label={t.add} onAdd={() => addLine(d)} onRemove={() => removeOne(d.id)} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 4. Complete menu by category */}
            <section className="section" id="menu" aria-labelledby="menu-title">
              <SectionHead id="menu-title" eyebrow={t.menuEyebrow} title={t.menu} sub={t.menuSub}>
                <label className="veg-toggle">
                  <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
                  <span className="switch" aria-hidden="true" />
                  <VegMark veg /> {t.vegOnly}
                </label>
              </SectionHead>
              <div className="category-grid" role="tablist" aria-label="Menu categories">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`category${activeCategory === c.id ? " is-active" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === c.id}
                    onClick={() => setActiveCategory(c.id)}
                  >
                    <Photo className="category-photo" src={c.photo} alt="" />
                    <span className="category-label">{c.label}</span>
                    <small>{plural(countFor(c.id))}</small>
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
                    {categoryItems.map((d) => <DishRow key={d.id} {...rowProps(d)} />)}
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

      {/* 5. Compact service bar + persistent cart */}
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
                    <button className="cta-outline" type="button" onClick={() => { setDrawer("closed"); scrollTo("menu"); }}>{t.browse}</button>
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

function DishRow({
  item,
  qty,
  label,
  onAdd,
  onRemove,
  onOpen,
}: {
  item: Item;
  qty: number;
  label: string;
  onAdd: () => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
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

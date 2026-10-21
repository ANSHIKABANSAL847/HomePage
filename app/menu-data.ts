// Sample menu data. Replace with the restaurant's real menu feed.
// `orderRank` must come from actual order history; leave it undefined
// when there is no reliable data, and the dish won't be called a bestseller.

export type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  veg: boolean;
  photo: string;
  // 0 = not spicy … 3 = very spicy. From the kitchen's recipe card.
  spice?: 0 | 1 | 2 | 3;
  orderRank?: number;
};

export type Combo = {
  id: string;
  name: string;
  includes: string;
  price: number;
  regularPrice?: number;
  photo: string;
};

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const restaurant = {
  name: "Saffron & Stone",
  table: "08",
};

export const categories = [
  { id: "starters", label: "Starters", photo: img("1601050690597-df0568f70950", 240) },
  { id: "soups", label: "Soups", photo: img("1547592166-23ac45744acd", 240) },
  { id: "tandoor", label: "Tandoor", photo: img("1617692855027-33b14f061079", 240) },
  { id: "mains", label: "Main course", photo: img("1631452180519-c014fe946bc7", 240) },
  { id: "breads", label: "Breads", photo: img("1567337710282-00832b415979", 240) },
  { id: "biryani", label: "Biryani & rice", photo: img("1563379091339-03b21ab4a4f8", 240) },
  { id: "chinese", label: "Chinese", photo: img("1585032226651-759b368d7246", 240) },
  { id: "south", label: "South Indian", photo: img("1668236543090-82eba5ee5976", 240) },
  { id: "street", label: "Street food", photo: img("1606491956689-2ea866880c84", 240) },
  { id: "drinks", label: "Drinks", photo: img("1551538827-9c037cb4f32a", 240) },
  { id: "desserts", label: "Desserts", photo: img("1517244683847-7456b63c5969", 240) },
  { id: "combos", label: "Combos & thali", photo: img("1546833999-b9f581a1996d", 240) },
];

export const dishes: Dish[] = [
  {
    id: "paneer-tikka",
    name: "Paneer Tikka",
    description: "Cottage cheese, peppers and onion, char-grilled in a smoky tandoor marinade.",
    price: 320,
    category: "starters",
    spice: 2,
    veg: true,
    photo: img("1567188040759-fb8a883dc6d8"),
    orderRank: 1,
  },
  {
    id: "dal-makhani",
    name: "Dal Makhani",
    description: "Black lentils slow-cooked overnight with butter and a touch of cream.",
    price: 280,
    category: "mains",
    spice: 1,
    veg: true,
    photo: img("1585937421612-70a008356fbe"),
    orderRank: 2,
  },
  {
    id: "veg-biryani",
    name: "Veg Biryani",
    description: "Long-grain basmati layered with vegetables, saffron and whole spices.",
    price: 300,
    category: "biryani",
    spice: 2,
    veg: true,
    photo: img("1563379091339-03b21ab4a4f8"),
    orderRank: 3,
  },
  {
    id: "paneer-butter-masala",
    name: "Paneer Butter Masala",
    description: "Soft paneer in a rich tomato, cashew and butter gravy.",
    price: 340,
    category: "mains",
    spice: 1,
    veg: true,
    photo: img("1631452180519-c014fe946bc7"),
    orderRank: 4,
  },
  {
    id: "butter-naan",
    name: "Butter Naan",
    description: "Tandoor-baked and brushed with butter.",
    price: 60,
    category: "breads",
    veg: true,
    photo: img("1567337710282-00832b415979"),
  },
  {
    id: "garlic-naan",
    name: "Garlic Naan",
    description: "Naan topped with garlic and coriander, baked in the tandoor.",
    price: 80,
    category: "breads",
    veg: true,
    photo: img("1565557623262-b51c2513a641", 400),
  },
  {
    id: "virgin-mojito",
    name: "Virgin Mojito",
    description: "Fresh mint, lime and soda.",
    price: 160,
    category: "drinks",
    veg: true,
    photo: img("1551538827-9c037cb4f32a", 400),
  },
  {
    id: "cold-coffee",
    name: "Cold Coffee",
    description: "Blended with milk and a scoop of ice cream.",
    price: 180,
    category: "drinks",
    veg: true,
    photo: img("1461023058943-07fcbe16d735", 400),
  },
  {
    id: "gajar-halwa",
    name: "Gajar Halwa",
    description: "Slow-cooked carrots, milk and cardamom, topped with nuts.",
    price: 150,
    category: "desserts",
    veg: true,
    photo: img("1517244683847-7456b63c5969", 400),
  },
  {
    id: "samosa",
    name: "Punjabi Samosa",
    description: "Crisp pastry filled with spiced potato and peas, with mint and tamarind chutney.",
    price: 120,
    category: "starters",
    spice: 1,
    veg: true,
    photo: img("1601050690117-94f5f6fa8bd7", 400),
  },
  {
    id: "veg-momos",
    name: "Veg Momos",
    description: "Steamed dumplings with a fiery red chutney.",
    price: 180,
    category: "starters",
    spice: 2,
    veg: true,
    photo: img("1625220194771-7ebdea0b70b9", 400),
  },
  {
    id: "tomato-shorba",
    name: "Tomato Shorba",
    description: "Light, tangy tomato soup with roasted cumin and coriander.",
    price: 140,
    category: "soups",
    spice: 1,
    veg: true,
    photo: img("1547592166-23ac45744acd", 400),
  },
  {
    id: "sweet-corn-soup",
    name: "Sweet Corn Soup",
    description: "Creamy corn soup with a hint of pepper.",
    price: 150,
    category: "soups",
    veg: true,
    photo: img("1604152135912-04a022e23696", 400),
  },
  {
    id: "tandoori-chicken",
    name: "Tandoori Chicken",
    description: "Half chicken marinated in yoghurt and spices, roasted in the tandoor.",
    price: 420,
    category: "tandoor",
    spice: 2,
    veg: false,
    photo: img("1617692855027-33b14f061079", 400),
  },
  {
    id: "chicken-tikka",
    name: "Chicken Tikka",
    description: "Boneless chicken skewers, smoky and juicy.",
    price: 360,
    category: "tandoor",
    spice: 2,
    veg: false,
    photo: img("1599487488170-d11ec9c172f0", 400),
  },
  {
    id: "butter-chicken",
    name: "Butter Chicken",
    description: "Tandoori chicken simmered in a silky tomato and butter gravy.",
    price: 420,
    category: "mains",
    spice: 1,
    veg: false,
    photo: img("1603894584373-5ac82b2ae398", 400),
  },
  {
    id: "veg-pulao",
    name: "Veg Pulao",
    description: "Fragrant basmati cooked with vegetables and whole spices.",
    price: 240,
    category: "biryani",
    spice: 1,
    veg: true,
    photo: img("1512058564366-18510be2db19", 400),
  },
  {
    id: "hakka-noodles",
    name: "Veg Hakka Noodles",
    description: "Wok-tossed noodles with crunchy vegetables.",
    price: 220,
    category: "chinese",
    spice: 1,
    veg: true,
    photo: img("1585032226651-759b368d7246", 400),
  },
  {
    id: "chilli-paneer",
    name: "Chilli Paneer",
    description: "Paneer tossed with peppers, onion and a spicy soy glaze.",
    price: 280,
    category: "chinese",
    spice: 3,
    veg: true,
    photo: img("1628294895950-9805252327bc", 400),
  },
  {
    id: "masala-dosa",
    name: "Masala Dosa",
    description: "Crisp rice crêpe with potato masala, sambar and chutneys.",
    price: 180,
    category: "south",
    spice: 1,
    veg: true,
    photo: img("1668236543090-82eba5ee5976", 400),
  },
  {
    id: "idli-sambar",
    name: "Idli Sambar",
    description: "Soft steamed rice cakes with sambar and coconut chutney.",
    price: 140,
    category: "south",
    spice: 1,
    veg: true,
    photo: img("1630383249896-424e482df921", 400),
  },
  {
    id: "pav-bhaji",
    name: "Pav Bhaji",
    description: "Buttery mashed-vegetable curry with toasted pav.",
    price: 200,
    category: "street",
    spice: 2,
    veg: true,
    photo: img("1606491956689-2ea866880c84", 400),
  },
  {
    id: "amritsari-chole",
    name: "Amritsari Chole",
    description: "Spiced chickpeas topped with onion and fresh coriander.",
    price: 220,
    category: "street",
    spice: 2,
    veg: true,
    photo: img("1610192244261-3f33de3f55e4", 400),
  },
  {
    id: "masala-chai",
    name: "Masala Chai",
    description: "Tea brewed with ginger, cardamom and milk.",
    price: 60,
    category: "drinks",
    veg: true,
    photo: img("1571934811356-5cc061b6821f", 400),
  },
  {
    id: "brownie-sundae",
    name: "Brownie Sundae",
    description: "Warm brownie, vanilla ice cream and chocolate sauce.",
    price: 220,
    category: "desserts",
    veg: true,
    photo: img("1563805042-7684c019e1cb", 400),
  },
];

export const combos: Combo[] = [
  {
    id: "royal-thali",
    name: "Royal Veg Thali",
    includes: "Dal, 2 sabzi, rice, 2 rotis, raita & sweet",
    price: 420,
    regularPrice: 490,
    photo: img("1546833999-b9f581a1996d", 600),
  },
  {
    id: "pav-bhaji-combo",
    name: "Pav Bhaji + Drink",
    includes: "Pav bhaji with butter pav and any soft drink",
    price: 260,
    photo: img("1606491956689-2ea866880c84", 600),
  },
];

// More dishes shown in the bestsellers slider after the ranked ones.
// They are NOT labelled as bestsellers (no order data); the slider shows their category instead.
export const featuredIds = [
  "butter-chicken",
  "tandoori-chicken",
  "chilli-paneer",
  "masala-dosa",
  "pav-bhaji",
  "amritsari-chole",
  "chicken-tikka",
  "veg-momos",
];

// Background photos for the top banner slides, in order. Slide text lives in home.tsx (EN/HI).
export const heroPhotos = [
  { photo: img("1505253758473-96b7015fcd40", 1600), alt: "A freshly cooked pot of biryani" },
  { photo: img("1546833999-b9f581a1996d", 1600), alt: "A thali with dal, sabzi, rice and roti" },
  { photo: img("1606491956689-2ea866880c84", 1600), alt: "Pav bhaji with buttered pav" },
];


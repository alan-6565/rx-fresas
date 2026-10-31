import type { OptionGroup } from "@/lib/options";

export const business = {
  name: "R&X Fresas con Crema",
  city: "Richmond, CA",
  tagline: "Bebidas, antojos y momentos más dulces para tu día.",
  handle: "@rx_fresasconcrema",
  instagram: "https://www.instagram.com/rx_fresasconcrema",
  tiktok: "https://www.tiktok.com/@rx_fresasconcrema",
  facebook: "https://www.facebook.com/search/top?q=R%26X%20Fresas%20con%20Crema",
};

export const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/menu", label: "Menú" },
  { href: "/nosotros", label: "Sobre Nosotros" },
  { href: "/ubicaciones", label: "Ubicaciones" },
  { href: "/galeria", label: "Galería" },
  { href: "/contacto", label: "Contacto" },
];

// Starting menu and spots. The live ones are in the database and edited from
// the dashboard (see lib/catalog.ts); these are only the first version.
export const locations = [
  {
    name: "El Portal",
    city: "Richmond, CA",
    hours: "6:00 p.m. – 10:00 p.m.",
    image: "/images/truck-portal.jpg",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=El+Portal+Dr+Richmond+CA",
  },
  {
    name: "San Pablo Dam Road",
    city: "Richmond, CA",
    hours: "6:00 p.m. – 10:00 p.m.",
    image: "/images/truck-sanpablo.jpg",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=San+Pablo+Dam+Rd+Richmond+CA",
  },
];

export const categories = [
  { id: "cafes", label: "Cafés", title: "Cafés Fríos y Calientes" },
  { id: "fresas", label: "Fresas con Crema", title: "Fresas con Crema" },
  { id: "pancakes", label: "Mini Pancakes", title: "Mini Pancakes" },
  { id: "otono", label: "Para el Otoño", title: "Para el Otoño" },
  { id: "extras", label: "Extras", title: "Agrega tus Toppings" },
] as const;

export type Item = {
  id: string;
  /** Sizes, crema, toppings… (empty for the built-in starter menu) */
  options?: OptionGroup[];
  name: string;
  price: number;
  desc: string;
  image: string;
  category: string;
};

export const items: Item[] = [
  { id: "caramel", name: "Iced Caramel Latte", price: 7, desc: "Café, leche y caramelo", image: "/images/d-caramel.jpg", category: "cafes" },
  { id: "cookies", name: "Iced Cookies & Cream", price: 7, desc: "Café, leche y oreo", image: "/images/d-cookies.jpg", category: "cafes" },
  { id: "strawberry", name: "Iced Strawberry Latte", price: 7, desc: "Café, leche y fresa", image: "/images/d-strawberry.jpg", category: "cafes" },
  { id: "vanilla", name: "Iced Vanilla Latte", price: 7, desc: "Café, leche y vainilla", image: "/images/d-vanilla.jpg", category: "cafes" },

  { id: "fresa-clasica", name: "Fresa Clásica", price: 8, desc: "Fresas, crema y granola", image: "/images/f-clasica.jpg", category: "fresas" },
  { id: "fresa-nutella", name: "Fresa con Nutella", price: 9, desc: "Fresas, crema, nutella y toppings", image: "/images/f-nutella.jpg", category: "fresas" },
  { id: "fresa-especial", name: "Fresa Especial", price: 9, desc: "Fresas, crema, plátano y más toppings", image: "/images/f-especial.jpg", category: "fresas" },

  { id: "pancakes-10", name: "Mini Pancakes (10 ct)", price: 8, desc: "1 fruta, 1 drizzle, 2 toppings", image: "/images/p-10.jpg", category: "pancakes" },
  { id: "pancakes-15", name: "Mini Pancakes (15 ct)", price: 12, desc: "2 frutas, 2 drizzle, 2 toppings", image: "/images/p-15.jpg", category: "pancakes" },
  { id: "pancakes-20", name: "Mini Pancakes (20 ct)", price: 15, desc: "2 frutas, 2 drizzle, 3 toppings", image: "/images/p-20.jpg", category: "pancakes" },
  { id: "pancakes-25", name: "Mini Pancakes (25 ct)", price: 18, desc: "Crea el tuyo", image: "/images/p-25.jpg", category: "pancakes" },

  // Seasonal prices weren't in the mockup, so these match the other lattes for now
  { id: "malvavisco", name: "Malvavisco Latte", price: 7, desc: "Café, leche, chocolate y malvaviscos tostados", image: "/images/o-malvavisco.jpg", category: "otono" },
  { id: "calabaza", name: "Dulce Calabaza Latte", price: 7, desc: "Café, leche, pumpkin spice y crema", image: "/images/o-calabaza.jpg", category: "otono" },
];

// From the truck's menus (fresas and mini pancakes share them)
export const toppings = [
  { group: "Frutas", list: ["Fresa", "Plátano"] },
  { group: "Drizzles", list: ["Nutella", "Lechera", "Syrup", "Pistacho"] },
  {
    group: "Toppings",
    list: ["M&Ms", "Azúcar en polvo", "Coco rallado", "Almendras", "Granola", "Oreo triturado", "KitKat triturado", "Chocolate chips", "Biscoff triturado"],
  },
];

export const gallery = [
  "/images/gal-prep.jpg",
  "/images/f-especial.jpg",
  "/images/gal-pancakes.jpg",
  "/images/historia.jpg",
  "/images/d-cookies.jpg",
  "/images/o-malvavisco.jpg",
  "/images/gal-cup.jpg",
  "/images/p-15.jpg",
  "/images/truck-portal.jpg",
];

export const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Datos de arranque del directorio.
 *
 * Las categorias son las reales del rubro pet/vet en Chile.
 * Los negocios son FICTICIOS: sirven para el seed de desarrollo y para el
 * modo demo (cuando no hay DATABASE_URL). No corresponden a empresas
 * existentes y no deben publicarse como si lo fueran.
 */

/** Valor JSON serializable, compatible con la columna `raw_source_data`. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type SeedCategory = {
  slug: string;
  name: string;
  icon: string;
  position: number;
};

export type SeedOffer = {
  title: string;
  description: string;
  type: "producto" | "servicio";
  priceRange?: string;
  bookable?: boolean;
};

export type SeedBusiness = {
  slug: string;
  name: string;
  rut?: string;
  categorySlug: string;
  tier: "empresa" | "emprendimiento";
  description: string;
  differentiationTag?: string;
  region: string;
  comuna: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  gmbPlaceId?: string;
  gmbRating?: number;
  gmbReviewCount?: number;
  status: "pending" | "approved" | "rejected";
  source: "osint" | "manual" | "self_signup";
  featured?: boolean;
  folioNumber?: string;
  offers?: SeedOffer[];
  /** Solo para los que entran por OSINT: alimenta la cola de /admin/revision. */
  ingestion?: {
    runId: string;
    confidenceScore: number;
    reviewerNotes?: string;
    raw: { [key: string]: JsonValue };
  };
};

export const seedCategories: SeedCategory[] = [
  { slug: "veterinarias", name: "Veterinarias", icon: "estetoscopio", position: 1 },
  { slug: "pet-shops", name: "Pet shops", icon: "bolsa", position: 2 },
  { slug: "peluqueria-canina", name: "Peluquería canina", icon: "tijera", position: 3 },
  { slug: "nutricion", name: "Nutrición", icon: "plato", position: 4 },
  { slug: "adiestramiento", name: "Adiestramiento", icon: "correa", position: 5 },
  { slug: "transporte", name: "Transporte", icon: "furgon", position: 6 },
  { slug: "seguros", name: "Seguros", icon: "escudo", position: 7 },
  { slug: "accesorios", name: "Accesorios", icon: "collar", position: 8 },
  { slug: "servicios-funerarios", name: "Servicios funerarios", icon: "hoja", position: 9 },
];

export const seedBusinesses: SeedBusiness[] = [
  {
    slug: "clinica-veterinaria-los-alerces",
    name: "Clínica Veterinaria Los Alerces",
    rut: "76.412.880-1",
    categorySlug: "veterinarias",
    tier: "empresa",
    description:
      "Clínica de atención general y de urgencias con pabellón propio, imagenología y hospitalización de 24 horas. Atiende caninos, felinos y animales exóticos con derivación a especialistas.",
    region: "Metropolitana de Santiago",
    comuna: "Providencia",
    address: "Av. Manuel Montt 1240",
    lat: -33.4278,
    lng: -70.6109,
    phone: "+56 2 2345 8890",
    whatsapp: "+56 9 8123 4455",
    email: "contacto@losalerces.example.cl",
    website: "https://losalerces.example.cl",
    instagram: "vetlosalerces",
    gmbPlaceId: "demo-place-losalerces",
    gmbRating: 4.7,
    gmbReviewCount: 412,
    status: "approved",
    source: "osint",
    featured: true,
    folioNumber: "0142",
    offers: [
      {
        title: "Consulta general",
        description: "Examen físico completo, revisión de carnet de vacunas y plan sanitario anual.",
        type: "servicio",
        priceRange: "$25.000 – $35.000",
      },
      {
        title: "Urgencias 24 horas",
        description: "Atención sin hora previa, estabilización y hospitalización con monitoreo continuo.",
        type: "servicio",
        priceRange: "Desde $45.000",
      },
      {
        title: "Ecografía abdominal",
        description: "Estudio de imagen con informe del mismo día para diagnóstico interno.",
        type: "servicio",
        priceRange: "$40.000 – $60.000",
      },
    ],
    ingestion: {
      runId: "run-2026-08-14",
      confidenceScore: 0.94,
      reviewerNotes: "RUT verificado en SII. Dirección y teléfono coinciden con la ficha de GMB.",
      raw: {
        fuente: "google_maps",
        nombre_detectado: "Clinica Veterinaria Los Alerces",
        telefono_detectado: "+56223458890",
        categoria_gmb: "Veterinarian",
        rating: 4.7,
        reviews: 412,
      },
    },
  },
  {
    slug: "vetmovil-sur",
    name: "VetMóvil Sur",
    categorySlug: "veterinarias",
    tier: "emprendimiento",
    description:
      "Atención veterinaria a domicilio en la zona sur de Santiago. Consulta, vacunas y toma de muestras sin sacar a la mascota de la casa, con agenda por WhatsApp.",
    differentiationTag: "Atiende a domicilio y sin jaula de traslado",
    region: "Metropolitana de Santiago",
    comuna: "La Florida",
    phone: "+56 9 7744 2210",
    whatsapp: "+56 9 7744 2210",
    email: "hola@vetmovilsur.example.cl",
    instagram: "vetmovilsur",
    gmbRating: 4.9,
    gmbReviewCount: 63,
    status: "approved",
    source: "self_signup",
    folioNumber: "0187",
    offers: [
      {
        title: "Consulta a domicilio",
        description: "Visita agendada dentro de la comuna, incluye examen clínico e indicaciones escritas.",
        type: "servicio",
        priceRange: "$30.000 – $40.000",
      },
      {
        title: "Vacunación en casa",
        description: "Séxtuple, antirrábica y refuerzos, con registro en carnet sanitario.",
        type: "servicio",
        priceRange: "Desde $18.000",
      },
    ],
  },
  {
    slug: "patitas-market",
    name: "Patitas Market",
    rut: "77.031.554-9",
    categorySlug: "pet-shops",
    tier: "empresa",
    description:
      "Tienda con local en Ñuñoa y despacho en la Región Metropolitana. Alimento, arena, juguetería y línea de farmacia veterinaria con receta.",
    region: "Metropolitana de Santiago",
    comuna: "Ñuñoa",
    address: "Irarrázaval 3455",
    lat: -33.4562,
    lng: -70.5901,
    phone: "+56 2 2987 1120",
    whatsapp: "+56 9 6612 8877",
    website: "https://patitasmarket.example.cl",
    instagram: "patitasmarket",
    gmbPlaceId: "demo-place-patitas",
    gmbRating: 4.5,
    gmbReviewCount: 289,
    status: "approved",
    source: "osint",
    featured: true,
    folioNumber: "0093",
    offers: [
      {
        title: "Alimento seco premium",
        description: "Formatos de 3, 10 y 15 kilos de las principales marcas disponibles en Chile.",
        type: "producto",
        priceRange: "$18.000 – $95.000",
      },
      {
        title: "Despacho mismo día",
        description: "Entrega dentro del día para pedidos hechos antes de las 14:00 en comunas del sector oriente.",
        type: "servicio",
        priceRange: "$3.500",
      },
    ],
    ingestion: {
      runId: "run-2026-08-14",
      confidenceScore: 0.88,
      reviewerNotes: "Sitio web activo con carro de compra. Se corrigió el nombre de fantasía.",
      raw: {
        fuente: "google_maps",
        nombre_detectado: "Patitas Market Nunoa",
        categoria_gmb: "Pet supply store",
        sitio: "patitasmarket.example.cl",
      },
    },
  },
  {
    slug: "granel-y-hocico",
    name: "Granel & Hocico",
    categorySlug: "pet-shops",
    tier: "emprendimiento",
    description:
      "Pet shop a granel: alimento pesado al momento, envases retornables y reparto en bicicleta dentro de Valparaíso. Trabaja con marcas nacionales de producción pequeña.",
    differentiationTag: "Venta a granel con envase retornable",
    region: "Valparaíso",
    comuna: "Valparaíso",
    address: "Cumming 480",
    whatsapp: "+56 9 5521 7788",
    instagram: "granelyhocico",
    gmbRating: 4.8,
    gmbReviewCount: 47,
    status: "approved",
    source: "self_signup",
    folioNumber: "0211",
    offers: [
      {
        title: "Alimento a granel",
        description: "Pesado por kilo, con descuento al traer el envase de la compra anterior.",
        type: "producto",
        priceRange: "$3.900 por kilo",
      },
    ],
  },
  {
    slug: "peluqueria-canina-brisa",
    name: "Peluquería Canina Brisa",
    categorySlug: "peluqueria-canina",
    tier: "emprendimiento",
    description:
      "Grooming sin secadora de jaula ni sedación, con manejo cooperativo para perros nerviosos o mayores. Atiende con hora tomada y un solo perro a la vez.",
    differentiationTag: "Grooming sin jaula, un perro por turno",
    region: "Metropolitana de Santiago",
    comuna: "Maipú",
    whatsapp: "+56 9 4433 9021",
    instagram: "brisagrooming",
    gmbRating: 5,
    gmbReviewCount: 38,
    status: "approved",
    source: "self_signup",
    folioNumber: "0176",
    offers: [
      {
        title: "Baño y corte raza pequeña",
        description: "Baño, secado a mano, corte de uñas y limpieza de oídos.",
        type: "servicio",
        priceRange: "$22.000 – $28.000",
      },
      {
        title: "Deslanado raza grande",
        description: "Retiro de subpelo para razas de doble manto, sin corte de capa.",
        type: "servicio",
        priceRange: "$35.000 – $45.000",
      },
    ],
  },
  {
    slug: "spa-canino-manto-limpio",
    name: "Spa Canino Manto Limpio",
    rut: "76.988.201-4",
    categorySlug: "peluqueria-canina",
    tier: "empresa",
    description:
      "Cadena de tres locales en el sector oriente con peluqueros certificados, agenda en línea y servicio de retiro y entrega de la mascota.",
    region: "Metropolitana de Santiago",
    comuna: "Las Condes",
    address: "Av. Apoquindo 6250",
    lat: -33.4092,
    lng: -70.5677,
    phone: "+56 2 2771 0345",
    website: "https://mantolimpio.example.cl",
    instagram: "mantolimpio",
    gmbRating: 4.4,
    gmbReviewCount: 521,
    status: "approved",
    source: "osint",
    folioNumber: "0058",
    offers: [
      {
        title: "Baño completo",
        description: "Incluye shampoo hipoalergénico, secado y perfumado.",
        type: "servicio",
        priceRange: "$19.000 – $32.000",
      },
      {
        title: "Retiro y entrega",
        description: "Traslado de ida y vuelta dentro de un radio de 8 kilómetros del local.",
        type: "servicio",
        priceRange: "$6.000",
      },
    ],
    ingestion: {
      runId: "run-2026-07-30",
      confidenceScore: 0.91,
      reviewerNotes: "Tres sucursales detectadas, se publica la casa matriz.",
      raw: { fuente: "google_maps", sucursales_detectadas: 3, categoria_gmb: "Pet groomer" },
    },
  },
  {
    slug: "cocina-natural-guau",
    name: "Cocina Natural Guau",
    categorySlug: "nutricion",
    tier: "emprendimiento",
    description:
      "Comida natural cocinada por porciones, formulada por médico veterinario con mención en nutrición. Planes semanales congelados con despacho propio.",
    differentiationTag: "Recetas formuladas por veterinaria nutricionista",
    region: "Metropolitana de Santiago",
    comuna: "Providencia",
    whatsapp: "+56 9 9012 3344",
    email: "pedidos@cocinaguau.example.cl",
    instagram: "cocinanaturalguau",
    gmbRating: 4.9,
    gmbReviewCount: 112,
    status: "approved",
    source: "self_signup",
    featured: true,
    folioNumber: "0203",
    offers: [
      {
        title: "Plan semanal 7 kilos",
        description: "Siete kilos de comida cocinada, porcionada según peso y condición corporal.",
        type: "producto",
        priceRange: "$52.000 por semana",
      },
      {
        title: "Evaluación nutricional",
        description: "Cálculo de requerimiento calórico y ajuste de la receta al caso de la mascota.",
        type: "servicio",
        priceRange: "$20.000",
      },
    ],
  },
  {
    slug: "nutricion-animal-del-maipo",
    name: "Nutrición Animal del Maipo",
    rut: "76.220.117-K",
    categorySlug: "nutricion",
    tier: "empresa",
    description:
      "Distribuidor de alimento y suplementos para mascotas con bodega propia, venta a tiendas y despacho a regiones.",
    region: "Metropolitana de Santiago",
    comuna: "Puente Alto",
    address: "Camino El Peñón 3120",
    phone: "+56 2 2455 7788",
    website: "https://nutriciondelmaipo.example.cl",
    gmbRating: 4.2,
    gmbReviewCount: 96,
    status: "approved",
    source: "manual",
    folioNumber: "0121",
    offers: [
      {
        title: "Venta mayorista",
        description: "Pallet y media paleta de alimento seco para tiendas y criaderos.",
        type: "producto",
        priceRange: "Cotización",
      },
    ],
  },
  {
    slug: "escuela-canina-huella-firme",
    name: "Escuela Canina Huella Firme",
    categorySlug: "adiestramiento",
    tier: "emprendimiento",
    description:
      "Adiestramiento en positivo y modificación de conducta para perros con miedo o reactividad. Clases individuales en el entorno del perro, no en centro de entrenamiento.",
    differentiationTag: "Solo refuerzo positivo, casos de reactividad",
    region: "Biobío",
    comuna: "Concepción",
    whatsapp: "+56 9 8877 1200",
    instagram: "huellafirmecl",
    gmbRating: 5,
    gmbReviewCount: 29,
    status: "approved",
    source: "self_signup",
    folioNumber: "0219",
    offers: [
      {
        title: "Sesión de conducta",
        description: "Evaluación en terreno más plan de manejo escrito para la familia.",
        type: "servicio",
        priceRange: "$35.000 por sesión",
      },
    ],
  },
  {
    slug: "petbus-traslados",
    name: "PetBus Traslados",
    rut: "77.455.902-3",
    categorySlug: "transporte",
    tier: "empresa",
    description:
      "Traslado de mascotas dentro de la Región Metropolitana y entre regiones, con vehículos climatizados, jaulas homologadas y seguro de viaje.",
    region: "Metropolitana de Santiago",
    comuna: "Santiago",
    address: "San Diego 1890",
    phone: "+56 2 2333 9080",
    whatsapp: "+56 9 6600 2211",
    website: "https://petbus.example.cl",
    gmbRating: 4.6,
    gmbReviewCount: 178,
    status: "approved",
    source: "osint",
    folioNumber: "0104",
    offers: [
      {
        title: "Traslado urbano",
        description: "Viaje puerta a puerta dentro de la Región Metropolitana con acompañante.",
        type: "servicio",
        priceRange: "$15.000 – $30.000",
      },
      {
        title: "Traslado interregional",
        description: "Ruta programada a regiones con paradas de hidratación y descanso.",
        type: "servicio",
        priceRange: "Desde $80.000",
      },
    ],
    ingestion: {
      runId: "run-2026-07-30",
      confidenceScore: 0.86,
      reviewerNotes: "Se verificó patente de los vehículos declarados en el sitio.",
      raw: { fuente: "google_maps", categoria_gmb: "Pet transportation service" },
    },
  },
  {
    slug: "segura-mascota",
    name: "Segura Mascota",
    rut: "76.710.443-8",
    categorySlug: "seguros",
    tier: "empresa",
    description:
      "Corredora especializada en seguros de salud para mascotas, con cobertura de urgencias, cirugías y responsabilidad civil por mordedura.",
    region: "Metropolitana de Santiago",
    comuna: "Las Condes",
    address: "Isidora Goyenechea 3120",
    phone: "+56 2 2588 4400",
    email: "contacto@seguramascota.example.cl",
    website: "https://seguramascota.example.cl",
    gmbRating: 4.1,
    gmbReviewCount: 64,
    status: "approved",
    source: "manual",
    folioNumber: "0067",
    offers: [
      {
        title: "Plan salud mascota",
        description: "Cobertura anual de consultas, exámenes y cirugías con red de clínicas adheridas.",
        type: "servicio",
        priceRange: "$12.000 – $38.000 mensual",
      },
    ],
  },
  {
    slug: "collares-quilapan",
    name: "Collares Quilapán",
    categorySlug: "accesorios",
    tier: "emprendimiento",
    description:
      "Taller de collares, pretales y correas hechos a mano con telar mapuche y herrajes de acero inoxidable. Producción por encargo y tallas a medida.",
    differentiationTag: "Hecho a mano en telar, tallas a medida",
    region: "La Araucanía",
    comuna: "Temuco",
    whatsapp: "+56 9 5544 8899",
    instagram: "collaresquilapan",
    gmbRating: 4.9,
    gmbReviewCount: 41,
    status: "approved",
    source: "self_signup",
    folioNumber: "0198",
    offers: [
      {
        title: "Pretal a medida",
        description: "Confección con medidas del perro y elección de diseño del telar.",
        type: "producto",
        priceRange: "$28.000 – $42.000",
      },
    ],
  },
  {
    slug: "memoria-animal",
    name: "Memoria Animal",
    rut: "77.120.885-6",
    categorySlug: "servicios-funerarios",
    tier: "empresa",
    description:
      "Cremación individual y colectiva con retiro a domicilio, certificado de cremación y urnas de madera nacional. Acompañamiento telefónico durante el proceso.",
    region: "Metropolitana de Santiago",
    comuna: "Quilicura",
    address: "Av. Matta Sur 2210",
    phone: "+56 2 2644 3311",
    whatsapp: "+56 9 7100 5566",
    website: "https://memoriaanimal.example.cl",
    gmbRating: 4.8,
    gmbReviewCount: 203,
    status: "approved",
    source: "osint",
    folioNumber: "0088",
    offers: [
      {
        title: "Cremación individual",
        description: "Retiro a domicilio, cremación con certificado y entrega de cenizas en urna.",
        type: "servicio",
        priceRange: "$110.000 – $180.000",
      },
    ],
    ingestion: {
      runId: "run-2026-07-30",
      confidenceScore: 0.9,
      raw: { fuente: "google_maps", categoria_gmb: "Pet funeral service" },
    },
  },
  {
    slug: "veterinaria-puerto-sur",
    name: "Veterinaria Puerto Sur",
    categorySlug: "veterinarias",
    tier: "empresa",
    description:
      "Consulta general, vacunación y cirugía de mediana complejidad en Puerto Montt, con convenio de esterilización municipal.",
    region: "Los Lagos",
    comuna: "Puerto Montt",
    address: "Urmeneta 720",
    phone: "+56 65 2288 190",
    gmbPlaceId: "demo-place-puertosur",
    gmbRating: 4.3,
    gmbReviewCount: 87,
    status: "pending",
    source: "osint",
    ingestion: {
      runId: "run-2026-09-02",
      confidenceScore: 0.72,
      reviewerNotes: "Falta confirmar RUT y horario. El teléfono no contesta en horario hábil.",
      raw: {
        fuente: "google_maps",
        nombre_detectado: "Veterinaria Puerto Sur",
        telefono_detectado: "+56652288190",
        categoria_gmb: "Veterinarian",
        horario_detectado: "L-V 9:00-19:00",
        rating: 4.3,
        reviews: 87,
      },
    },
  },
  {
    slug: "guarderia-kuni",
    name: "Guardería Kuni",
    categorySlug: "adiestramiento",
    tier: "emprendimiento",
    description:
      "Guardería de día con grupos reducidos por tamaño y carácter, informe diario con fotos y siesta obligatoria a mediodía.",
    differentiationTag: "Grupos de máximo seis perros",
    region: "Metropolitana de Santiago",
    comuna: "Ñuñoa",
    whatsapp: "+56 9 3322 6677",
    instagram: "guarderiakuni",
    status: "pending",
    source: "self_signup",
    ingestion: {
      runId: "autopostulacion",
      confidenceScore: 0.5,
      reviewerNotes: "Autopostulación. Falta verificar dirección del recinto y permiso municipal.",
      raw: { fuente: "formulario_sumar_negocio", declarado_por: "titular" },
    },
  },
  {
    slug: "arena-andina",
    name: "Arena Andina",
    categorySlug: "pet-shops",
    tier: "emprendimiento",
    description:
      "Arena sanitaria de origen nacional vendida en formato de 20 kilos con despacho mensual programado.",
    differentiationTag: "Suscripción mensual de arena",
    region: "Metropolitana de Santiago",
    comuna: "San Miguel",
    whatsapp: "+56 9 2211 4455",
    status: "pending",
    source: "osint",
    ingestion: {
      runId: "run-2026-09-02",
      confidenceScore: 0.61,
      reviewerNotes: "Solo tiene Instagram, sin sitio ni ficha de GMB. Verificar que siga operando.",
      raw: { fuente: "instagram", seguidores: 2140, ultima_publicacion: "2026-08-28" },
    },
  },
];

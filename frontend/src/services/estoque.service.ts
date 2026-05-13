import type { EstoqueItem, EstoqueItemPayload } from "@/types/estoque";

const STORAGE_KEY = "jhonycar_estoque_items_v1";

interface CatalogTemplate {
  prefix: string;
  peca: string;
  categoria: EstoqueItem["categoria"];
  fornecedor: string;
  precoUnitario: number;
  visual: EstoqueItem["visual"];
  minimo: number;
}

const baseItems: Array<Omit<EstoqueItem, "id" | "criadoEm" | "atualizadoEm">> = [
  {
    codigo: "BAT-001",
    peca: "Bateria Moura 60Ah",
    categoria: "Eletrica",
    fornecedor: "Moura",
    estoque: 10,
    minimo: 4,
    precoUnitario: 450,
    visual: "bateria",
  },
  {
    codigo: "ALT-002",
    peca: "Alternador Bosch 90A",
    categoria: "Eletrica",
    fornecedor: "Bosch",
    estoque: 5,
    minimo: 4,
    precoUnitario: 850,
    visual: "alternador",
  },
  {
    codigo: "MTR-003",
    peca: "Motor de Partida ZM",
    categoria: "Eletrica",
    fornecedor: "ZM",
    estoque: 2,
    minimo: 3,
    precoUnitario: 700,
    visual: "motor",
  },
  {
    codigo: "VEL-004",
    peca: "Velas de Ignicao NGK",
    categoria: "Ignicao",
    fornecedor: "NGK",
    estoque: 0,
    minimo: 3,
    precoUnitario: 25,
    visual: "vela",
  },
  {
    codigo: "CAB-005",
    peca: "Cabo de Bateria 25mm",
    categoria: "Eletrica",
    fornecedor: "Cablon",
    estoque: 15,
    minimo: 6,
    precoUnitario: 18,
    visual: "cabo",
  },
  {
    codigo: "FUZ-006",
    peca: "Fusivel Mini 10A",
    categoria: "Eletrica",
    fornecedor: "JCase",
    estoque: 20,
    minimo: 8,
    precoUnitario: 2,
    visual: "fusivel",
  },
  {
    codigo: "REL-007",
    peca: "Rele 5 Pinos 40A",
    categoria: "Eletrica",
    fornecedor: "Marilia",
    estoque: 8,
    minimo: 4,
    precoUnitario: 15,
    visual: "rele",
  },
  {
    codigo: "SEN-008",
    peca: "Sensor de Temperatura",
    categoria: "Injecao",
    fornecedor: "Bosch",
    estoque: 3,
    minimo: 4,
    precoUnitario: 75,
    visual: "sensor",
  },
  {
    codigo: "BOB-009",
    peca: "Bobina de Ignicao",
    categoria: "Ignicao",
    fornecedor: "NGK",
    estoque: 1,
    minimo: 4,
    precoUnitario: 120,
    visual: "bobina",
  },
  {
    codigo: "INT-010",
    peca: "Interruptor de Ignicao",
    categoria: "Eletrica",
    fornecedor: "Marilia",
    estoque: 4,
    minimo: 3,
    precoUnitario: 60,
    visual: "interruptor",
  },
];

const catalog: CatalogTemplate[] = [
  { prefix: "BAT", peca: "Bateria Heliar 70Ah", categoria: "Eletrica", fornecedor: "Heliar", precoUnitario: 520, visual: "bateria", minimo: 4 },
  { prefix: "ALT", peca: "Alternador Valeo 120A", categoria: "Eletrica", fornecedor: "Valeo", precoUnitario: 990, visual: "alternador", minimo: 3 },
  { prefix: "MTR", peca: "Motor de Arranque Bosch", categoria: "Eletrica", fornecedor: "Bosch", precoUnitario: 760, visual: "motor", minimo: 3 },
  { prefix: "VEL", peca: "Vela Iridium NGK", categoria: "Ignicao", fornecedor: "NGK", precoUnitario: 42, visual: "vela", minimo: 4 },
  { prefix: "CAB", peca: "Cabo de Vela Silicone", categoria: "Ignicao", fornecedor: "MTE", precoUnitario: 85, visual: "cabo", minimo: 5 },
  { prefix: "FUZ", peca: "Fusivel Maxi 40A", categoria: "Eletrica", fornecedor: "JCase", precoUnitario: 6, visual: "fusivel", minimo: 10 },
  { prefix: "REL", peca: "Rele Temporizador 12V", categoria: "Eletrica", fornecedor: "Marilia", precoUnitario: 38, visual: "rele", minimo: 5 },
  { prefix: "SEN", peca: "Sensor MAP", categoria: "Injecao", fornecedor: "Bosch", precoUnitario: 210, visual: "sensor", minimo: 3 },
  { prefix: "BOB", peca: "Bobina Caneta", categoria: "Ignicao", fornecedor: "Delphi", precoUnitario: 165, visual: "bobina", minimo: 3 },
  { prefix: "INT", peca: "Interruptor de Luz", categoria: "Eletrica", fornecedor: "Marilia", precoUnitario: 75, visual: "interruptor", minimo: 4 },
  { prefix: "CAB", peca: "Cabo Positivo 35mm", categoria: "Eletrica", fornecedor: "Cablon", precoUnitario: 29, visual: "cabo", minimo: 6 },
  { prefix: "SEN", peca: "Sensor de Rotacao", categoria: "Injecao", fornecedor: "Magneti", precoUnitario: 188, visual: "sensor", minimo: 4 },
];

function toISOWithOffset(daysAgo: number, minutesOffset = 0) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 9, 20 + minutesOffset, 0);
  return date.toISOString();
}

function normalizeImageUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function generateSeedData() {
  const seed: EstoqueItem[] = [];

  for (let i = 0; i < baseItems.length; i += 1) {
    const createdDaysAgo = i < 8 ? i : 10 + i;
    const updatedDaysAgo = Math.max(0, createdDaysAgo - 1);

    seed.push({
      id: i + 1,
      ...baseItems[i],
      criadoEm: toISOWithOffset(createdDaysAgo, i),
      atualizadoEm: toISOWithOffset(updatedDaysAgo, i + 5),
    });
  }

  const targetTotal = 128;
  let currentId = seed.length + 1;
  let prefixCounters = new Map<string, number>();

  for (const item of baseItems) {
    const prefix = item.codigo.split("-")[0];
    const current = Number(item.codigo.split("-")[1] ?? "0");
    prefixCounters.set(prefix, Math.max(prefixCounters.get(prefix) ?? 0, current));
  }

  while (seed.length < targetTotal) {
    const template = catalog[(seed.length - baseItems.length) % catalog.length];
    const sequence = (prefixCounters.get(template.prefix) ?? 10) + 1;
    prefixCounters.set(template.prefix, sequence);

    const stockPattern = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 24];
    const stock = stockPattern[(currentId * 3) % stockPattern.length];
    const priceBoost = ((currentId % 5) - 2) * 7.5;
    const price = Math.max(1, Number((template.precoUnitario + priceBoost).toFixed(2)));
    const createdDaysAgo = currentId <= 18 ? currentId - 10 : 35 + (currentId % 80);
    const updatedDaysAgo = Math.max(0, createdDaysAgo - (currentId % 4));

    seed.push({
      id: currentId,
      codigo: `${template.prefix}-${String(sequence).padStart(3, "0")}`,
      peca: template.peca,
      categoria: template.categoria,
      fornecedor: template.fornecedor,
      estoque: stock,
      minimo: template.minimo,
      precoUnitario: price,
      visual: template.visual,
      criadoEm: toISOWithOffset(createdDaysAgo, currentId % 35),
      atualizadoEm: toISOWithOffset(updatedDaysAgo, currentId % 45),
    });
    currentId += 1;
  }

  return seed;
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = generateSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as EstoqueItem[];
    if (!Array.isArray(parsed)) {
      throw new Error("invalid payload");
    }
    return parsed.map((item) => ({
      ...item,
      imagemUrl: normalizeImageUrl(item.imagemUrl),
    }));
  } catch {
    const seed = generateSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function persist(items: EstoqueItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function nextId(items: EstoqueItem[]) {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.id)) + 1;
}

export async function listEstoqueItems() {
  return [...loadFromStorage()].sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR"));
}

export async function createEstoqueItem(payload: EstoqueItemPayload) {
  const items = loadFromStorage();
  const now = new Date().toISOString();
  const normalizedPayload: EstoqueItemPayload = {
    ...payload,
    imagemUrl: normalizeImageUrl(payload.imagemUrl),
  };
  const created: EstoqueItem = {
    id: nextId(items),
    ...normalizedPayload,
    criadoEm: now,
    atualizadoEm: now,
  };
  persist([...items, created]);
  return created;
}

export async function updateEstoqueItem(id: number, payload: EstoqueItemPayload) {
  const items = loadFromStorage();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error("Item nao encontrado.");
  }

  const normalizedPayload: EstoqueItemPayload = {
    ...payload,
    imagemUrl: normalizeImageUrl(payload.imagemUrl),
  };

  const updated: EstoqueItem = {
    ...items[index],
    ...normalizedPayload,
    atualizadoEm: new Date().toISOString(),
  };

  items[index] = updated;
  persist(items);
  return updated;
}

export async function deleteEstoqueItem(id: number) {
  const items = loadFromStorage();
  persist(items.filter((item) => item.id !== id));
}

export async function registrarEntradaEstoque(id: number, quantidade: number) {
  if (quantidade <= 0) {
    throw new Error("Quantidade precisa ser maior que zero.");
  }

  const items = loadFromStorage();
  const target = items.find((item) => item.id === id);
  if (!target) {
    throw new Error("Item nao encontrado.");
  }

  target.estoque += quantidade;
  target.atualizadoEm = new Date().toISOString();
  persist(items);
  return target;
}

export async function registrarSaidaEstoque(id: number, quantidade: number) {
  if (quantidade <= 0) {
    throw new Error("Quantidade precisa ser maior que zero.");
  }

  const items = loadFromStorage();
  const target = items.find((item) => item.id === id);
  if (!target) {
    throw new Error("Item nao encontrado.");
  }
  if (quantidade > target.estoque) {
    throw new Error("Saida maior que o estoque atual.");
  }

  target.estoque -= quantidade;
  target.atualizadoEm = new Date().toISOString();
  persist(items);
  return target;
}

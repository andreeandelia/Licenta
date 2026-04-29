import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

const INVENTORY_INTENT_KEYWORDS = [
    "stock",
    "in stock",
    "availability",
    "available",
    "exista",
    "există",
    "aveti",
    "aveți",
    "stoc",
    "disponibil",
    "disponibile",
];

const INVENTORY_TOKEN_STOPWORDS = new Set([
    "is",
    "are",
    "in",
    "the",
    "a",
    "an",
    "for",
    "of",
    "to",
    "and",
    "or",
    "with",
    "ai",
    "am",
    "as",
    "si",
    "sau",
    "ca",
    "de",
    "la",
    "pe",
    "cu",
    "din",
    "exista",
    "există",
    "aveti",
    "aveți",
    "stoc",
    "stock",
    "disponibil",
    "disponibile",
    "vreau",
    "daca",
    "dacă",
    "please",
    "te",
    "rog",
    "puteti",
    "puteți",
    "putem",
    "mai",
    "imi",
    "îmi",
    "mi",
    "vrea",
]);

const FLORIST_SYSTEM_INSTRUCTION = `
You are Fleur, an expert florist for a premium flower shop.

Rules:
- Answer in the same language as the customer.
- Be elegant, warm, concise, and practical.
- Help customers choose flowers based on occasion, mood, budget, color palette, and delivery needs.
- Use ONLY the real inventory provided in the request.
- Never invent products, prices, discounts, stock, delivery details, or availability.
- Never recommend out-of-stock products.
- If a requested product is not available in the provided inventory, apologize and suggest available alternatives.
- If the customer asks about something unrelated to flowers, gently steer the conversation back to floral recommendations.
- When useful, include product names, prices, and why they fit the occasion.
`;

function normalizeForSearch(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function isInventoryQuestion(text) {
    const normalized = normalizeForSearch(text);

    return INVENTORY_INTENT_KEYWORDS.some((keyword) =>
        normalized.includes(normalizeForSearch(keyword)),
    );
}

function normalizeInventoryToken(token) {
    const mapped = {
        trandafir: "rose",
        trandafiri: "rose",
        trandafirii: "rose",
        rose: "rose",
        roses: "rose",

        lalea: "tulip",
        lalele: "tulip",
        tulip: "tulip",
        tulips: "tulip",

        crin: "lily",
        crini: "lily",
        lily: "lily",
        lilies: "lily",

        bujor: "peony",
        bujori: "peony",
        peony: "peony",
        peonies: "peony",

        ambalaj: "wrap",
        folie: "wrap",
        wrap: "wrap",
        wrapping: "wrap",

        felicitare: "card",
        card: "card",
        greeting: "card",
    };

    return mapped[token] || token;
}

function extractSearchTermsFromMessage(message) {
    const normalized = normalizeForSearch(message);

    return [
        ...new Set(
            normalized
                .split(/[^a-z0-9]+/g)
                .map((token) => token.trim())
                .filter((token) => token.length >= 3)
                .filter((token) => !INVENTORY_TOKEN_STOPWORDS.has(token))
                .map(normalizeInventoryToken),
        ),
    ].slice(0, 8);
}

async function getRelevantInventory(message) {
    const terms = extractSearchTermsFromMessage(message);

    const where = {
        stock: { gt: 0 },
    };

    if (terms.length > 0) {
        where.OR = terms.map((term) => ({
            name: {
                contains: term,
                mode: "insensitive",
            },
        }));
    }

    let items = await prisma.product.findMany({
        where,
        orderBy: [{ type: "asc" }, { name: "asc" }],
        take: 24,
        select: {
            id: true,
            name: true,
            type: true,
            description: true,
            price: true,
            stock: true,
            color: true,
        },
    });

    // Dacă termenii extrași nu au găsit nimic, oferim totuși câteva produse disponibile,
    // ca AI-ul să poată recomanda alternative reale.
    if (items.length === 0) {
        items = await prisma.product.findMany({
            where: {
                stock: { gt: 0 },
            },
            orderBy: [{ type: "asc" }, { name: "asc" }],
            take: 24,
            select: {
                id: true,
                name: true,
                type: true,
                description: true,
                price: true,
                stock: true,
                color: true,
            },
        });
    }

    return items.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        description: item.description || "",
        price: Number(item.price),
        stock: item.stock,
        color: item.color || "",
    }));
}

async function checkInventory(flowerName) {
    const search = String(flowerName || "").trim();

    if (!search) {
        return {
            query: "",
            found: false,
            totalMatches: 0,
            items: [],
        };
    }

    const items = await prisma.product.findMany({
        where: {
            stock: { gt: 0 },
            name: {
                contains: search,
                mode: "insensitive",
            },
        },
        orderBy: {
            name: "asc",
        },
        take: 10,
        select: {
            id: true,
            name: true,
            stock: true,
            price: true,
            type: true,
            color: true,
        },
    });

    return {
        query: search,
        found: items.length > 0,
        totalMatches: items.length,
        items: items.map((item) => ({
            id: item.id,
            name: item.name,
            stock: item.stock,
            price: Number(item.price),
            type: item.type,
            color: item.color,
        })),
    };
}

async function checkInventoryFromMessage(message) {
    const rawMessage = String(message || "").trim();
    const searchTerms = extractSearchTermsFromMessage(rawMessage);
    const candidates = searchTerms.length ? searchTerms : [rawMessage];

    for (const term of candidates) {
        const inventory = await checkInventory(term);

        if (inventory.found) {
            return inventory;
        }
    }

    return {
        query: searchTerms[0] || rawMessage,
        found: false,
        totalMatches: 0,
        items: [],
    };
}

function buildInventoryFallbackReply(inventory) {
    if (!inventory?.found || !Array.isArray(inventory.items) || inventory.items.length === 0) {
        return `Momentan nu am găsit produse disponibile pentru "${inventory?.query || "cererea ta"}". Poți încerca un nume mai specific, de exemplu rose, tulip, lily sau peony.`;
    }

    const topItems = inventory.items.slice(0, 5);

    const lines = topItems.map(
        (item) =>
            `- ${item.name} (${item.stock} în stoc, ${Number(item.price).toFixed(2)} RON)`,
    );

    return `Da, am găsit ${inventory.totalMatches} produs(e) disponibile pentru "${inventory.query}":\n${lines.join("\n")}`;
}

function buildHistoryTranscript(history) {
    if (!Array.isArray(history)) return "";

    return history
        .slice(-8)
        .map((entry) => {
            const role =
                entry?.role === "assistant" || entry?.role === "model"
                    ? "Assistant"
                    : "Customer";

            const text = String(entry?.content ?? entry?.text ?? "").trim();

            if (!text) return null;

            return `${role}: ${text}`;
        })
        .filter(Boolean)
        .join("\n");
}

function buildInventoryText(inventoryItems) {
    if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
        return "No in-stock products are currently available.";
    }

    return inventoryItems
        .map((item) => {
            const details = [
                `id: ${item.id}`,
                `name: ${item.name}`,
                `type: ${item.type}`,
                `price: ${item.price.toFixed(2)} RON`,
                `stock: ${item.stock}`,
            ];

            if (item.color) details.push(`color: ${item.color}`);
            if (item.description) details.push(`description: ${item.description}`);

            return `- ${details.join(", ")}`;
        })
        .join("\n");
}

function buildOpenAIInput({ message, history, inventoryItems, context }) {
    const historyTranscript = buildHistoryTranscript(history);
    const inventoryText = buildInventoryText(inventoryItems);

    const bouquetContext = context?.bouquet
        ? JSON.stringify(context.bouquet, null, 2)
        : "No bouquet context provided.";

    const builderContext = {
        currentStep: context?.currentStep || "",
        currentProductType: context?.currentProductType || "",
        filters: context?.filters || {},
    };

    return `
REAL INVENTORY FROM DATABASE:
${inventoryText}

CURRENT BOUQUET BUILDER CONTEXT:
${JSON.stringify(builderContext, null, 2)}

CURRENT BOUQUET SELECTED BY CUSTOMER:
${bouquetContext}

PREVIOUS CONVERSATION:
${historyTranscript || "No previous conversation."}

CURRENT CUSTOMER MESSAGE:
${message}

Answer the current customer using only the real inventory above and the bouquet context above.
If the customer already selected products, take them into account.
Do not say that you added products to the cart or bouquet, because you cannot perform that action yet.
`;
}

function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return null;
    }

    return new OpenAI({ apiKey });
}

async function chatWithFlorist(req, res, next) {
    try {
        const message = String(req.body?.message || "").trim();
        const history = Array.isArray(req.body?.history) ? req.body.history : [];
        const context =
            req.body?.context && typeof req.body.context === "object"
                ? req.body.context
                : {};

        if (!message) {
            return res.status(400).json({ error: "message is required" });
        }

        const client = getOpenAIClient();

        if (!client) {
            if (isInventoryQuestion(message)) {
                const inventory = await checkInventoryFromMessage(message);

                return res.status(200).json({
                    reply: buildInventoryFallbackReply(inventory),
                    fallbackMode: "LOCAL_INVENTORY",
                });
            }

            return res.status(500).json({
                error: "OPENAI_API_KEY is not configured on the server",
            });
        }

        const inventoryItems = await getRelevantInventory(message);

        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
            instructions: FLORIST_SYSTEM_INSTRUCTION,
            input: buildOpenAIInput({
                message,
                history,
                inventoryItems,
                context,
            }),
        });

        const reply = String(response.output_text || "").trim();

        return res.status(200).json({
            reply:
                reply ||
                "Îmi pare rău, asistentul florar nu a putut genera un răspuns acum. Te rog încearcă din nou.",
        });
    } catch (err) {
        const message = String(err?.message || "");
        const isQuotaOrRateLimit =
            err?.status === 429 || /quota|rate limit|too many requests/i.test(message);

        if (isQuotaOrRateLimit) {
            if (isInventoryQuestion(req.body?.message)) {
                const inventory = await checkInventoryFromMessage(req.body?.message);

                return res.status(200).json({
                    reply: buildInventoryFallbackReply(inventory),
                    fallbackMode: "LOCAL_INVENTORY",
                });
            }

            return res.status(429).json({
                error:
                    "Florist assistant is temporarily unavailable due to API limits. Please try again shortly.",
                code: "AI_RATE_LIMITED",
            });
        }

        if (err?.status) {
            return res.status(err.status).json({
                error: err.message || "OpenAI request failed",
            });
        }

        return next(err);
    }
}

export { chatWithFlorist, checkInventory };
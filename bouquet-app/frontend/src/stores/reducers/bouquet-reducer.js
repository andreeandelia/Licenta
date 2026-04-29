function normalizeLineItems(list) {
    if (!Array.isArray(list)) return [];

    return list
        .filter((item) => item && item.id != null)
        .map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            qty: Math.max(1, Number(item.qty) || 1),
            imageUrl: item.imageUrl || "",
        }));
}

function normalizeWrapping(wrapping) {
    if (!wrapping || wrapping.id == null) return null;

    return {
        id: wrapping.id,
        name: wrapping.name,
        price: Number(wrapping.price) || 0,
        imageUrl: wrapping.imageUrl || "",
    };
}
const initialState = {
    flowers: [],     // [{ id, name, price, qty }]
    wrapping: null,  // { id, name, price } sau null
    accessories: [], // [{ id, name, price, qty }]
    greetingCardMessage: "",
};

function addOrInc(list, product) {
    const isGreetingCard = String(product?.name || "")
        .trim()
        .toLowerCase()
        .includes("greeting card");

    const idx = list.findIndex((x) => x.id === product.id);
    if (idx >= 0) {
        if (isGreetingCard) {
            return list;
        }

        const copy = [...list];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
    }
    return [
        ...list,
        {
            id: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
            imageUrl: product.imageUrl || "",
        },
    ];
}

export default function bouquetReducer(state = initialState, action) {
    switch (action.type) {
        case "BOUQUET_ADD": {
            const { product, productType } = action.payload;

            if (productType === "FLOWER") {
                return { ...state, flowers: addOrInc(state.flowers, product) };
            }
            if (productType === "ACCESSORY") {
                return { ...state, accessories: addOrInc(state.accessories, product) };
            }
            if (productType === "WRAPPING") {
                return {
                    ...state,
                    wrapping: {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl || "",
                    },
                };
            }
            return state;
        }

        case "BOUQUET_REMOVE": {
            const { id, productType } = action.payload;
            if (productType === "FLOWER") {
                return { ...state, flowers: state.flowers.filter((x) => x.id !== id) };
            }
            if (productType === "ACCESSORY") {
                return { ...state, accessories: state.accessories.filter((x) => x.id !== id) };
            }
            if (productType === "WRAPPING") {
                return { ...state, wrapping: null };
            }
            return state;
        }

        case "BOUQUET_QTY": {
            const { id, productType, delta } = action.payload;
            const update = (list) =>
                list
                    .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
                    .filter((x) => x.qty > 0);

            if (productType === "FLOWER") return { ...state, flowers: update(state.flowers) };
            if (productType === "ACCESSORY") return { ...state, accessories: update(state.accessories) };
            return state;
        }

        case "BOUQUET_CLEAR":
            return initialState;

        case "BOUQUET_SET_GREETING_CARD_MESSAGE":
            return {
                ...state,
                greetingCardMessage: String(action.payload || ""),
            };

        case "BOUQUET_SET": {
            const payload = action.payload || {};

            return {
                flowers: normalizeLineItems(payload.flowers),
                accessories: normalizeLineItems(payload.accessories),
                wrapping: normalizeWrapping(payload.wrapping),
                greetingCardMessage: String(payload.greetingCardMessage || ""),
            };
        }

        default:
            return state;
    }
}
export const addToBouquet = (product, productType) => ({
    type: "BOUQUET_ADD",
    payload: { product, productType },
});

export const removeFromBouquet = (id, productType) => ({
    type: "BOUQUET_REMOVE",
    payload: { id, productType },
});

export const changeQty = (id, productType, delta) => ({
    type: "BOUQUET_QTY",
    payload: { id, productType, delta },
});

export const clearBouquet = () => ({
    type: "BOUQUET_CLEAR",
});
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import authReducer from './reducers/auth-reducer';
import productReducer from './reducers/product-reducer';
import bouquetReducer from './reducers/bouquet-reducer';
import wishlistReducer from './reducers/wishlist-reducer';
import cartReducer from './reducers/cart-reducer';

const rootReducer = combineReducers({
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    bouquet: bouquetReducer,
    wishlist: wishlistReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
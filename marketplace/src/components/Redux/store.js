import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import cartReducer from "./cartSlice";
import productReducer from "./productSlice";
import categoryReducer from "./categorySlice";
import orderReducer from "./orderSlice";

export const store = configureStore({
    reducer: {user: userReducer,
             cart: cartReducer,
             product: productReducer,
             category: categoryReducer,
             order: orderReducer
    }
});

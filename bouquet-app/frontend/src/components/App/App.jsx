import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadMe } from "../../stores/actions/auth-actions";
import AuthForm from "../AuthForm/AuthForm";
import HomePage from "../HomePage/HomePage";
import BuilderPage from "../BuilderPage/BuilderPage";
import WishlistPage from "../WishlistPage/WishlistPage";
import SettingsPage from "../SettingsPage/SettingsPage";
import OrdersPage from "../OrdersPage/OrdersPage";
import CartPage from "../CartPage/CartPage";
import HelpInfoPage from "../HelpInfoPage/HelpInfoPage";
import CheckoutPage from "../CheckoutPage/CheckoutPage";
import PaymentSuccess from "../PaymentSuccess/PaymentSuccess";
import PaymentFailure from "../PaymentFailure/PaymentFailure";
import CODSuccess from "../CODSuccess/CODSuccess";
import EmailVerificationSuccess from "../EmailVerificationSuccess/EmailVerificationSuccess";
import EmailVerificationFailure from "../EmailVerificationFailure/EmailVerificationFailure";
import ForgotPassword from "../ForgotPassword/ForgotPassword";
import ResetPassword from "../ResetPassword/ResetPassword";
import AdminLayout from "../Admin/AdminLayout";
import AdminDashboard from "../Admin/AdminDashboard";
import AdminProducts from "../Admin/AdminProducts";
import AdminOrders from "../Admin/AdminOrders";
import AdminPromoCodes from "../Admin/AdminPromoCodes";

function App() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    dispatch(loadMe());
  }, [dispatch]);

  if (loading) {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={user ? (isAdmin ? "/admin/dashboard" : "/home") : "/auth"}
            replace
          />
        }
      />
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate to={isAdmin ? "/admin/dashboard" : "/home"} replace />
          ) : (
            <AuthForm initialMode="login" />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/builder" element={<BuilderPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-failure" element={<PaymentFailure />} />
      <Route path="/cod-success" element={<CODSuccess />} />
      <Route
        path="/email-verification-success"
        element={<EmailVerificationSuccess />}
      />
      <Route
        path="/email-verification-failure"
        element={<EmailVerificationFailure />}
      />
      <Route path="/help-info" element={<HelpInfoPage />} />
      <Route
        path="/orders"
        element={user ? <OrdersPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/wishlist"
        element={user ? <WishlistPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/settings"
        element={user ? <SettingsPage /> : <Navigate to="/auth" replace />}
      />
      <Route
        path="/admin"
        element={
          user ? (
            isAdmin ? (
              <AdminLayout />
            ) : (
              <Navigate to="/home" replace />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="promo-codes" element={<AdminPromoCodes />} />
      </Route>
    </Routes>
  );
}

export default App;

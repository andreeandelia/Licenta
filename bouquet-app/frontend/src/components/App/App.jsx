import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadMe } from "../../stores/actions/auth-actions";
import AuthForm from "../AuthForm/AuthForm";
import HomePage from "../HomePage/HomePage";
import BuilderPage from "../BuilderPage/BuilderPage";
import WishlistPage from "../WishlistPage/WishlistPage";

function App() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

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
        element={<Navigate to={user ? "/home" : "/auth"} replace />}
      />
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate to="/home" replace />
          ) : (
            <AuthForm initialMode="login" />
          )
        }
      />
      <Route path="/home" element={<HomePage />} />
      <Route path="/builder" element={<BuilderPage />} />
      <Route
        path="/wishlist"
        element={user ? <WishlistPage /> : <Navigate to="/auth" replace />}
      />
    </Routes>
  );
}

export default App;

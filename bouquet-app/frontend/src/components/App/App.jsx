import { Routes, Route } from "react-router-dom";
import AuthForm from "../AuthForm/AuthForm";
import HomePage from "../HomePage";

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthForm initialMode="login" />} />
      <Route path="/home" element={<HomePage />} />
    </Routes>
  );
}

export default App;

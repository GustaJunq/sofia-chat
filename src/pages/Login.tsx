import LoginScreen from "@/components/LoginScreen";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("sof_token");
    if (token) {
      navigate("/chats", { replace: true });
    }
  }, [navigate]);

  const handleLogin = useCallback((token: string) => {
    navigate("/chats");
  }, [navigate]);

  return (
    <LoginScreen
      onLogin={handleLogin}
      onSwitchToRegister={() => navigate("/register")}
    />
  );
};

export default Login;

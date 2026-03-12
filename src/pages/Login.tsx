import LoginScreen from "@/components/LoginScreen";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = useCallback((token: string) => {
    navigate("/chats");
  }, [navigate]);

  return (
    <LoginScreen
      onLogin={handleLogin}
      onSwitchToRegister={() => navigate("/register")}
      onSkip={() => navigate("/chats")}
    />
  );
};

export default Login;

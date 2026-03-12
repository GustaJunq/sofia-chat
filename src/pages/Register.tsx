import RegisterScreen from "@/components/RegisterScreen";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

const Register = () => {
  const navigate = useNavigate();

  const handleLogin = useCallback((token: string) => {
    navigate("/chats");
  }, [navigate]);

  return (
    <RegisterScreen
      onLogin={handleLogin}
      onSwitchToLogin={() => navigate("/login")}
      onSkip={() => navigate("/chats")}
    />
  );
};

export default Register;

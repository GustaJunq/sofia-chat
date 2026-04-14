import RegisterScreen from "@/components/RegisterScreen";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";

const Register = () => {
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
    <RegisterScreen
      onLogin={handleLogin}
      onSwitchToLogin={() => navigate("/login")}
    />
  );
};

export default Register;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("sof_token");

  useEffect(() => {
    if (token) {
      navigate("/chats", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  return null;
};

export default Index;

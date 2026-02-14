import { useNavigate } from "react-router-dom";
import { Button } from "react-aria-components";
import { supabase } from "@/lib/supabase";

export function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <Button
      onPress={handleLogout}
      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      Logout
    </Button>
  );
}

import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { History as HistoryIcon, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };
  
  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary flex items-center gap-2">
              FlashCard Agent ☕
            </h1>
            <p className="text-xs md:text-sm lg:text-base text-muted-foreground text-center md:text-left">
              Learn Anything, Anywhere — Smart Flashcards & Adaptive Quizzes
            </p>
          </div>
          
          <nav className="flex items-center justify-center gap-2">
            {isLoggedIn && (
              <>
                <Link
                  to="/"
                  className={cn(
                    "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
                    location.pathname === "/"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <Link
                  to="/history"
                  className={cn(
                    "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm md:text-base",
                    location.pathname === "/history"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  <HistoryIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
            {!isLoggedIn && location.pathname !== "/auth" && (
              <Button
                onClick={() => navigate("/auth")}
                variant="default"
                size="sm"
              >
                Login
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

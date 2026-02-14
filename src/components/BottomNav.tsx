import { Home, Grid3X3, PlusCircle, Megaphone, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/sections", icon: Grid3X3, label: "Sections" },
  { path: "/create", icon: PlusCircle, label: "Post" },
  { path: "/official", icon: Megaphone, label: "Official" },
  { path: "/profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const isCreate = tab.path === "/create";

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all",
                isActive ? "text-primary" : "text-muted-foreground",
                isCreate && "relative"
              )}
            >
              {isCreate ? (
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center -mt-4 shadow-lg">
                  <PlusCircle className="h-6 w-6 text-primary-foreground" />
                </div>
              ) : (
                <>
                  <tab.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

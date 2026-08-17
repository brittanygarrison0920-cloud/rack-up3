import React, { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shirt, Plus, Sparkles, Heart, MessageCircle, QrCode, User, BarChart3, BookMarked, Gem, Package, ArrowLeft, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "My Closet",
    url: createPageUrl("Closet"),
    icon: Shirt,
  },
  {
    title: "Add Item",
    url: createPageUrl("AddItem"),
    icon: Plus,
  },
  {
    title: "QR Scanner",
    url: createPageUrl("QRScanner"),
    icon: QrCode,
  },
  {
    title: "Outfits",
    url: createPageUrl("Outfits"),
    icon: Sparkles,
  },
  {
    title: "Outfit Calendar",
    url: "/outfit-calendar",
    icon: CalendarDays,
  },
  {
    title: "AI Stylist Chat",
    url: createPageUrl("Stylist"),
    icon: MessageCircle,
  },
  {
    title: "Loans",
    url: createPageUrl("Loans"),
    icon: Heart,
  },
  {
    title: "Lookbook",
    url: createPageUrl("Lookbook"),
    icon: BookMarked,
  },
  {
    title: "Insights",
    url: createPageUrl("Insights"),
    icon: BarChart3,
  },
  {
    title: "Style Profile",
    url: createPageUrl("Profile"),
    icon: User,
  },
  {
    title: "Accessorize Me ✨",
    url: "/AccessorizeMe",
    icon: Gem,
  },
  {
    title: "Accessory Library",
    url: "/AccessoryLibrary",
    icon: BookMarked,
  },
  {
    title: "Bulk Upload",
    url: "/BulkUpload",
    icon: Package,
  },
];

const mobileNavItems = [
  { title: "Closet", url: createPageUrl("Closet"), icon: Shirt, subRoutes: ["/QRScanner"] },
  { title: "Add", url: createPageUrl("AddItem"), icon: Plus, subRoutes: ["/BulkUpload"] },
  { title: "Outfits", url: createPageUrl("Outfits"), icon: Sparkles, subRoutes: ["/outfits/build", "/outfit-calendar", "/AccessorizeMe", "/AccessoryLibrary", "/Lookbook"] },
  { title: "Stylist", url: createPageUrl("Stylist"), icon: MessageCircle, subRoutes: [] },
  { title: "Loans", url: createPageUrl("Loans"), icon: Heart, subRoutes: [] },
  { title: "Profile", url: createPageUrl("Profile"), icon: User, subRoutes: ["/Insights"] },
];

const getTabUrlForPath = (path) => {
  for (const item of mobileNavItems) {
    if (item.url === path) return item.url;
    if (item.subRoutes?.includes(path)) return item.url;
  }
  return null;
};

function NavigationContent() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    // Close mobile sidebar when a link is clicked
    setOpenMobile(false);
  };

  return (
    <>
      <SidebarHeader className="border-b border-purple-100 p-6">
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/68fdadb528d398b34986e286/5716bb4b8_Untitleddesignpng3.PNG"
            alt="Logo"
            className="w-10 h-10 rounded-2xl shadow-lg object-cover"
          />
          <div>
            <h2 className="font-bold text-xl">
              RackUp
            </h2>
            <p className="text-xs text-slate-500">Style Curator</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`mb-1 transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-900 to-purple-300 text-white shadow-lg' 
                          : 'hover:bg-purple-50 text-slate-700'
                      }`}
                    >
                      <Link 
                        to={item.url} 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        onClick={handleLinkClick}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/" || mobileNavItems.some(item => item.url === location.pathname);

  const tabLastPaths = useRef({});

  useEffect(() => {
    const activeTabUrl = getTabUrlForPath(location.pathname);
    if (activeTabUrl) {
      tabLastPaths.current[activeTabUrl] = location.pathname;
    }
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rochester&family=Jost:wght@200&display=swap');
        
        :root {
          --deep-purple: #5B21B6;
          --teal: #14B8A6;
          --navy: #1E293B;
          --gold: #F59E0B;
          --silver: #94A3B8;
        }
        
        * {
          font-family: 'Jost', sans-serif;
          font-weight: 200;
        }
        
        h1, h2 {
          font-family: 'Rochester', cursive;
          background-image: linear-gradient(to right, #3b0764, #c084fc) !important;
          background-clip: text !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          font-weight: 700 !important;
        }
        
        h3 {
          font-family: 'Rochester', cursive;
          background-image: linear-gradient(to right, #3b0764, #c084fc) !important;
          background-clip: text !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          font-weight: 700 !important;
        }
      `}</style>
      <div className="h-screen flex w-full overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar className="border-r border-purple-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <NavigationContent />
        </Sidebar>

        <main className="flex-1 flex flex-col">
          {/* Mobile Top Bar */}
          <header
            className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-purple-100 dark:border-slate-800"
            style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
          >
            <div className="flex items-center gap-2">
              {!isHome && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-2 rounded-lg hover:bg-purple-50 active:scale-95 transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-purple-700" />
                </button>
              )}
              <img
                src="https://media.base44.com/images/public/68fdadb528d398b34986e286/5716bb4b8_Untitleddesignpng3.PNG"
                alt="Logo"
                className="w-8 h-8 rounded-xl shadow-md object-cover"
              />
              <h2 className="font-bold text-lg">RackUp</h2>
            </div>
            <SidebarTrigger className="p-2 rounded-lg hover:bg-purple-50 [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-purple-700" />
          </header>

          <div className="flex-1 overflow-auto min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Tab Bar */}
          <nav
            className="md:hidden sticky bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-purple-100 dark:border-slate-800 flex items-stretch justify-around"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {mobileNavItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className="relative flex flex-col items-center justify-center py-2 px-1 flex-1 transition-colors"
                  onClick={(e) => {
                    const targetPath = tabLastPaths.current[item.url] || item.url;
                    if (location.pathname === targetPath) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      const scroller = e.currentTarget.closest('main')?.querySelector('.overflow-auto');
                      if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
                    } else if (targetPath !== item.url) {
                      e.preventDefault();
                      navigate(targetPath);
                    }
                  }}
                >
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-purple-900 to-purple-300 rounded-full" />
                  )}
                  <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-purple-700' : 'text-slate-400'}`} />
                  <span className={`text-[10px] ${isActive ? 'text-purple-700 font-semibold' : 'text-slate-400'}`}>
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </main>
      </div>
    </SidebarProvider>
  );
}
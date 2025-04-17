import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import StorageProgress from "@/components/storage/StorageProgress";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const [location, setLocation] = useLocation();
  
  // Get user info for storage usage
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    }
  });
  
  // Navigation items
  const navItems = [
    { icon: "home", label: "Home", path: "/" },
    { icon: "home", label: "My Files", path: "/" },
  ];
  
  return (
    <aside className={cn("w-64 bg-white shadow-md overflow-y-auto", className)}>
      <div className="p-5 border-b">
        <h1 className="text-2xl font-bold text-primary">CloudStore</h1>
      </div>
      
      <nav className="py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.path);
                }}
                className={cn(
                  "flex items-center px-5 py-3",
                  location === item.path
                    ? "text-primary bg-blue-50 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <span className="w-6 flex justify-center">
                  {item.icon === "home" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  )}
                  {item.icon === "file" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  )}
                  {item.icon === "share-nodes" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  )}
                  {item.icon === "star" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  )}
                  {item.icon === "trash-can" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  )}
                </span>
                <span className="ml-2">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="px-5 py-4 mt-2">
          <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">Storage</h3>
          <StorageProgress
            used={user?.storageUsed || 0}
            total={user?.storageLimit || 104857600} // Default 100MB
          />
        </div>
      </nav>
    </aside>
  );
}

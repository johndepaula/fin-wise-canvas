import { LayoutDashboard, Receipt, User, LogOut, Wallet, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Meus Registros", url: "/registros", icon: Receipt },
  { title: "Contas", url: "/contas", icon: Wallet },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-6">
        <div className="flex items-center gap-2.5 px-4 mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-foreground text-lg tracking-tight">FinWise</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-accent/60 transition-colors duration-150"
                      activeClassName="bg-accent text-foreground font-medium"
                    >
                      <item.icon className="mr-2.5 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <Separator className="mb-3 bg-border/50" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/configuracoes"
                className="hover:bg-accent/60 transition-colors duration-150"
                activeClassName="bg-accent text-foreground font-medium"
              >
                <Settings className="mr-2.5 h-4 w-4" />
                {!collapsed && <span>Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/perfil"
                className="hover:bg-accent/60 transition-colors duration-150"
                activeClassName="bg-accent text-foreground font-medium"
              >
                <User className="mr-2.5 h-4 w-4" />
                {!collapsed && <span>Meu Perfil</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="hover:bg-accent/60 text-muted-foreground transition-colors duration-150 cursor-pointer"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2.5 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

import { LayoutDashboard, Receipt, User, LogOut, Wallet, Settings, Calculator } from "lucide-react";
import { CalculatorModal } from "@/components/Calculator";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar } from
"@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const mainItems = [
{ title: "Dashboard", url: "/", icon: LayoutDashboard },
{ title: "Meus Registros", url: "/registros", icon: Receipt },
{ title: "Contas", url: "/contas", icon: Wallet }];


export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const closeMobile = useCallback(() => setOpenMobile(false), [setOpenMobile]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-4">
        <div className="px-4 mb-2 flex justify-center">
          <img
            src="/logo.png"
            alt="Logo"
            className={collapsed ? "h-7 w-auto object-contain" : "h-10 w-auto object-contain"}
          />
        </div>
        <Separator className="mb-3 mx-4 bg-border/50" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) =>
              <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                    to={item.url}
                    end={item.url === "/"}
                    className="hover:bg-accent/60 transition-colors duration-150"
                    activeClassName="bg-accent text-foreground font-medium"
                    onClick={closeMobile}>
                    
                      <item.icon className="mr-2.5 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-4">
        <div className="flex justify-center mb-1">
          <CalculatorModal />
        </div>
        <Separator className="mb-3 bg-border/50" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/configuracoes"
                className="hover:bg-accent/60 transition-colors duration-150"
                activeClassName="bg-accent text-foreground font-medium"
                onClick={closeMobile}>
                
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
                onClick={closeMobile}>
                
                <User className="mr-2.5 h-4 w-4" />
                {!collapsed && <span>Meu Perfil</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="hover:bg-accent/60 text-muted-foreground transition-colors duration-150 cursor-pointer"
              onClick={handleSignOut}>
              
              <LogOut className="mr-2.5 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>);

}

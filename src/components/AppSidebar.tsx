import { LayoutDashboard, Receipt, User, LogOut, Wallet, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = profile?.display_name || email.split("@")[0];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-6">
        <div className="flex items-center gap-2.5 px-4 mb-4">
          <img

            alt="Finplex Logo"
            className="h-14 w-auto shrink-0 mx-0 text-base border-2 object-scale-down"
            onError={(e) => {
              // Fallback visual case the logo isn't uploaded yet
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<div class="h-14 w-14 rounded-lg bg-primary flex items-center justify-center shrink-0"><span class="text-primary-foreground font-bold text-2xl">F</span></div>');
            }} src="/lovable-uploads/b9e8ae88-1447-4ec2-bec6-a850774faa0a.png" />
          
          {!collapsed &&
          <span className="font-semibold text-foreground text-lg tracking-tight">​</span>
          }
        </div>

        {/* Profile block */}
        <div className="flex items-center gap-2.5 px-4 mb-4">
          <Avatar className="h-8 w-8 shrink-0">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
            <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed &&
          <span className="text-sm text-foreground truncate">{displayName}</span>
          }
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
                    activeClassName="bg-accent text-foreground font-medium">
                    
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
        <Separator className="mb-3 bg-border/50" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/configuracoes"
                className="hover:bg-accent/60 transition-colors duration-150"
                activeClassName="bg-accent text-foreground font-medium">
                
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
                activeClassName="bg-accent text-foreground font-medium">
                
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
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Clock,
  CalendarDays,
  FileText,
  Users,
  UserCircle,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  if (!profile) return null;

  const items: NavItem[] =
    profile.role === "employer"
      ? [
          { href: "/funcionarios", label: "Equipe", icon: <Users className="h-5 w-5" /> },
          { href: "/historico", label: "Histórico", icon: <CalendarDays className="h-5 w-5" /> },
          { href: "/fechamento", label: "Fechamento", icon: <FileText className="h-5 w-5" /> },
          { href: "/perfil", label: "Perfil", icon: <UserCircle className="h-5 w-5" /> },
        ]
      : [
          { href: "/ponto", label: "Ponto", icon: <Clock className="h-5 w-5" /> },
          { href: "/historico", label: "Histórico", icon: <CalendarDays className="h-5 w-5" /> },
          { href: "/fechamento", label: "Fechamento", icon: <FileText className="h-5 w-5" /> },
          { href: "/perfil", label: "Perfil", icon: <UserCircle className="h-5 w-5" /> },
        ];

  return (
    <nav className="sticky bottom-0 z-50 border-t bg-background safe-area-inset-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs ${
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

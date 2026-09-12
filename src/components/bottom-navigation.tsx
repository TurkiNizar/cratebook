"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CollectionIcon,
  HeartIcon,
  PersonIcon,
  PlusIcon,
} from "@/components/icons";

export function BottomNavigation() {
  const pathname = usePathname();
  const destinations = [
    { href: "/collection", label: "Collection", icon: <CollectionIcon /> },
    { href: "/wishlist", label: "Wishlist", icon: <HeartIcon /> },
    {
      href: "/add",
      label: "Add",
      icon: <PlusIcon width={20} height={20} />,
    },
    { href: "/settings", label: "Profile", icon: <PersonIcon /> },
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {destinations.map(({ href, icon, label }) => {
        const isAdd = href === "/add";
        const isCurrent = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            className={isAdd ? "add-nav" : undefined}
            href={href}
            aria-current={isCurrent ? "page" : undefined}
            key={href}
          >
            <span
              className={
                isAdd
                  ? "bottom-nav-icon bottom-nav-add-icon"
                  : "bottom-nav-icon"
              }
            >
              {icon}
            </span>
            <span className="bottom-nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

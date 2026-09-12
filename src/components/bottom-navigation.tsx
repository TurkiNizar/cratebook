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
      icon: (
        <span className="bottom-nav-add-icon">
          <PlusIcon width={20} height={20} />
        </span>
      ),
      className: "add-nav",
    },
    { href: "/settings", label: "Profile", icon: <PersonIcon /> },
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {destinations.map(({ className, href, icon, label }) => {
        const isCurrent = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            className={className}
            href={href}
            aria-current={isCurrent ? "page" : undefined}
            key={href}
          >
            {icon}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

import Link from "next/link";

import {
  CollectionIcon,
  HeartIcon,
  PersonIcon,
  PlusIcon,
} from "@/components/icons";

export function BottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="Collection navigation">
      <Link href="/collection">
        <CollectionIcon />
        Collection
      </Link>
      <Link href="/wishlist">
        <HeartIcon />
        Wishlist
      </Link>
      <Link className="add-nav" href="/add" aria-label="Add a record">
        <PlusIcon width={27} height={27} />
      </Link>
      <Link href="/settings">
        <PersonIcon />
        Profile
      </Link>
    </nav>
  );
}

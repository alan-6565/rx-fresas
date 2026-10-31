"use client";

import { createContext, useContext } from "react";
import { DEFAULT_INFO, socialLinks, type SocialLinks } from "@/lib/business";

// The social links and contact info, loaded once by the site layout so the
// navbar, footer and contact page all show the same, current ones.

const Ctx = createContext<SocialLinks>(socialLinks(DEFAULT_INFO));

export function BusinessProvider({ links, children }: { links: SocialLinks; children: React.ReactNode }) {
  return <Ctx.Provider value={links}>{children}</Ctx.Provider>;
}

export const useBusiness = () => useContext(Ctx);

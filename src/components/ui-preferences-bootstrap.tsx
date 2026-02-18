"use client";

import { useEffect } from "react";

export function UiPreferencesBootstrap() {
  useEffect(() => {
    const saved = localStorage.getItem("cl:display:density") ?? "comfortable";
    document.body.dataset.density = saved;
  }, []);

  return null;
}

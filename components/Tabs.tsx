"use client";

import { TabConfig } from "@/lib/types";

export function Tabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: TabConfig[];
  activeTab: string;
  onChange: (tabId: string) => void;
}) {
  return (
    <div className="flex gap-6 px-6 mt-5 border-b border-beige overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`pb-2.5 text-[11px] tracking-[0.1em] uppercase whitespace-nowrap ${
            activeTab === tab.id
              ? "text-brown border-b-2 border-caramel"
              : "text-taupe"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

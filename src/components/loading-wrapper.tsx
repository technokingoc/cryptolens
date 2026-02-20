"use client";

import { ReactNode } from "react";
import { SkeletonLoader, CardSkeleton, HoldingsTableSkeleton, ProposalCardSkeleton } from "./skeleton-loader";

interface LoadingWrapperProps {
  isLoading: boolean;
  skeleton: "card" | "table" | "proposal" | "custom" | ReactNode;
  children: ReactNode;
  count?: number;
}

export function LoadingWrapper({ isLoading, skeleton, children, count = 1 }: LoadingWrapperProps) {
  if (!isLoading) return <>{children}</>;

  switch (skeleton) {
    case "card":
      return (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      );
    case "table":
      return <HoldingsTableSkeleton />;
    case "proposal":
      return (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <ProposalCardSkeleton key={i} />
          ))}
        </div>
      );
    case "custom":
      return <>{skeleton}</>;
    default:
      return <>{skeleton}</>;
  }
}

// Specific loading components for common use cases
export function PageLoader({ title }: { title?: string }) {
  return (
    <div className="flex-1 md:ml-64 pt-16 md:pt-20 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-3 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"use client";

import { DashboardPageContent } from "../dashboard/page";

export default function DashboardFcrPage() {
  return (
    <DashboardPageContent
      title="Dashboard FCR"
      isFcr={true}
      showIncidentWidget={false}
    />
  );
}

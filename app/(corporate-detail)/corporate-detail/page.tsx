"use client";

import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";
import { addDays, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { CorporateCard } from "@/components/dashboard/corporate-detail";
import { useCorporateDetailData } from "@/hooks/use-corporate-detail-data";
import { SlaCustomerKipCard } from "@/components/dashboard/corporate-kips";
import { fromZonedTime } from "date-fns-tz";
import { useCompanyKipsData } from "@/hooks/use-company-kips-data";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(4);

  const normalizedDateRange = useMemo(() => {
    if (!dateRange?.from) return undefined;

    const tz = "Asia/Jakarta";

    const fromLocal = startOfDay(dateRange.from);
    const toLocal = dateRange.to
      ? addDays(startOfDay(dateRange.to), 1)
      : addDays(fromLocal, 1);

    return {
      from: fromZonedTime(fromLocal, tz).toISOString(),
      to: fromZonedTime(toLocal, tz).toISOString(),
    };
  }, [dateRange]);
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 3. Debounce Logic: Wait 500ms after typing stops before updating query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const { corporateDetail, isLoadingCorporate } = useCorporateDetailData({
    dateRange: normalizedDateRange,
  });

  const { companyKips, isLoadingKips, totalCount } = useCompanyKipsData({
    dateRange: normalizedDateRange,
    search: debouncedSearch,
    page: page,
    limit: limit,
  });

  // 3. Reset to page 1 if user searches
  const handleSearchChange = (val: string) => {
    setInputValue(val);
    setPage(1);
  };

  return (
    <div className="min-h-screen dark:bg-slate-950 p-4 dark:text-slate-200 mt-12 md:mt-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0 mb-6">
        <h2 className="text-3xl font-bold tracking-tigh">
          Corporate Detail
        </h2>
        <div className="flex items-center space-x-2">
          <CalendarDateRangePicker date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Change col-span based on your layout needs */}
        <div className="grid grid-cols-1 gap-2">
          <div className="flex flex-col gap-4">
            <CorporateCard
              isVip={true}
              overSlaCount={corporateDetail?.vip?.stats.over3h}
              openCount={corporateDetail?.vip?.stats.openTickets}
              topCorporates={corporateDetail?.vip.topCorps}
              topKips={corporateDetail?.vip.topKips}
            />
            <CorporateCard
              isVip={false}
              overSlaCount={corporateDetail?.pareto?.stats.over3h}
              openCount={corporateDetail?.pareto?.stats.openTickets}
              topCorporates={corporateDetail?.pareto.topCorps}
              topKips={corporateDetail?.pareto.topKips}
            />
          </div>
        </div>

        <SlaCustomerKipCard
          data={companyKips?.data}
          searchTerm={inputValue}
          onSearchChange={handleSearchChange}
          isLoading={isLoadingKips}
          // Pass Pagination State
          currentPage={page}
          itemsPerPage={limit}
          totalItems={totalCount || 0} // Use 0 fallback if backend not ready
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}

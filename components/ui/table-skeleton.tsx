import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({ columns = 5, rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/60 ${className || ''}`}>
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={`th-${i}`} className="py-4">
                <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-slate-700" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={`tr-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={`td-${rowIndex}-${colIndex}`} className="py-4">
                  <Skeleton className={`h-4 bg-slate-100 dark:bg-slate-800 ${colIndex === 0 ? 'w-32' : 'w-full max-w-[150px]'}`} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

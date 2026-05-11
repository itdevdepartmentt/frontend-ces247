import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataTableProps {
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
}

export function DataTableEscalation({ title, data, columns }: DataTableProps) {
  return (
    <Card className="bg-white dark:bg-[#1D293D] border-slate-200 dark:border-slate-700 mt-2 pb-2">
      <CardContent className="p-0 -mt-4">
        <div className="overflow-x-auto overflow-y-hidden scrollbar-modern">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/50">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className="text-slate-600 dark:text-slate-400 font-bold h-6 text-[10px]"
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow
                  key={i}
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className="text-slate-700 dark:text-slate-300 py-0.5 text-[8px]"
                    >
                      {row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

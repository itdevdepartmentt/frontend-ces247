import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter, Search, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

interface FilterOptionGroup {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function FilterGroup({ label, options, selected, onChange }: FilterOptionGroup) {
  const [search, setSearch] = useState("");
  
  const filteredOptions = useMemo(() => {
    if (!options) return [];
    return options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="font-semibold text-sm">{label}</div>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input 
          placeholder={`Search ${label}...`}
          className="h-8 pl-8 text-xs" 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <ScrollArea className="h-48 border rounded-md p-2">
        {filteredOptions.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">No results</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredOptions.map(opt => (
              <div key={opt} className="flex items-start space-x-2 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm">
                <Checkbox 
                  id={`${label}-${opt}`} 
                  checked={selected.includes(opt)}
                  onCheckedChange={() => toggle(opt)}
                  className="mt-0.5"
                />
                <label 
                  htmlFor={`${label}-${opt}`}
                  className="text-xs font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer break-words w-full"
                >
                  {opt}
                </label>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface DashboardFilterProps {
  categories: string[];
  subCategories: string[];
  detailCategories: string[];
  selectedCategories: string[];
  selectedSubCategories: string[];
  selectedDetailCategories: string[];
  onCategoriesChange: (val: string[]) => void;
  onSubCategoriesChange: (val: string[]) => void;
  onDetailCategoriesChange: (val: string[]) => void;
  isLoading?: boolean;
}

export function DashboardFilter({
  categories = [], subCategories = [], detailCategories = [],
  selectedCategories, selectedSubCategories, selectedDetailCategories,
  onCategoriesChange, onSubCategoriesChange, onDetailCategoriesChange,
  isLoading
}: DashboardFilterProps) {
  
  const totalSelected = selectedCategories.length + selectedSubCategories.length + selectedDetailCategories.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-dashed">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-normal text-muted-foreground">Filters</span>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin ml-1 text-muted-foreground" />}
          {totalSelected > 0 && !isLoading && (
            <>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {totalSelected} selected
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[90vw] md:w-[800px] p-4 shadow-xl" align="end">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FilterGroup 
            label="Kategori" 
            options={categories} 
            selected={selectedCategories} 
            onChange={onCategoriesChange} 
          />
          <FilterGroup 
            label="Sub Kategori" 
            options={subCategories} 
            selected={selectedSubCategories} 
            onChange={onSubCategoriesChange} 
          />
          <FilterGroup 
            label="Detail Kategori" 
            options={detailCategories} 
            selected={selectedDetailCategories} 
            onChange={onDetailCategoriesChange} 
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              onCategoriesChange([]);
              onSubCategoriesChange([]);
              onDetailCategoriesChange([]);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

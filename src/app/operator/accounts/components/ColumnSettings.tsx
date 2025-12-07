"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings2, ChevronDown } from "lucide-react";

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

interface ColumnSettingsProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export const ColumnSettings = ({
  columns,
  onColumnsChange,
}: ColumnSettingsProps) => {
  const [open, setOpen] = useState(false);

  const handleToggleColumn = (key: string) => {
    const updatedColumns = columns.map((col) =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(updatedColumns);
  };

  const visibleCount = columns.filter((col) => col.visible).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">列设置</span>
          <span className="text-xs text-muted-foreground">
            ({visibleCount}/{columns.length})
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-56 p-0"
        style={{ backgroundColor: 'hsl(var(--popover))' }}
      >
        <div 
          className="p-3 border-b"
          style={{ backgroundColor: 'hsl(var(--popover))' }}
        >
          <h3 className="text-sm font-semibold">显示列</h3>
          <p className="text-xs text-muted-foreground mt-1">
            选择要显示的列
          </p>
        </div>
        <div 
          className="p-2 max-h-64 overflow-y-auto"
          style={{ backgroundColor: 'hsl(var(--popover))' }}
        >
          {columns.map((column) => (
            <label
              key={column.key}
              className="flex items-center gap-3 px-3 py-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
            >
              <Checkbox
                checked={column.visible}
                onCheckedChange={() => handleToggleColumn(column.key)}
                id={`column-${column.key}`}
              />
              <Label
                htmlFor={`column-${column.key}`}
                className="text-sm cursor-pointer flex-1"
              >
                {column.label}
              </Label>
            </label>
          ))}
        </div>
        <div 
          className="p-2 border-t"
          style={{ backgroundColor: 'hsl(var(--popover))' }}
        >
          <Button
            onClick={() => {
              const allVisible = columns.map((col) => ({
                ...col,
                visible: true,
              }));
              onColumnsChange(allVisible);
            }}
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 px-2 text-xs"
          >
            显示全部
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};


import { X, ChevronDown } from "lucide-react";
import { CSVLink } from "react-csv";
import { Input } from "./Input"
import { DataTableFacetedFilter } from "./DataTableFacetedFilter"
import { statuses } from "../../pages/payments/columns"
import { Button } from "./Button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./DropdownMenu"

export function DataTableToolbar({ table }) {
  const isFiltered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter;
  const numSelected = table.getFilteredSelectedRowModel().rows.length;

  const csvData = table.getFilteredRowModel().rows.map(row => row.original);
  const csvHeaders = [
    { label: "Email", key: "email" },
    { label: "Status", key: "status" },
    { label: "Amount", key: "amount" }
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {numSelected > 0 ? (
          <div className="flex items-center space-x-2">
            <div className="text-sm text-muted-foreground">
              {numSelected} of {table.getCoreRowModel().rows.length} row(s) selected.
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => console.log('Deleting selected rows')}>
                  Delete Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log('Marking as success')}>
                  Mark as Success
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Marking as pending')}>
                  Mark as Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log('Marking as failed')}>
                  Mark as Failed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <>
            <Input
              placeholder="Search all columns..."
              value={(table.getState().globalFilter ?? '')}
              onChange={(event) =>
                table.setGlobalFilter(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px]"
            />
            {table.getColumn("status") && (
              <DataTableFacetedFilter
                column={table.getColumn("status")}
                title="Status"
                options={statuses}
              />
            )}
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={() => {
                  table.resetColumnFilters()
                  table.setGlobalFilter('')
                }}
                className="h-8 px-2 lg:px-3"
              >
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <CSVLink data={csvData} headers={csvHeaders} filename={"payments_data.csv"}>
            <Button variant="outline" className="h-8 px-3">
                Export
            </Button>
        </CSVLink>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
                View <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
                .getAllColumns()
                .filter(
                (column) => column.getCanHide()
                )
                .map((column) => {
                return (
                    <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                    }
                    >
                    {column.id}
                    </DropdownMenuCheckboxItem>
                )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

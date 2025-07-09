import { DataTable } from "../../components/ui/DataTable"
import { DataTableToolbar } from "../../components/ui/DataTableToolbar"
import { DataTablePagination } from "../../components/ui/DataTablePagination"
import { columns } from "./columns"

// Mock data - in a real app, you'd fetch this from an API
const data = [
  {
    id: "1",
    amount: 100,
    status: "pending",
    email: "m@example.com",
  },
  {
    id: "2",
    amount: 125,
    status: "failed",
    email: "example@gmail.com",
  },
  {
    id: "3",
    amount: 75,
    status: "success",
    email: "test@test.com",
  },
  {
    id: "4",
    amount: 200,
    status: "pending",
    email: "another@example.com",
  },
]

export default function PaymentsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Payments</h1>
      <DataTable columns={columns} data={data}>
        {(table) => (
          <>
            <DataTableToolbar table={table} />
            {/* The table itself is rendered inside DataTable */}
            <DataTablePagination table={table} />
          </>
        )}
      </DataTable>
    </div>
  )
}

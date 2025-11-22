import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../components/ui/DataTable'; // Assuming named export
import { createColumnHelper } from '@tanstack/react-table';

// 1. Setup mock data and columns
const testData = [
  { id: 1, name: 'Item 1', value: 100 },
  { id: 2, name: 'Item 2', value: 200 },
];

const columnHelper = createColumnHelper();
const testColumns = [
  columnHelper.accessor('name', {
    header: 'Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('value', {
    header: 'Value',
    cell: info => info.getValue(),
  }),
];

describe('DataTable Component', () => {
  it('should render headers and data rows correctly', () => {
    render(<DataTable columns={testColumns} data={testData} />);

    // Check for headers
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Value' })).toBeInTheDocument();

    // Check for data cells
    expect(screen.getByRole('cell', { name: 'Item 1' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '200' })).toBeInTheDocument();
  });

  it('should display a "no results" message when data is empty', () => {
    render(<DataTable columns={testColumns} data={[]} />);
    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  // This test assumes the DataTable has checkbox selection enabled in its implementation
  it('should handle row selection when checkboxes are present', async () => {
    const user = userEvent.setup();
    
    // Add a selection column for this test
    const columnsWithSelection = [
        {
          id: 'select',
          header: ({ table }) => (
            <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()}/>
          ),
          cell: ({ row }) => (
            <input type="checkbox" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()}/>
          ),
        },
      ...testColumns,
    ];

    render(<DataTable columns={columnsWithSelection} data={testData} />);

    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is the header checkbox
    const headerCheckbox = checkboxes[0];
    const firstRowCheckbox = checkboxes[1];

    // 1. Select a single row
    await user.click(firstRowCheckbox);
    expect(firstRowCheckbox).toBeChecked();

    // 2. Select all rows
    await user.click(headerCheckbox);
    checkboxes.forEach(cb => expect(cb).toBeChecked());
    
    // 3. Deselect all rows
    await user.click(headerCheckbox);
    checkboxes.forEach(cb => expect(cb).not.toBeChecked());
  });
});










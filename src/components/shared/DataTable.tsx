import type { ReactNode, MouseEvent } from 'react';
import { SortArrow } from '../ui';

interface DataTableProps {
    children?: ReactNode;
    className?: string;
    caption?: string;
}

/**
 * Reusable DataTable component
 * Uses semantic <table> with optional caption
 */
export const DataTable = ({ children, className = '', caption }: DataTableProps) => (
    <table className={`data-table ${className}`}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
    </table>
);

interface TableHeaderProps {
    children?: ReactNode;
}

/**
 * Table Header
 */
export const TableHeader = ({ children }: TableHeaderProps) => (
    <thead>
        <tr className="data-table__header">
            {children}
        </tr>
    </thead>
);

interface TableHeaderCellProps {
    children?: ReactNode;
    sortKey?: string;
    currentSort?: string;
    sortDir?: 'asc' | 'desc' | null;
    onSort?: (key: string) => void;
    align?: 'left' | 'right';
    className?: string;
    scope?: 'col' | 'row';
}

/**
 * Sortable header cell
 */
export const TableHeaderCell = ({ 
    children, 
    sortKey,
    currentSort,
    sortDir,
    onSort,
    align = 'left',
    className = '',
    scope = 'col',
}: TableHeaderCellProps) => {
    const isSortable = !!sortKey && !!onSort;
    const isActive = currentSort === sortKey;
    
    const alignClass = align === 'right' ? 'data-table__header-cell--right' : '';
    const sortableClass = isSortable ? 'data-table__header-cell--sortable' : '';
    const activeClass = isActive ? 'data-table__header-cell--active' : '';
    
    return (
        <th 
            scope={scope}
            onClick={isSortable ? () => onSort(sortKey) : undefined}
            className={`data-table__header-cell ${alignClass} ${sortableClass} ${activeClass} ${className}`}
            aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
        >
            {children}
            {isSortable && <SortArrow direction={isActive ? sortDir : null} />}
        </th>
    );
};

interface TableBodyProps {
    children?: ReactNode;
}

/**
 * Table Body
 */
export const TableBody = ({ children }: TableBodyProps) => (
    <tbody>{children}</tbody>
);

interface TableRowProps {
    children?: ReactNode;
    onClick?: (e: MouseEvent<HTMLTableRowElement>) => void;
    striped?: boolean;
    className?: string;
}

/**
 * Table Row
 */
export const TableRow = ({ 
    children, 
    onClick,
    striped = false,
    className = '',
}: TableRowProps) => {
    const clickableClass = onClick ? 'data-table__row--clickable' : '';
    const stripedClass = striped ? 'data-table__row--striped' : '';
    
    return (
        <tr 
            onClick={onClick}
            className={`data-table__row ${clickableClass} ${stripedClass} ${className}`}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(e as unknown as MouseEvent<HTMLTableRowElement>); } : undefined}
            role={onClick ? 'button' : undefined}
        >
            {children}
        </tr>
    );
};

interface TableCellProps {
    children?: ReactNode;
    align?: 'left' | 'right';
    mono?: boolean;
    className?: string;
}

/**
 * Table Cell
 */
export const TableCell = ({ 
    children, 
    align = 'left',
    mono = false,
    className = '',
}: TableCellProps) => {
    const alignClass = align === 'right' ? 'data-table__cell--right' : '';
    const monoClass = mono ? 'data-table__cell--mono' : '';
    
    return (
        <td className={`data-table__cell ${alignClass} ${monoClass} ${className}`}>
            {children}
        </td>
    );
};

interface TableContainerProps {
    children?: ReactNode;
    className?: string;
}

/**
 * Table wrapper with overflow
 */
export const TableContainer = ({ children, className = '' }: TableContainerProps) => (
    <div style={{ overflowX: 'auto' }} className={className} role="region" aria-label="Scrollable table" tabIndex={0}>
        {children}
    </div>
);

/**
 * VirtualList - Renders only visible items for performance
 * Uses @tanstack/react-virtual for efficient list rendering
 */

import { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    itemHeight: number;
    overscan?: number;
    className?: string;
    style?: React.CSSProperties;
    getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
    items,
    renderItem,
    itemHeight,
    overscan = 5,
    className = '',
    style,
    getItemKey,
}: VirtualListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => itemHeight,
        overscan,
    });

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div
            ref={parentRef}
            className={className}
            style={{
                height: '100%',
                overflow: 'auto',
                contain: 'strict',
                ...style,
            }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const item = items[virtualItem.index];
                    const key = getItemKey 
                        ? getItemKey(item, virtualItem.index) 
                        : virtualItem.index;
                    
                    return (
                        <div
                            key={key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            {renderItem(item, virtualItem.index)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * VirtualGrid - For grid layouts (like mobile cards)
 */
interface VirtualGridProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    itemHeight: number;
    columns?: number;
    gap?: number;
    overscan?: number;
    className?: string;
    getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualGrid<T>({
    items,
    renderItem,
    itemHeight,
    columns = 1,
    gap = 16,
    overscan = 3,
    className = '',
    getItemKey,
}: VirtualGridProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);

    // Calculate rows based on columns
    const rowCount = Math.ceil(items.length / columns);
    const rowHeight = itemHeight + gap;

    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan,
    });

    const virtualRows = virtualizer.getVirtualItems();

    return (
        <div
            ref={parentRef}
            className={className}
            style={{
                height: '100%',
                overflow: 'auto',
                contain: 'strict',
            }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualRows.map((virtualRow) => {
                    const startIndex = virtualRow.index * columns;
                    const rowItems = items.slice(startIndex, startIndex + columns);

                    return (
                        <div
                            key={virtualRow.index}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                                display: 'grid',
                                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                gap: `${gap}px`,
                            }}
                        >
                            {rowItems.map((item, colIndex) => {
                                const index = startIndex + colIndex;
                                const key = getItemKey 
                                    ? getItemKey(item, index) 
                                    : index;
                                
                                return (
                                    <div key={key}>
                                        {renderItem(item, index)}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default VirtualList;

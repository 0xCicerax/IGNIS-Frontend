export const SortArrow = ({ direction }) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ marginLeft: 4, opacity: direction ? 1 : 0.3 }}>
        {direction === 'asc' ? <path d="M5 2L9 7H1L5 2Z" /> : direction === 'desc' ? <path d="M5 8L1 3H9L5 8Z" /> : <path d="M5 2L8 5H2L5 2ZM5 8L2 5H8L5 8Z" />}
    </svg>
);

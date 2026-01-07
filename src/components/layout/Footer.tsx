import { IgnisLogo } from '../ui';

export const Footer = () => (
    <footer style={{ background: 'linear-gradient(180deg, rgba(10,10,11,0.95) 0%, rgba(15,15,18,1) 100%)', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '2.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <IgnisLogo size={32} />
                <div>
                    <span className="text-gradient" style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem' }}>IGNIS</span>
                    <div style={{ fontSize: '0.625rem', color: '#7A7A7A' }}>An Aurelia Product</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.8125rem' }}>
                {['Docs', 'GitHub', 'Twitter', 'Discord'].map(l => <a key={l} href="#" style={{ color: '#7A7A7A', textDecoration: 'none' }}>{l}</a>)}
            </div>
            <span style={{ color: '#404040', fontSize: '0.75rem' }}>© 2025 IGNIS. All rights reserved.</span>
        </div>
    </footer>
);

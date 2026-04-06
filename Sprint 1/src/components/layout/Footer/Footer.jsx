import styles from './Footer.module.css'
import logoNoBg from '@/img/logo no-bg.png'

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'Twitter / X',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: 'YouTube',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
      </svg>
    ),
  },
]

const LINKS = {
  'Loja': ['Todos os Produtos', 'Novidades', 'Promoções', 'Mais Vendidos'],
  'Suporte': ['Central de Ajuda', 'Fale Conosco', 'Trocas e Devoluções', 'Rastrear Pedido'],
  'Empresa': ['Sobre Nós', 'Trabalhe Conosco', 'Blog', 'Imprensa'],
  'Legal': ['Termos de Uso', 'Privacidade', 'Cookies', 'Segurança'],
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>

        {/* Coluna da marca */}
        <div className={styles.brand}>
          <img src={logoNoBg} alt="DesenvolvStore" className={styles.logo} />
          <p className={styles.tagline}>
            Os melhores produtos com os melhores preços. Qualidade e confiança em cada compra.
          </p>
          <div className={styles.socials}>
            {SOCIAL_LINKS.map(({ label, icon }) => (
              <span key={label} className={styles.socialBtn} aria-label={label} title={label}>
                {icon}
              </span>
            ))}
          </div>
        </div>

        {/* Colunas de links */}
        {Object.entries(LINKS).map(([section, items]) => (
          <div key={section} className={styles.linkGroup}>
            <h4 className={styles.groupTitle}>{section}</h4>
            <ul className={styles.linkList}>
              {items.map((item) => (
                <li key={item}>
                  <span className={styles.link}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

      </div>

      {/* Barra inferior */}
      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <p className={styles.copyright}>© 2026 DesenvolvStore. Todos os direitos reservados.</p>
          <div className={styles.paymentIcons}>

            {/* Visa */}
            <span className={styles.paymentCard} title="Visa">
              <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#1A1F71"/>
                <text x="19" y="17" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="13" letterSpacing="1" fill="white">VISA</text>
              </svg>
            </span>

            {/* Mastercard */}
            <span className={styles.paymentCard} title="Mastercard">
              <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#252525"/>
                <circle cx="14" cy="12" r="7" fill="#EB001B"/>
                <circle cx="24" cy="12" r="7" fill="#F79E1B"/>
                <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00"/>
              </svg>
            </span>

            {/* Pix */}
            <span className={styles.paymentCard} title="Pix">
              <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#F0FAFA"/>
                <g transform="translate(10, 4)">
                  <path d="M6.5 0L9 2.5 6.5 5 4 2.5z" fill="#32BCAD"/>
                  <path d="M9 2.5L11.5 5 9 7.5 6.5 5z" fill="#32BCAD"/>
                  <path d="M4 2.5L6.5 5 4 7.5 1.5 5z" fill="#32BCAD"/>
                  <path d="M6.5 5L9 7.5 6.5 10 4 7.5z" fill="#32BCAD"/>
                </g>
                <text x="24" y="16" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" fill="#32BCAD">PIX</text>
              </svg>
            </span>

            {/* Boleto */}
            <span className={styles.paymentCard} title="Boleto Bancário">
              <svg width="38" height="24" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#F5F5F5"/>
                <rect x="5"  y="5" width="2"  height="14" fill="#222"/>
                <rect x="8"  y="5" width="1"  height="14" fill="#222"/>
                <rect x="10" y="5" width="3"  height="14" fill="#222"/>
                <rect x="14" y="5" width="1"  height="14" fill="#222"/>
                <rect x="16" y="5" width="2"  height="14" fill="#222"/>
                <rect x="19" y="5" width="1"  height="14" fill="#222"/>
                <rect x="21" y="5" width="3"  height="14" fill="#222"/>
                <rect x="25" y="5" width="1"  height="14" fill="#222"/>
                <rect x="27" y="5" width="2"  height="14" fill="#222"/>
                <rect x="30" y="5" width="1"  height="14" fill="#222"/>
                <rect x="32" y="5" width="2"  height="14" fill="#222"/>
              </svg>
            </span>

          </div>
        </div>
      </div>
    </footer>
  )
}

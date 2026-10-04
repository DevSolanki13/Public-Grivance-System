import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

// Wraps every inner page: navbar + teal title band + content + footer.
// width: 'wide' (default) | 'narrow' (forms) | 'auth' (login/register)
export default function PageLayout({
  role,
  title,
  subtitle,
  action,
  width = 'wide',
  children,
}) {
  return (
    <div className={`page ${width}`}>
      <div className="decor" aria-hidden="true">
        <span className="s1" /><span className="s2" /><span className="s3" /><span className="s4" />
      </div>

      <Navbar role={role} />

      {title && (
        <div className="page-band">
          <div className="page-band-inner">
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {action}
          </div>
        </div>
      )}

      <main className="page-body">{children}</main>
      <Footer />
    </div>
  );
}

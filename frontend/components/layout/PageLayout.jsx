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

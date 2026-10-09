import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

// Wraps every inner page: government header + title band + content + footer.
// width: 'wide' (default) | 'narrow' (forms) | 'auth' (login/register)
function PageLayout({ title, subtitle, action, width = 'wide', children }) {
  return (
    <div className={`page ${width}`}>
      <Navbar />

      <div className="page-band">
        <div className="page-band-inner">
          <div>
            <div className="crumbs"><Link to="/">Home</Link> &rsaquo; {title}</div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      </div>

      <main className="page-body" id="main-content">{children}</main>
      <Footer />
    </div>
  );
}

export default PageLayout;

import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, BarChart3 } from 'lucide-react';

function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div>
        <span><Phone size={16} /> 1-800-JANSEWA (Toll Free)</span>
        <span><Mail size={16} /> support@jansewa.gov.in</span>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Link to="/transparency" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <BarChart3 size={14} /> Public Transparency Portal
        </Link>
        <a href="#services">Civic Services</a>
        <a href="#track">Track Status</a>
      </div>
    </footer>
  );
}

export default Footer;

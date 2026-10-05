import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-inner">
        <div>
          <h4>JanSewa – Public Grievance Redressal Portal</h4>
          <p>A single window for citizens to register civic complaints, track their status and see how every department is performing.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/transparency">Public Transparency Portal</Link>
          <a href="/#services">Civic Services</a>
          <a href="/#track">Track Your Complaint</a>
        </div>
        <div>
          <h4>Helpdesk</h4>
          <div className="f-line"><Phone size={15} /> <span>1-800-JANSEWA (Toll Free)</span></div>
          <div className="f-line"><Mail size={15} /> <span>support@jansewa.gov.in</span></div>
          <div className="f-line"><Clock size={15} /> <span>Mon–Sat, 9:00 AM – 6:00 PM</span></div>
          <div className="f-line"><MapPin size={15} /> <span>Municipal Corporation Office</span></div>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 JanSewa Public Grievance System · Demo project for academic showcase
      </div>
    </footer>
  );
}

export default Footer;

import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div>
        <span><Phone size={16} />1-800-JANSEWA</span>
        <span><Mail size={16} />support@jansewa.in</span>
      </div>
      <div>
        <Link to="/transparency">Public statistics</Link>
        <a href="#services">Services</a>
        <a href="#">Privacy policy</a>
        <a href="#">Accessibility</a>
      </div>
    </footer>
  );
}

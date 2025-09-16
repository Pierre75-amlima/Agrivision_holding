import React from "react";
import { FaFacebook, FaLinkedin, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#094363] text-white relative overflow-hidden">
      {/* Forme géométrique décorative */}
      <div
        className="absolute top-0 left-0 w-full h-20 bg-gray-100"
        style={{ clipPath: "polygon(0 100%, 100% 0%, 100% 100%)" }}
      ></div>

      <div className="relative pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Contenu principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Colonne 1 - Logo + Description */}
            <div className="md:col-span-1">
              {/* Réseaux sociaux */}
              <div className="flex gap-4 mt-8">
                <a
                  href="https://www.facebook.com/AgrivisionHolding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-green-400 transition-all duration-300 group-hover:scale-110">
                    <FaFacebook className="text-lg group-hover:text-white" />
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/company/agrivision-holding/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-green-400 transition-all duration-300 group-hover:scale-110">
                    <FaLinkedin className="text-lg group-hover:text-white" />
                  </div>
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-green-400 transition-all duration-300 group-hover:scale-110">
                    <FaInstagram className="text-lg group-hover:text-white" />
                  </div>
                </a>
              </div>
            </div>

            {/* Colonne 2 - Liens rapides */}
            <div className="md:mt-8">
              <h3 className="text-lg font-semibold mb-4 text-green-300">
                Liens rapides
              </h3>
              <div className="space-y-3">
                {[
                  { text: "Nos offres d'emploi", href: "#offres" },
                  
                  { text: "FAQ", href: "#faq" },
                ].map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="block text-white/80 hover:text-green-300 hover:translate-x-2 transition-all duration-300 text-sm"
                  >
                    → {link.text}
                  </a>
                ))}
              </div>
            </div>

            {/* Colonne 3 - Contact */}
            <div className="md:mt-8">
              <h3 className="text-lg font-semibold mb-4 text-green-300">
                Contact
              </h3>
              <div className="space-y-3 text-sm text-white/80">
                <p>contact@agrivisionholding.com</p>
                <p>+229 65 67 90 90</p>
                <p>13ᵉ Arrondissement, Littoral, Bénin</p>
              </div>
            </div>
          </div>

          {/* Ligne de séparation */}
          <div className="border-t border-white/20 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
              <p>© 2025 Agrivision Holding. Tous droits réservés.</p>
              <div className="flex gap-6">
                <a
                  href="#confidentialite"
                  className="hover:text-white transition-colors"
                >
                  Politique de confidentialité
                </a>
                <a
                  href="#mentions"
                  className="hover:text-white transition-colors"
                >
                  Mentions légales
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

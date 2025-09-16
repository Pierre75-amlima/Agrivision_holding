import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { useModal } from "../contexts/modalContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const { openSignupModal } = useModal();
  const navigate = useNavigate();
   
  const handleConnexionClick = () => {
    openSignupModal();
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    navigate('/about');
    setIsOpen(false); // Fermer le menu mobile si ouvert
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/');
    setIsOpen(false);
  };

  const handleOffersClick = (e) => {
    e.preventDefault();
    // Si on est sur la page d'accueil, scroll vers la section
    if (window.location.pathname === '/') {
      const offersSection = document.getElementById('offres');
      if (offersSection) {
        offersSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Sinon, naviguer vers l'accueil puis scroll
      navigate('/?section=offres');
    }
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo optimisé */}
        <div className="flex items-center cursor-pointer" onClick={handleHomeClick}>
          <img
            src="/logo.png"
            alt="Agrivision Holding"
            className="h-12 md:h-14 w-auto object-contain"
          />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex space-x-8 text-black font-bold text-base font-metropolis">
          <button 
            onClick={handleHomeClick}
            className="relative hover:text-[#094363] transition-colors group"
          >
            Accueil
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-full"></span>
          </button>
          
          <button 
            onClick={handleOffersClick}
            className="relative hover:text-[#094363] transition-colors group"
          >
            Offres d'emploi
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-full"></span>
          </button>
          
          {/* <button 
            onClick={handleAboutClick}
            className="relative hover:text-[#094363] transition-colors group"
          >
            À propos
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-full"></span>
          </button> */}

          {/* Bouton Connexion → ouvre modal */}
          <button
            onClick={handleConnexionClick}
            className="relative hover:text-[#094363] transition-colors group"
          >
            Inscription
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-full"></span>
          </button>
        </nav>

        {/* Mobile menu button */}
        <button className="md:hidden text-black" onClick={toggleMenu} aria-label="Toggle menu">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 bg-white border-t border-gray-100">
          <nav className="flex flex-col space-y-2 text-black font-bold">
            <button 
              onClick={handleHomeClick}
              className="px-3 py-2 rounded-md hover:text-[#094363] hover:bg-gray-100 transition-colors relative group text-left"
            >
              Accueil
              <span className="absolute bottom-1 left-3 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-[calc(100%-1.5rem)]"></span>
            </button>
            
            <button 
              onClick={handleOffersClick}
              className="px-3 py-2 rounded-md hover:text-[#094363] hover:bg-gray-100 transition-colors relative group text-left"
            >
              Offres d'emploi
              <span className="absolute bottom-1 left-3 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-[calc(100%-1.5rem)]"></span>
            </button>
            
            {/* <button 
              onClick={handleAboutClick}
              className="px-3 py-2 rounded-md hover:text-[#094363] hover:bg-gray-100 transition-colors relative group text-left"
            >
              À propos
              <span className="absolute bottom-1 left-3 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-[calc(100%-1.5rem)]"></span>
            </button> */}

            {/* Mobile version du bouton Connexion */}
            <button
              onClick={handleConnexionClick}
              className="px-3 py-2 rounded-md text-left hover:text-[#094363] hover:bg-gray-100 transition-colors relative group"
            >
              Inscription
              <span className="absolute bottom-1 left-3 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-[calc(100%-1.5rem)]"></span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
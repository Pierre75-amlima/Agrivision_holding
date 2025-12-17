import React, { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { useModal } from "../contexts/modalContext";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);
  const { openSignupModal, openLoginModal } = useModal();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignupClick = () => {
    openSignupModal();
  };

  const handleLoginClick = () => {
    openLoginModal();
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

          {isAuthenticated ? (
            <>
              {/* Afficher le nom de l'utilisateur */}
              <div className="flex items-center space-x-2">
                <User size={20} className="text-[#094363]" />
                <span className="text-[#094363]">{user?.prenoms}</span>
              </div>

              {/* Bouton Déconnexion */}
              <button
                onClick={() => logout()}
                className="flex items-center space-x-2 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            </>
          ) : (
            <>
              {/* Bouton Connexion → ouvre modal login */}
              <button
                onClick={handleLoginClick}
                className="relative hover:text-[#094363] transition-colors group"
              >
                Connexion
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-full"></span>
              </button>

              {/* Bouton Inscription → ouvre modal signup */}
              <button
                onClick={handleSignupClick}
                className="relative hover:text-[#094363] transition-colors group"
              >
                Inscription
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-full"></span>
              </button>
            </>
          )}
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

            {isAuthenticated ? (
              <>
                {/* Afficher le nom de l'utilisateur en mobile */}
                <div className="px-3 py-2 flex items-center space-x-2">
                  <User size={20} className="text-[#094363]" />
                  <span className="text-[#094363]">{user?.prenoms}</span>
                </div>

                {/* Bouton Déconnexion en mobile */}
                <button
                  onClick={() => logout()}
                  className="px-3 py-2 rounded-md text-left bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                {/* Mobile version du bouton Connexion */}
                <button
                  onClick={handleLoginClick}
                  className="px-3 py-2 rounded-md text-left hover:text-[#094363] hover:bg-gray-100 transition-colors relative group"
                >
                  Connexion
                  <span className="absolute bottom-1 left-3 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-[calc(100%-1.5rem)]"></span>
                </button>

                {/* Mobile version du bouton Inscription */}
                <button
                  onClick={handleSignupClick}
                  className="px-3 py-2 rounded-md text-left hover:text-[#094363] hover:bg-gray-100 transition-colors relative group"
                >
                  Inscription
                  <span className="absolute bottom-1 left-3 w-0 h-0.5 bg-[#094363] transition-all group-hover:w-[calc(100%-1.5rem)]"></span>
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
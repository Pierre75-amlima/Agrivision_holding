import React from 'react';
import Header from '../components/header';
import Hero from '../components/hero';
import OffreList from '../sections/offreList';
import PourquoiPostuler from '../sections/pourquoiPostuler';
import Footer from '../components/footer';
import { useModal } from '../contexts/modalContext';
import LoginForm from '../components/loginForm';
import SignupForm from '../components/signUpForm'; // Ajoutez si vous avez ce composant

export default function Home() {
  const { showModal, authMode, closeModal } = useModal();

  return (
    <div>
      <Header />
      <Hero />
      <OffreList />
      <PourquoiPostuler />
      <Footer />

      {/* Modal global géré par ModalContext */}
      {showModal && authMode === 'login' && (
        <LoginForm onClose={closeModal} />
      )}
      {showModal && authMode === 'signup' && (
        <SignupForm onClose={closeModal} />
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const images = ['/hero4.jpg', '/hero2.jpg', '/hero3.jpg'];

const Hero = () => {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleClick = () => {
    navigate('/offres'); // redirection vers la page AllOffres
  };

  return (
    <section className="relative w-full h-screen overflow-hidden font-sans">
      {/* Slider d’images */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full flex"
        animate={{ x: `-${index * 100}%` }}
        transition={{ type: 'tween', duration: 1 }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Slide ${i}`}
            className="w-full h-full object-cover flex-shrink-0"
          />
        ))}
      </motion.div>

      {/* Bloc contenu (overlay local) */}
      <div className="relative z-20 h-full flex items-center px-6 md:px-16">
        <div className="bg-white bg-opacity-70 backdrop-blur-md rounded-xl p-8 md:p-12 shadow-lg max-w-xl text-[#094363] space-y-6">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            Postulez facilement et suivez chaque étape de votre recrutement.
            <br className="hidden md:block" />
          </h1>
          <p className="text-lg md:text-xl">
            Une plateforme professionnelle dédiée à votre candidature, du dépôt au résultat final.
          </p>
          <button
            onClick={handleClick}
            className="bg-[#094363] text-white px-6 py-3 rounded-lg shadow hover:bg-[#0b527c] transition duration-300 font-semibold"
          >
            Commencer ma candidature
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;

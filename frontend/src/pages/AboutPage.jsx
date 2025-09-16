import React from 'react';
import { 
  FiUsers, 
  FiTarget, 
  FiAward, 
  FiTrendingUp,
  FiHeart,
  FiShield,
  FiGlobe,
  FiMail,
  FiPhone,
  FiMapPin
} from 'react-icons/fi';

const AboutPage = () => {
  const stats = [
    { number: '5000+', label: 'Candidats inscrits', icon: FiUsers },
    { number: '500+', label: 'Entreprises partenaires', icon: FiTarget },
    { number: '95%', label: 'Taux de satisfaction', icon: FiAward },
    { number: '2000+', label: 'Placements réussis', icon: FiTrendingUp }
  ];

  const values = [
    {
      icon: FiHeart,
      title: 'Excellence',
      description: 'Nous nous engageons à fournir une expérience de recrutement de qualité supérieure pour tous nos utilisateurs.'
    },
    {
      icon: FiShield,
      title: 'Transparence',
      description: 'Processus clairs, critères objectifs et communication honnête à chaque étape du recrutement.'
    },
    {
      icon: FiGlobe,
      title: 'Innovation',
      description: 'Utilisation des technologies les plus avancées pour révolutionner le processus de recrutement.'
    }
  ];

  const team = [
    {
      name: 'Marie Dubois',
      role: 'Directrice Générale',
      description: '15 ans d\'expérience dans les ressources humaines et le recrutement digital.',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Jean Martin',
      role: 'Directeur Technique',
      description: 'Expert en développement de plateformes RH et intelligence artificielle.',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Sophie Laurent',
      role: 'Responsable Recrutement',
      description: 'Spécialisée dans l\'optimisation des processus de sélection et d\'évaluation.',
      image: '/api/placeholder/150/150'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              À Propos de Notre Plateforme
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90">
              Révolutionner le recrutement grâce à la technologie et l'innovation pour connecter les talents aux opportunités
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Notre Mission
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Nous croyons que chaque talent mérite sa chance et que chaque entreprise mérite de trouver les bonnes personnes. 
                Notre plateforme utilise des technologies avancées pour simplifier, optimiser et humaniser le processus de recrutement.
              </p>
              <p className="text-lg text-gray-700">
                Depuis notre création, nous nous efforçons de créer un écosystème où l'équité, la transparence et l'efficacité 
                sont au cœur de chaque interaction entre candidats et recruteurs.
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <FiTarget className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Connecter les Talents
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos Résultats en Chiffres
            </h2>
            <p className="text-lg text-gray-600">
              Des statistiques qui témoignent de notre engagement envers l'excellence
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                    <IconComponent className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nos Valeurs
            </h2>
            <p className="text-lg text-gray-600">
              Les principes qui guident chacune de nos actions
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 h-full">
                    <IconComponent className="w-12 h-12 text-blue-600 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                      {value.title}
                    </h3>
                    <p className="text-gray-700">
                      {value.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Notre Équipe
            </h2>
            <p className="text-lg text-gray-600">
              Des experts passionnés au service de votre réussite
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                    <FiUsers className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contactez-Nous
            </h2>
            <p className="text-lg text-gray-600">
              Une question ? Notre équipe est là pour vous accompagner
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">contact@plateforme-recrutement.com</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPhone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Téléphone</h3>
              <p className="text-gray-600">+229 XX XX XX XX</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Adresse</h3>
              <p className="text-gray-600">Cotonou, Bénin</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à Révolutionner Votre Recrutement ?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Rejoignez les milliers d'entreprises qui font confiance à notre plateforme pour trouver les meilleurs talents
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Commencer Maintenant
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-900 transition-colors">
              En Savoir Plus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
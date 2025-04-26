import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';

const typeColors = {
  Normal: 'bg-gray-300',
  Fire: 'bg-red-500',
  Water: 'bg-blue-500',
  Grass: 'bg-green-500',
  Electric: 'bg-yellow-400',
  Poison: 'bg-purple-500',
  Flying: 'bg-indigo-300',
  Bug: 'bg-lime-500',
  Rock: 'bg-yellow-800',
  Ice: 'bg-cyan-300',
  Ground: 'bg-yellow-600',
  Psychic: 'bg-pink-500',
  Steel: 'bg-gray-500',
  Fairy: 'bg-pink-300',
};

const PokemonList = ({ pokemonList, onSelectPokemon, onAddToTeam, onAddToFavorites, setPage, page, limit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 640);
  const cardsPerView = 1; // On small screens, show 1 card at a time
  const totalGroups = Math.ceil(pokemonList.length / cardsPerView);

  // Determine if the screen is small (< 640px)
  const updateScreenSize = () => {
    setIsSmallScreen(window.innerWidth < 640);
  };

  useEffect(() => {
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Reset currentIndex to 0 whenever the pokemonList changes (i.e., when a new page is fetched)
  useEffect(() => {
    setCurrentIndex(0);
  }, [pokemonList]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalGroups);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalGroups) % totalGroups);
  };

  // Swipe handlers for small screens
  const handlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    trackMouse: true, // Allow mouse dragging as well
  });

  // Calculate the Pokémon to display for the carousel (small screens)
  const startIndex = currentIndex * cardsPerView;
  const displayedPokemon = pokemonList.slice(startIndex, startIndex + cardsPerView);

  // Handlers for page navigation
  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className="relative">
      {isSmallScreen ? (
        // Carousel layout for small screens (< 640px)
        <>
          {/* Navigation Buttons for Pokémon in the current page */}
          {totalGroups > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-0 z-10 p-2 text-white transform -translate-y-1/2 rounded-full shadow-md top-1/2 bg-poke-blue hover:bg-poke-blue-dark"
                aria-label="Previous Pokémon"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 z-10 p-2 text-white transform -translate-y-1/2 rounded-full shadow-md top-1/2 bg-poke-blue hover:bg-poke-blue-dark"
                aria-label="Next Pokémon"
              >
                →
              </button>
            </>
          )}

          {/* Pokémon Carousel */}
          <div {...handlers} className="flex justify-center overflow-hidden">
            <div className="grid w-full grid-cols-1 gap-4">
              {displayedPokemon.map((pokemon) => (
                <div
                  key={pokemon.id}
                  className="p-4 transition-all duration-300 bg-white shadow-lg cursor-pointer pokemon-card rounded-2xl hover:shadow-xl hover:scale-105 sm:p-5"
                  onClick={() => onSelectPokemon(pokemon)}
                >
                  <img
                    src={pokemon.sprites.front_default}
                    alt={pokemon.name}
                    className="w-20 h-20 mx-auto sm:w-24 sm:h-24"
                  />
                  <h3 className="text-lg font-semibold text-center capitalize text-poke-blue sm:text-xl font-pokemon">
                    {pokemon.name}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-1 mt-2 sm:gap-2">
                    {pokemon.types.map((type) => (
                      <span
                        key={type.type.name}
                        className={`px-2 py-1 rounded-full text-white text-xs font-medium sm:px-3 sm:text-sm ${
                          typeColors[type.type.name] || 'bg-gray-400'
                        }`}
                      >
                        {type.type.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-center gap-2 mt-3 sm:gap-3 sm:mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToFavorites(pokemon);
                      }}
                      className="px-3 py-1 text-sm text-white transition-all duration-300 rounded-full shadow-sm sm:text-base bg-poke-purple hover:bg-poke-purple-dark hover:scale-105 sm:px-4 sm:py-2"
                    >
                      Favorites
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToTeam(pokemon);
                      }}
                      className="px-3 py-1 text-sm text-white transition-all duration-300 rounded-full shadow-sm sm:text-base bg-poke-green hover:bg-poke-green-dark hover:scale-105 sm:px-4 sm:py-2"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicators for current Pokémon in the carousel */}
          {totalGroups > 1 && (
            <div className="flex justify-center mt-4">
              {Array.from({ length: totalGroups }).map((_, index) => (
                <span
                  key={index}
                  className={`h-3 w-3 mx-1 rounded-full ${
                    index === currentIndex ? 'bg-poke-blue' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Page Navigation Buttons for Small Screens */}
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={handlePreviousPage}
              disabled={page === 1}
              className="px-4 py-2 text-white transition-colors bg-gray-500 rounded-full shadow-md hover:bg-gray-600 disabled:opacity-50 sm:px-6 sm:py-3"
            >
              Previous  
            </button>
            <button
              onClick={handleNextPage}
              disabled={pokemonList.length < limit}
              className="px-4 py-2 text-white transition-colors bg-gray-500 rounded-full shadow-md hover:bg-gray-600 disabled:opacity-50 sm:px-6 sm:py-3"
            >
              Next  
            </button>
          </div>
        </>
      ) : (
        // Grid layout for larger screens (≥ 640px)
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {pokemonList.map((pokemon) => (
            <div
              key={pokemon.id}
              className="p-4 transition-all duration-300 bg-white shadow-lg cursor-pointer pokemon-card rounded-2xl hover:shadow-xl hover:scale-105 sm:p-5"
              onClick={() => onSelectPokemon(pokemon)}
            >
              <img
                src={pokemon.sprites.front_default}
                alt={pokemon.name}
                className="w-20 h-20 mx-auto sm:w-24 sm:h-24"
              />
              <h3 className="text-lg font-semibold text-center capitalize text-poke-blue sm:text-xl font-pokemon">
                {pokemon.name}
              </h3>
              <div className="flex flex-wrap justify-center gap-1 mt-2 sm:gap-2">
                {pokemon.types.map((type) => (
                  <span
                    key={type.type.name}
                    className={`px-2 py-1 rounded-full text-white text-xs font-medium sm:px-3 sm:text-sm ${
                      typeColors[type.type.name] || 'bg-gray-400'
                    }`}
                  >
                    {type.type.name}
                  </span>
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-3 sm:gap-3 sm:mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToFavorites(pokemon);
                  }}
                  className="px-3 py-1 text-sm text-white transition-all duration-300 rounded-full shadow-sm sm:text-base bg-poke-purple hover:bg-poke-purple-dark hover:scale-105 sm:px-4 sm:py-2"
                >
                  Favorites
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToTeam(pokemon);
                  }}
                  className="px-3 py-1 text-sm text-white transition-all duration-300 rounded-full shadow-sm sm:text-base bg-poke-green hover:bg-poke-green-dark hover:scale-105 sm:px-4 sm:py-2"
                >
                  Add  
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PokemonList;
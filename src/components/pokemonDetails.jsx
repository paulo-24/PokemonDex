import React from 'react';

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

const PokemonDetails = ({ pokemon, onAddToTeam }) => {
  return (
    <div className="relative text-center">
      <h2 className="mb-4 text-2xl font-bold capitalize text-poke-blue font-pokemon sm:text-3xl">
        {pokemon.name}
      </h2>
      <img
        src={pokemon.sprites.front_default}
        alt={pokemon.name}
        className="w-32 h-32 mx-auto mb-4 sm:w-40 sm:h-40"
      />
      <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-700">Stats</h3>
          <ul className="text-sm text-left sm:text-base">
            {pokemon.stats.map((stat, index) => (
              <li key={index} className="capitalize">
                {stat.stat.name}: {stat.base_stat}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-700">Types</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {pokemon.types.map((type, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                  typeColors[type.type.name] || 'bg-gray-400'
                }`}
              >
                {type.type.name}
              </span>
            ))}
          </div>
          <h3 className="mt-4 mb-2 text-lg font-semibold text-gray-700">Abilities</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {pokemon.abilities.map((ability, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm font-medium text-white capitalize bg-yellow-500 rounded-full"
              >
                {ability.ability.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => onAddToTeam(pokemon)}
          className="px-6 py-2 text-white transition-all duration-300 rounded-full shadow-md bg-poke-green hover:bg-poke-green-dark hover:scale-105 sm:px-8 sm:py-3"
        >
          Add to Team
        </button>
      </div>
    </div>
  );
};

export default PokemonDetails;
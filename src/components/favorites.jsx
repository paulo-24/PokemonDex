import React from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';

// eslint-disable-next-line no-unused-vars
const Favorites = ({ favorites, setFavorites, onClose, isSmallScreen }) => {
  const removeFromFavorites = async (pokemonId) => {
    try {
      const response = await axios.delete(`${import.meta.env.REACT_APP_API_URL}/favorites/${pokemonId}`);
      console.log('Server response after removing from favorites:', response.data);
      const newFavorites = favorites.filter((pokemon) => pokemon.id !== pokemonId);
      setFavorites(newFavorites);
      Swal.fire({
        title: 'Removed from Favorites!',
        text: 'The Pokémon has been removed from your favorites.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b4cca',
        background: '#fff',
        customClass: {
          popup: 'rounded-xl shadow-xl',
          title: 'text-poke-blue font-2p',
          confirmButton: 'px-6 py-2 text-white rounded-full shadow-md hover:bg-poke-blue-dark',
        },
      });
    } catch (error) {
      console.error('Error removing from favorites:', error.message);
      Swal.fire({
        title: 'Error',
        text: `Failed to remove from favorites: ${error.message}. Please try again.`,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b4cca',
        background: '#fff',
        customClass: {
          popup: 'rounded-xl shadow-xl',
          title: 'text-poke-blue font-2p',
          confirmButton: 'px-6 py-2 text-white rounded-full shadow-md hover:bg-poke-blue-dark',
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-poke-blue">My Favorites</h2>
        {favorites.length === 0 ? (
          <p className="text-poke-blue">You have no favorite Pokémon. Add some!</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {favorites.map((pokemon) => (
              <li key={pokemon.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                <div className="flex items-center">
                {pokemon.sprites && pokemon.sprites.front_default && (
  <img
    src={pokemon.sprites.front_default}
    alt={pokemon.name}
    className="w-12 h-12 mr-2"
  />
)}
                  <span className="capitalize text-poke-blue">{pokemon.name}</span>
                </div>
                <button
                  onClick={() => removeFromFavorites(pokemon.id)}
                  className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 mt-4 text-white rounded bg-poke-blue hover:bg-poke-blue-dark"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Favorites;
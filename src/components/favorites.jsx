import React from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const Favorites = ({ favorites, setFavorites, setError, setLastFailedAction, setLastFailedPokemon }) => {
  const removeFromFavorites = async (pokemonId, pokemonName) => {
    console.log(`Attempting to remove Pokémon ID: ${pokemonId}, Name: ${pokemonName}`);
    try {
      const pokemonToRemove = favorites.find((p) => p.id === pokemonId);
      if (!pokemonToRemove) {
        console.log(`Pokémon ${pokemonName} not found in client-side favorites.`);
        Swal.fire({
          title: 'Not Found',
          text: `${pokemonName} is not in your favorites.`,
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3b4cca',
          background: '#fff',
          customClass: {
            popup: 'rounded-xl shadow-xl',
            title: 'text-poke-blue font-2p',
            confirmButton: 'px-6 py-2 text-white rounded-full shadow-md hover:bg-poke-blue-dark',
          },
        });
        return;
      }

      console.log(`Sending DELETE request to http://localhost:3001/favorites/${pokemonId}`);
      const response = await axios.delete(`http://localhost:3001/favorites/${pokemonId}`);
      console.log('DELETE response:', response.data);

      const newFavorites = favorites.filter((pokemon) => pokemon.id !== pokemonId);
      setFavorites(newFavorites);
      console.log(`Pokémon ${pokemonName} removed from client-side favorites.`);
      Swal.fire({
        title: 'Removed from Favorites',
        html: `You removed <strong>${pokemonName}</strong> from your favorites!`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#a848c8',
        background: '#fff',
        customClass: {
          popup: 'rounded-xl shadow-xl',
          title: 'text-poke-blue font-2p',
          htmlContainer: 'text-poke-blue',
          confirmButton: 'px-6 py-2 text-white rounded-full shadow-md hover:bg-poke-purple-dark',
        },
      });

      console.log('Resyncing favorites with server...');
      try {
        const favoritesRes = await axios.get('http://localhost:3001/favorites');
        setFavorites(favoritesRes.data || []);
        console.log('Favorites resynced:', favoritesRes.data);
      } catch (syncError) {
        console.error('Error syncing favorites after deletion:', syncError.message);
        setError(`Favorites sync failed after removal: ${syncError.message}. Data may be inconsistent.`);
        setLastFailedAction('syncFavoritesAfterRemove');
      }
    } catch (error) {
      console.error(`Error removing ${pokemonName} from favorites:`, error.message, error.response?.status);
      setError(`Failed to remove ${pokemonName} from favorites: ${error.message}. Please try again.`);
      setLastFailedAction('removeFromFavorites');
      setLastFailedPokemon({ id: pokemonId, name: pokemonName });

      console.log('Resyncing favorites after failed deletion...');
      try {
        const favoritesRes = await axios.get('http://localhost:3001/favorites');
        setFavorites(favoritesRes.data || []);
        console.log('Favorites resynced after error:', favoritesRes.data);
      } catch (syncError) {
        console.error('Error syncing favorites after failed deletion:', syncError.message);
        setError(`Failed to sync favorites: ${syncError.message}. Data may be inconsistent.`);
        setLastFailedAction('syncFavoritesAfterRemove');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {favorites.length === 0 ? (
        <p className="text-center text-gray-600">You have no favorite Pokémon.</p>
      ) : (
        favorites.map((pokemon) => (
          <div key={pokemon.id} className="p-4 bg-gray-100 rounded-lg shadow-md">
            <img
              src={pokemon.sprites.front_default}
              alt={pokemon.name}
              className="w-20 h-20 mx-auto sm:w-24 sm:h-24"
            />
            <h3 className="mt-2 text-lg font-semibold text-center capitalize text-poke-blue sm:text-xl">
              {pokemon.name}
            </h3>
            <div className="flex justify-center gap-2 mt-2">
              <button
                onClick={() => removeFromFavorites(pokemon.id, pokemon.name)}
                className="px-3 py-1 text-sm text-white rounded-lg bg-poke-red hover:bg-poke-red-dark sm:px-4 sm:py-2 sm:text-base"
              >
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Favorites;
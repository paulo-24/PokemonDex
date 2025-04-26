/* eslint-disable no-unused-vars */
import React from 'react';
import Swal from 'sweetalert2';
import axios from 'axios';

const Team = ({ team, setTeam, onClose, isSmallScreen }) => {
  const removeFromTeam = async (pokemonId) => {
    try {
      const response = await axios.delete(`${import.meta.env.REACT_APP_API_URL}/team/${pokemonId}`);
      console.log('Server response after removing from team:', response.data);
      const newTeam = team.filter((pokemon) => pokemon.id !== pokemonId);
      setTeam(newTeam);
      Swal.fire({
        title: 'Removed from Team!',
        text: 'The Pokémon has been removed from your team.',
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
      console.error('Error removing from team:', error.message);
      Swal.fire({
        title: 'Error',
        text: `Failed to remove from team: ${error.message}. Please try again.`,
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
        <h2 className="mb-4 text-2xl font-bold text-poke-blue">My Team</h2>
        {team.length === 0 ? (
          <p className="text-poke-blue">Your team is empty. Add some Pokémon!</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {team.map((pokemon) => (
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
                  onClick={() => removeFromTeam(pokemon.id)}
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

export default Team;
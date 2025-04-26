import React from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const Team = ({ team, setTeam, setError, setLastFailedAction, setLastFailedPokemon }) => {
  const removeFromTeam = async (pokemonId, pokemonName) => {
    console.log(`Attempting to remove Pokémon ID: ${pokemonId}, Name: ${pokemonName}`);
    try {
      const pokemonToRemove = team.find((p) => p.id === pokemonId);
      if (!pokemonToRemove) {
        console.log(`Pokémon ${pokemonName} not found in client-side team.`);
        Swal.fire({
          title: 'Not Found',
          text: `${pokemonName} is not in your team.`,
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

      console.log(`Sending DELETE request to http://localhost:3001/team/${pokemonId}`);
      const response = await axios.delete(`http://localhost:3001/team/${pokemonId}`);
      console.log('DELETE response:', response.data);

      const newTeam = team.filter((pokemon) => pokemon.id !== pokemonId);
      setTeam(newTeam);
      console.log(`Pokémon ${pokemonName} removed from client-side team.`);
      Swal.fire({
        title: 'Removed from Team',
        html: `You removed <strong>${pokemonName}</strong> from your team!`,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#78c850',
        background: '#fff',
        customClass: {
          popup: 'rounded-xl shadow-xl',
          title: 'text-poke-blue font-2p',
          htmlContainer: 'text-poke-blue',
          confirmButton: 'px-6 py-2 text-white rounded-full shadow-md hover:bg-poke-green-dark',
        },
      });

      console.log('Resyncing team with server...');
      try {
        const teamRes = await axios.get('http://localhost:3001/team');
        setTeam(teamRes.data || []);
        console.log('Team resynced:', teamRes.data);
      } catch (syncError) {
        console.error('Error syncing team after deletion:', syncError.message);
        setError(`Team sync failed after removal: ${syncError.message}. Data may be inconsistent.`);
        setLastFailedAction('syncTeamAfterRemove');
      }
    } catch (error) {
      console.error(`Error removing ${pokemonName} from team:`, error.message, error.response?.status);
      setError(`Failed to remove ${pokemonName} from team: ${error.message}. Please try again.`);
      setLastFailedAction('removeFromTeam');
      setLastFailedPokemon({ id: pokemonId, name: pokemonName });

      console.log('Resyncing team after failed deletion...');
      try {
        const teamRes = await axios.get('http://localhost:3001/team');
        setTeam(teamRes.data || []);
        console.log('Team resynced after error:', teamRes.data);
      } catch (syncError) {
        console.error('Error syncing team after failed deletion:', syncError.message);
        setError(`Failed to sync team: ${syncError.message}. Data may be inconsistent.`);
        setLastFailedAction('syncTeamAfterRemove');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {team.length === 0 ? (
        <p className="text-center text-gray-600">Your team is empty.</p>
      ) : (
        team.map((pokemon) => (
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
                onClick={() => removeFromTeam(pokemon.id, pokemon.name)}
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

export default Team;
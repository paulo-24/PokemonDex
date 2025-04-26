/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import debounce from 'lodash.debounce';
import Swal from 'sweetalert2';
import PokemonList from './components/PokemonList';
import PokemonDetails from './components/PokemonDetails';
import Team from './components/Team';
import Favorites from './components/Favorites';
import Battle from './components/Battle';
import './App.css';

// Configure axios-retry for all requests
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response && error.response.status >= 400);
  },
});

const App = () => {
  const [pokemonList, setPokemonList] = useState([]);
  const [allPokemon, setAllPokemon] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [team, setTeam] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [battleHistory, setBattleHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFailedAction, setLastFailedAction] = useState(null);
  const [lastFailedPokemon, setLastFailedPokemon] = useState(null);
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [pokemon1, setPokemon1] = useState(null);
  const [pokemon2, setPokemon2] = useState(null);
  const [opponentSearch, setOpponentSearch] = useState(''); // New state for opponent search input
  const [battleResult, setBattleResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [battleLog, setBattleLog] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [playerMove, setPlayerMove] = useState('Tackle');
  const [battleMode, setBattleMode] = useState('damage');
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 640);
  const limit = 20;

  // Determine if the screen is small (< 640px)
  const updateScreenSize = () => {
    const width = window.innerWidth;
    const smallScreen = width < 640;
    console.log(`Window width: ${width}px, isSmallScreen: ${smallScreen}`);
    setIsSmallScreen(smallScreen);
  };

  useEffect(() => {
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const fetchAllPokemon = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1000');
      const results = response.data.results;
      const detailedPokemon = await Promise.all(
        results.map(async (pokemon) => {
          const res = await axios.get(pokemon.url);
          return res.data;
        })
      );
      setAllPokemon(detailedPokemon);
    } catch (error) {
      console.error('Error fetching all Pokémon:', error.message);
      setError(`Failed to fetch Pokémon: ${error.message || 'Network Error'}. Please try again later.`);
      setLastFailedAction('fetchAllPokemon');
    } finally {
      setLoading(false);
    }
  };

  const fetchPokemon = async () => {
    if (!search) {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${(page - 1) * limit}`);
        const results = response.data.results;
        const detailedPokemon = await Promise.all(
          results.map(async (pokemon) => {
            const res = await axios.get(pokemon.url);
            return res.data;
          })
        );
        setPokemonList(detailedPokemon);
      } catch (error) {
        console.error('Error fetching paginated Pokémon:', error.message);
        setError(`Failed to fetch Pokémon: ${error.message || 'Network Error'}. Please try again later.`);
        setLastFailedAction('fetchPokemon');
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchData = async () => {
    try {
      const teamRes = await axios.get('http://localhost:3001/team');
      const favoritesRes = await axios.get('http://localhost:3001/favorites');
      const battleRes = await axios.get('http://localhost:3001/battleHistory');
      setTeam(teamRes.data || []);
      setFavorites(favoritesRes.data || []);
      setBattleHistory(battleRes.data || []);
    } catch (error) {
      console.error('Error fetching data from json-server:', error.message);
      setError(`Failed to fetch team, favorites, or battle data: ${error.message}. Ensure json-server is running at http://localhost:3001.`);
      setLastFailedAction('fetchData');
    }
  };

  const syncStateWithServer = async () => {
    try {
      const teamRes = await axios.get('http://localhost:3001/team');
      const favoritesRes = await axios.get('http://localhost:3001/favorites');
      setTeam(teamRes.data || []);
      setFavorites(favoritesRes.data || []);
      Swal.fire({
        title: 'State Synced',
        text: 'Your team and favorites have been synced with the server.',
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
      console.error('Error syncing state with server:', error.message);
      setError(`Failed to sync state: ${error.message}. Ensure json-server is running.`);
      setLastFailedAction('syncStateWithServer');
    }
  };

  useEffect(() => {
    fetchAllPokemon();
  }, []);

  useEffect(() => {
    fetchPokemon();
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, []);

  const debouncedSearch = useCallback(
    debounce((query) => {
      if (query) {
        const filteredPokemon = allPokemon.filter((pokemon) =>
          pokemon.name.toLowerCase().includes(query.toLowerCase())
        );
        setPokemonList(filteredPokemon);
        setLoading(false);
      } else {
        setPage(1);
        fetchPokemon();
      }
    }, 500),
    [allPokemon]
  );

  const handleSearch = (e) => {
    const query = e.target.value.trim();
    setSearch(query);
    if (query) {
      setLoading(true);
      debouncedSearch(query);
    } else {
      setPage(1);
      fetchPokemon();
    }
  };

  const addToTeam = async (pokemon) => {
    if (team.length < 6 && !team.find((p) => p.pokeApiId === pokemon.id)) {
      try {
        // Remove the id field to let json-server assign a new one
        const pokemonToAdd = { ...pokemon, pokeApiId: pokemon.id };
        delete pokemonToAdd.id; // Remove the PokeAPI id field to avoid conflicts
        console.log('Adding to team with pokeApiId:', pokemonToAdd.pokeApiId, 'Name:', pokemonToAdd.name);

        const response = await axios.post('http://localhost:3001/team', pokemonToAdd);
        console.log('Server response after adding to team:', response.data);

        // Use the server-assigned id and retain pokeApiId for reference
        const savedPokemon = { ...pokemonToAdd, id: response.data.id };
        const newTeam = [...team, savedPokemon];
        setTeam(newTeam);
        Swal.fire({
          title: 'Added to Team!',
          html: `You added <strong>${pokemon.name}</strong> to your team!`,
          icon: 'success',
          confirmButtonText: 'Awesome!',
          confirmButtonColor: '#78c850',
          background: '#fff',
          customClass: {
            popup: 'rounded-xl shadow-xl',
            title: 'text-poke-blue font-2p',
            htmlContainer: 'text-poke-blue',
            confirmButton: 'px-6 py-2 text-white rounded-full shadow-md hover:bg-poke-green-dark',
          },
        });
      } catch (error) {
        console.error('Error adding to team:', error.message);
        setError(`Failed to add to team: ${error.message}. Ensure json-server is running.`);
        setLastFailedAction('addToTeam');
        setLastFailedPokemon(pokemon);
      }
    } else {
      Swal.fire({
        title: 'Cannot Add Pokémon',
        text: team.length >= 6 ? 'Your team is full (max 6 Pokémon)!' : 'This Pokémon is already in your team!',
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
    }
  };

  const addToFavorites = async (pokemon) => {
    if (!favorites.find((p) => p.pokeApiId === pokemon.id)) {
      try {
        // Remove the id field to let json-server assign a new one
        const pokemonToAdd = { ...pokemon, pokeApiId: pokemon.id };
        delete pokemonToAdd.id; // Remove the PokeAPI id field to avoid conflicts
        console.log('Adding to favorites with pokeApiId:', pokemonToAdd.pokeApiId, 'Name:', pokemonToAdd.name);

        const response = await axios.post('http://localhost:3001/favorites', pokemonToAdd);
        console.log('Server response after adding to favorites:', response.data);

        // Use the server-assigned id and retain pokeApiId for reference
        const savedPokemon = { ...pokemonToAdd, id: response.data.id };
        const newFavorites = [...favorites, savedPokemon];
        setFavorites(newFavorites);
        Swal.fire({
          title: 'Added to Favorites!',
          html: `You added <strong>${pokemon.name}</strong> to your Favorites!`,
          icon: 'success',
          confirmButtonText: 'Great!',
          confirmButtonColor: '#a848c8',
          background: '#fff',
          customClass: {
            popup: 'rounded-xl shadow-xl',
            title: 'text-poke-blue font-2p',
            htmlContainer: 'text-poke-blue',
            confirmButton: 'px-6 py-2 text-white rounded-full shadow-md hover:bg-poke-purple-dark',
          },
        });
      } catch (error) {
        console.error('Error adding to favorites:', error.message);
        setError(`Failed to add to favorites: ${error.message}. Ensure json-server is running.`);
        setLastFailedAction('addToFavorites');
        setLastFailedPokemon(pokemon);
      }
    } else {
      Swal.fire({
        title: 'Already Favorited',
        text: 'This Pokémon is already in your Favorites!',
        icon: 'info',
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

  const typeEffectiveness = {
    Normal: { Normal: 1, Fire: 1, Water: 1, Grass: 1 },
    Fire: { Normal: 1, Fire: 0.5, Water: 0.5, Grass: 2 },
    Water: { Normal: 1, Fire: 2, Water: 0.5, Grass: 0.5 },
    Grass: { Normal: 1, Fire: 0.5, Water: 2, Grass: 0.5 },
  };

  const moves = [
    { name: 'Tackle', type: 'Normal', power: 1 },
    { name: 'Scratch', type: 'Normal', power: 1.1 },
    { name: 'Ember', type: 'Fire', power: 1.2 },
    { name: 'Vine Whip', type: 'Grass', power: 1.2 },
    { name: 'Water Gun', type: 'Water', power: 1.2 },
  ];

  const getTypeEffectiveness = (moveType, defenderTypes) => {
    let effectiveness = 1;
    defenderTypes.forEach((type) => {
      if (typeEffectiveness[moveType] && typeEffectiveness[moveType][type]) {
        effectiveness *= typeEffectiveness[moveType][type];
      }
    });
    return effectiveness;
  };

  const simulateBattle = async () => {
    if (pokemon1 && pokemon2) {
      if (pokemon1.name === pokemon2.name) {
        Swal.fire({
          title: 'Invalid Selection',
          text: 'You cannot battle the same Pokémon!',
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
      let winner;
      let log = [];

      if (battleMode === 'stat') {
        let roundsWonByPokemon1 = 0;
        let roundsWonByPokemon2 = 0;

        if (pokemon1.stats[0].base_stat > pokemon2.stats[0].base_stat) {
          roundsWonByPokemon1++;
          log.push({
            round: 1,
            stat: 'HP',
            winner: pokemon1.name,
            value1: pokemon1.stats[0].base_stat,
            value2: pokemon2.stats[0].base_stat,
          });
        } else {
          roundsWonByPokemon2++;
          log.push({
            round: 1,
            stat: 'HP',
            winner: pokemon2.name,
            value1: pokemon1.stats[0].base_stat,
            value2: pokemon2.stats[0].base_stat,
          });
        }

        if (pokemon1.stats[1].base_stat > pokemon2.stats[1].base_stat) {
          roundsWonByPokemon1++;
          log.push({
            round: 2,
            stat: 'Attack',
            winner: pokemon1.name,
            value1: pokemon1.stats[1].base_stat,
            value2: pokemon2.stats[1].base_stat,
          });
        } else {
          roundsWonByPokemon2++;
          log.push({
            round: 2,
            stat: 'Attack',
            winner: pokemon2.name,
            value1: pokemon1.stats[1].base_stat,
            value2: pokemon2.stats[1].base_stat,
          });
        }

        if (pokemon1.stats[5].base_stat > pokemon2.stats[5].base_stat) {
          roundsWonByPokemon1++;
          log.push({
            round: 3,
            stat: 'Speed',
            winner: pokemon1.name,
            value1: pokemon1.stats[5].base_stat,
            value2: pokemon2.stats[5].base_stat,
          });
        } else {
          roundsWonByPokemon2++;
          log.push({
            round: 3,
            stat: 'Speed',
            winner: pokemon2.name,
            value1: pokemon1.stats[5].base_stat,
            value2: pokemon2.stats[5].base_stat,
          });
        }

        winner = roundsWonByPokemon1 >= 2 ? pokemon1.name : pokemon2.name;
      } else {
        let health1 = pokemon1.stats[0].base_stat;
        let health2 = pokemon2.stats[0].base_stat;
        const speed1 = pokemon1.stats[5].base_stat;
        const speed2 = pokemon2.stats[5].base_stat;
        const firstAttacker = speed1 >= speed2 ? pokemon1 : pokemon2;
        const secondAttacker = firstAttacker === pokemon1 ? pokemon2 : pokemon1;

        let turn = 1;

        while (health1 > 0 && health2 > 0) {
          let move1;
          let multiplier1;
          if (firstAttacker === pokemon1) {
            move1 = moves.find((m) => m.name === playerMove);
            multiplier1 = 1;
          } else {
            const opponentHealth = firstAttacker === pokemon1 ? health2 : health1;
            const strongMoves = moves.filter((m) => m.power >= 1.2);
            const normalMoves = moves.filter((m) => m.power < 1.2);
            move1 = opponentHealth <= 20 && strongMoves.length > 0
              ? strongMoves[Math.floor(Math.random() * strongMoves.length)]
              : moves[Math.floor(Math.random() * moves.length)];
            multiplier1 = 0.8 + Math.random() * 0.4;
          }

          const effectiveness1 = getTypeEffectiveness(
            move1.type,
            firstAttacker === pokemon1 ? pokemon2.types.map((t) => t.type.name) : pokemon1.types.map((t) => t.type.name)
          );
          const damage1 = Math.max(1, Math.floor(((firstAttacker.stats[1].base_stat / 2) - (secondAttacker.stats[2].base_stat / 4)) * multiplier1 * move1.power * effectiveness1));
          if (firstAttacker === pokemon1) {
            health2 -= damage1;
            log.push({
              turn,
              attacker: pokemon1.name,
              defender: pokemon2.name,
              move: move1.name,
              damage: damage1,
              effectiveness: effectiveness1,
              health1,
              health2: Math.max(0, health2),
            });
          } else {
            health1 -= damage1;
            log.push({
              turn,
              attacker: pokemon2.name,
              defender: pokemon1.name,
              move: move1.name,
              damage: damage1,
              effectiveness: effectiveness1,
              health1: Math.max(0, health1),
              health2,
            });
          }

          if (health1 > 0 && health2 > 0) {
            let move2;
            let multiplier2;
            if (secondAttacker === pokemon1) {
              move2 = moves.find((m) => m.name === playerMove);
              multiplier2 = 1;
            } else {
              const opponentHealth = secondAttacker === pokemon1 ? health2 : health1;
              const strongMoves = moves.filter((m) => m.power >= 1.2);
              const normalMoves = moves.filter((m) => m.power < 1.2);
              move2 = opponentHealth <= 20 && strongMoves.length > 0
                ? strongMoves[Math.floor(Math.random() * strongMoves.length)]
                : moves[Math.floor(Math.random() * moves.length)];
              multiplier2 = 0.8 + Math.random() * 0.4;
            }

            const effectiveness2 = getTypeEffectiveness(
              move2.type,
              secondAttacker === pokemon1 ? pokemon2.types.map((t) => t.type.name) : pokemon1.types.map((t) => t.type.name)
            );
            const damage2 = Math.max(1, Math.floor(((secondAttacker.stats[1].base_stat / 2) - (firstAttacker.stats[2].base_stat / 4)) * multiplier2 * move2.power * effectiveness2));
            if (secondAttacker === pokemon1) {
              health2 -= damage2;
              log.push({
                turn,
                attacker: pokemon1.name,
                defender: pokemon2.name,
                move: move2.name,
                damage: damage2,
                effectiveness: effectiveness2,
                health1,
                health2: Math.max(0, health2),
              });
            } else {
              health1 -= damage2;
              log.push({
                turn,
                attacker: pokemon2.name,
                defender: pokemon1.name,
                move: move2.name,
                damage: damage2,
                effectiveness: effectiveness2,
                health1: Math.max(0, health1),
                health2,
              });
            }
          }

          turn++;
        }

        winner = health1 > 0 ? pokemon1.name : pokemon2.name;
      }

      const battleResult = {
        pokemon1: pokemon1.name,
        pokemon2: pokemon2.name,
        winner: winner,
        mode: battleMode,
        date: new Date().toISOString(),
      };

      setBattleLog(log);
      setCurrentTurn(0);

      try {
        const response = await axios.post('http://localhost:3001/battleHistory', battleResult);
        const savedBattle = response.data;
        setBattleHistory([...battleHistory, savedBattle]);
        setBattleResult(savedBattle);
      } catch (error) {
        console.error('Error saving battle result:', error.message);
        setError(`Failed to save battle result: ${error.message}. Ensure json-server is running.`);
        setLastFailedAction('simulateBattle');
      }
    } else {
      Swal.fire({
        title: 'Select Pokémon',
        text: 'Please select two Pokémon to battle!',
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
    }
  };

  const startRandomBattle = () => {
    if (team.length < 1) {
      Swal.fire({
        title: 'Not Enough Pokémon',
        text: 'You need at least one Pokémon in your team to start a battle!',
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
    const randomTeamIndex = Math.floor(Math.random() * team.length);
    const randomOpponentIndex = Math.floor(Math.random() * allPokemon.length);
    setPokemon1(team[randomTeamIndex]);
    setPokemon2(allPokemon[randomOpponentIndex]);
    setOpponentSearch(allPokemon[randomOpponentIndex].name); // Update input field
    Swal.fire({
      title: 'Random Battle!',
      html: `Selected <strong>${team[randomTeamIndex].name}</strong> vs <strong>${allPokemon[randomOpponentIndex].name}</strong>!`,
      icon: 'info',
      confirmButtonText: 'Ready!',
      confirmButtonColor: '#ee6b2f',
      background: '#fff',
      customClass: {
        popup: 'rounded-xl shadow-xl',
        title: 'text-poke-blue font-2p',
        htmlContainer: 'text-poke-blue',
        confirmButton: 'px-6 py-2 text-white rounded-full shadow-md hover:bg-poke-red-dark',
      },
    });
  };

  const removeFromBattleHistory = async (battleId) => {
    try {
      const updatedHistory = battleHistory.filter((battle) => battle.id !== battleId);
      setBattleHistory(updatedHistory);
      await axios.delete(`http://localhost:3001/battleHistory/${battleId}`);
      Swal.fire({
        title: 'Battle Removed',
        text: 'The battle has been removed from your history.',
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
      console.error('Error removing battle from history:', error.message);
      setError(`Failed to remove battle from history: ${error.response?.status === 404 ? 'Battle not found.' : error.message}. Ensure json-server is running at http://localhost:3001.`);
      setLastFailedAction('removeFromBattleHistory');
      fetchData();
    }
  };

  const handleSelectPokemon = (pokemon) => {
    setSelectedPokemon(pokemon);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPokemon(null);
    setPokemon2(null);
    setOpponentSearch(''); // Reset opponent search
  };

  const closeTeamModal = () => {
    setShowTeamModal(false);
  };

  const closeFavoritesModal = () => {
    setShowFavoritesModal(false);
  };

  const closeBattleModal = () => {
    setShowBattleModal(false);
    setPokemon1(null);
    setPokemon2(null);
    setOpponentSearch(''); // Reset opponent search
    setBattleResult(null);
    setShowHistory(false);
    setBattleLog([]);
    setCurrentTurn(0);
    setPlayerMove('Tackle');
  };

  const handleRetry = () => {
    setError(null);
    Swal.fire({
      title: 'Retrying...',
      text: 'Attempting to perform the action again!',
      icon: 'info',
      timer: 1500,
      showConfirmButton: false,
      background: '#fff',
      customClass: {
        popup: 'rounded-xl shadow-xl',
        title: 'text-poke-blue font-2p',
      },
    });
    switch (lastFailedAction) {
      case 'fetchAllPokemon':
        fetchAllPokemon();
        break;
      case 'fetchPokemon':
        fetchPokemon();
        break;
      case 'fetchData':
        fetchData();
        break;
      case 'addToTeam':
        if (lastFailedPokemon) addToTeam(lastFailedPokemon);
        break;
      case 'addToFavorites':
        if (lastFailedPokemon) addToFavorites(lastFailedPokemon);
        break;
      case 'simulateBattle':
        simulateBattle();
        break;
      case 'removeFromBattleHistory':
        fetchData();
        break;
      case 'removeFromTeam':
      case 'removeFromFavorites':
      case 'syncTeamAfterRemove':
      case 'syncFavoritesAfterRemove':
        syncStateWithServer();
        break;
      default:
        fetchAllPokemon();
        fetchPokemon();
        fetchData();
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      } else if (e.key === 'Escape' && showTeamModal) {
        closeTeamModal();
      } else if (e.key === 'Escape' && showFavoritesModal) {
        closeFavoritesModal();
      } else if (e.key === 'Escape' && showBattleModal) {
        closeBattleModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showModal, showTeamModal, showFavoritesModal, showBattleModal]);

  useEffect(() => {
    if (battleLog.length > 0 && currentTurn < battleLog.length) {
      const timer = setTimeout(() => {
        setCurrentTurn(currentTurn + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [battleLog, currentTurn]);

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 mt-4 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container min-h-screen p-4 mx-auto">
      <h1 className="mb-4 text-4xl font-bold text-center text-poke-yellow drop-shadow-lg sm:text-5xl font-2p">Pokémon Mini Dex</h1>
      <img src="/src/assets/pokedex.png" alt="Pokédex Logo" className="w-24 mx-auto mb-6 animate-bounce sm:w-32" />
      <div className="flex flex-wrap justify-center gap-3 mt-4 mb-6">
        <button
          onClick={() => setShowTeamModal(true)}
          className="flex-1 px-4 py-2 text-white transition-colors rounded-full shadow-md sm:flex-none bg-poke-blue hover:bg-poke-blue-dark sm:px-6 sm:py-3"
        >
          Your Team
        </button>
        <button
          onClick={() => setShowFavoritesModal(true)}
          className="flex-1 px-4 py-2 text-white transition-colors rounded-full shadow-md sm:flex-none bg-poke-purple hover:bg-poke-purple-dark sm:px-6 sm:py-3"
        >
          Favorites
        </button>
        <button
          onClick={() => setShowBattleModal(true)}
          className="flex-1 px-4 py-2 text-white transition-colors rounded-full shadow-md sm:flex-none bg-poke-green hover:bg-poke-green-dark sm:px-6 sm:py-3"
        >
          Start Battle
        </button>
      </div>
      <input
        type="text"
        value={search}
        onChange={handleSearch}
        placeholder="Search Pokémon..."
        className="w-full max-w-md p-2 mx-auto mb-6 border-2 rounded-lg shadow-sm border-poke-blue focus:outline-none focus:border-poke-yellow sm:p-3 sm:max-w-lg"
      />

      {loading ? (
        <div className="p-4 font-semibold text-center text-poke-blue">Loading...</div>
      ) : (
        <>
          <PokemonList
            pokemonList={pokemonList}
            onSelectPokemon={handleSelectPokemon}
            onAddToTeam={addToTeam}
            onAddToFavorites={addToFavorites}
            setPage={setPage}
            page={page}
            limit={limit}
          />
          {!isSmallScreen && !search && (
            <div className="flex justify-center hidden gap-3 mt-6 sm:block">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 text-white transition-colors bg-gray-500 rounded-full shadow-md hover:bg-gray-600 disabled:opacity-50 sm:px-6 sm:py-3"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={pokemonList.length < limit}
                className="px-4 py-2 text-white transition-colors bg-gray-500 rounded-full shadow-md hover:bg-gray-600 disabled:opacity-50 sm:px-6 sm:py-3"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {team.length < 2 && (
        <div className="mt-8 text-center text-poke-blue">
          <p>Add at least 2 Pokémon to your team to unlock the Battle Arena!</p>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="relative w-11/12 max-w-md max-h-[90vh] p-4 bg-white shadow-xl rounded-xl sm:p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute text-gray-600 transition-colors top-3 right-3 hover:text-gray-800"
              aria-label="Close modal"
            >
              ✕
            </button>
            <PokemonDetails pokemon={selectedPokemon} onAddToTeam={addToTeam} />
            <div className="sticky bottom-0 pt-2 mt-4 text-center bg-white">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-white transition-colors bg-gray-500 rounded-full shadow-md hover:bg-gray-600 sm:px-6 sm:py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeTeamModal}
        >
          <div
            className="relative w-11/12 max-w-md max-h-[90vh] p-4 bg-white shadow-xl rounded-xl sm:p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeTeamModal}
              className="absolute text-gray-600 transition-colors top-3 right-3 hover:text-gray-800"
              aria-label="Close modal"
            >
              ✕
            </button>
            <h2 className="mb-4 text-xl font-bold text-poke-blue sm:text-2xl">
              Your Team ({team.length}/6)
            </h2>
            <Team
              team={team}
              setTeam={setTeam}
              setError={setError}
              setLastFailedAction={setLastFailedAction}
              setLastFailedPokemon={setLastFailedPokemon}
            />
            <div className="sticky bottom-0 pt-2 mt-4 text-center bg-white">
              <button
                onClick={closeTeamModal}
                className="px-4 py-2 text-white transition-colors bg-gray-500 rounded-full shadow-md hover:bg-gray-600 sm:px-6 sm:py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showFavoritesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeFavoritesModal}
        >
          <div
            className="relative w-11/12 max-w-md max-h-[90vh] p-4 bg-white shadow-xl rounded-xl sm:p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeFavoritesModal}
              className="absolute text-gray-600 transition-colors top-3 right-3 hover:text-gray-800"
              aria-label="Close modal"
            >
              ✕
            </button>
            <h2 className="mb-4 text-xl font-bold text-poke-blue sm:text-2xl">
              Favorites ({favorites.length})
            </h2>
            <Favorites
              favorites={favorites}
              setFavorites={setFavorites}
              setError={setError}
              setLastFailedAction={setLastFailedAction}
              setLastFailedPokemon={setLastFailedPokemon}
            />
            <div className="sticky bottom-0 pt-2 mt-4 text-center bg-white">
              <button
                onClick={closeFavoritesModal}
                className="px-4 py-2 text-white transition-colors bg-gray-500 rounded-full shadow-md hover:bg-gray-600 sm:px-6 sm:py-3"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showBattleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeBattleModal}
        >
          <div
            className="relative w-11/12 max-w-md p-4 bg-white shadow-xl rounded-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeBattleModal}
              className="absolute text-gray-600 transition-colors top-3 right-3 hover:text-gray-800"
              aria-label="Close modal"
            >
              ✕
            </button>
            {!battleResult && !showHistory ? (
              <div>
                <h3 className="mb-4 text-xl font-bold text-center text-poke-blue sm:text-2xl">Select Pokémon to Battle</h3>
                <div className="flex flex-col gap-4 mb-4 sm:flex-row">
                  {/* Your Pokémon (from Team) */}
                  <div className="flex-1">
                    <label className="block mb-1 text-sm font-semibold text-gray-700 sm:mb-2 sm:text-base">Your Pokémon:</label>
                    <select
                      onChange={(e) => setPokemon1(team.find((p) => p.name === e.target.value))}
                      value={pokemon1 ? pokemon1.name : ''}
                      className="w-full p-2 text-sm border-2 rounded-lg shadow-sm border-poke-blue focus:outline-none focus:border-poke-yellow sm:p-3 sm:text-base"
                    >
                      <option value="">Select Your Pokémon</option>
                      {team.map((pokemon) => (
                        <option key={pokemon.id} value={pokemon.name}>
                          {pokemon.name}
                        </option>
                      ))}
                    </select>
                    {pokemon1 && (
                      <div className="mt-2 text-center">
                        <img
                          src={pokemon1.sprites.front_default}
                          alt={pokemon1.name}
                          className="w-20 h-20 mx-auto sm:w-24 sm:h-24"
                        />
                        <p className="mt-1 text-sm font-semibold capitalize text-poke-blue sm:text-base">{pokemon1.name}</p>
                      </div>
                    )}
                  </div>
                  {/* Opponent Pokémon (from PokeAPI) */}
                  <div className="relative flex-1">
                    <label className="block mb-1 text-sm font-semibold text-gray-700 sm:mb-2 sm:text-base">Opponent:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={allPokemon.length === 0 ? 'Loading Pokémon...' : 'Search for an opponent...'}
                        value={opponentSearch}
                        onChange={(e) => {
                          const query = e.target.value;
                          setOpponentSearch(query);
                          const filtered = allPokemon.find((p) => p.name.toLowerCase() === query.toLowerCase());
                          if (filtered) {
                            setPokemon2(filtered);
                          } else {
                            setPokemon2(null); // Clear selection if no exact match
                          }
                        }}
                        onFocus={() => {
                          document.getElementById('opponent-dropdown').style.display = 'block';
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            document.getElementById('opponent-dropdown').style.display = 'none';
                          }, 200);
                        }}
                        className="w-full p-2 text-sm border-2 rounded-lg shadow-sm border-poke-blue focus:outline-none focus:border-poke-yellow sm:p-3 sm:text-base"
                        disabled={allPokemon.length === 0}
                      />
                      <div
                        id="opponent-dropdown"
                        className="absolute z-10 hidden w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-48"
                      >
                        {allPokemon.length === 0 ? (
                          <div className="p-2 text-center text-gray-500">Loading Pokémon...</div>
                        ) : (
                          allPokemon
                            .filter((pokemon) =>
                              pokemon.name.toLowerCase().includes(opponentSearch.toLowerCase())
                            )
                            .map((pokemon) => (
                              <div
                                key={pokemon.id}
                                className="p-2 capitalize cursor-pointer hover:bg-gray-100"
                                onMouseDown={() => {
                                  setPokemon2(pokemon);
                                  setOpponentSearch(pokemon.name); // Update input to show selected Pokémon's name
                                  document.getElementById('opponent-dropdown').style.display = 'none';
                                }}
                              >
                                {pokemon.name}
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                    {pokemon2 && (
                      <div className="mt-2 text-center">
                        <img
                          src={pokemon2.sprites.front_default}
                          alt={pokemon2.name}
                          className="w-20 h-20 mx-auto sm:w-24 sm:h-24"
                        />
                        <p className="mt-1 text-sm font-semibold capitalize text-poke-blue sm:text-base">{pokemon2.name}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center mb-4">
                  <label className="block mb-1 text-sm font-semibold text-gray-700 sm:mb-2 sm:text-base">Battle Mode:</label>
                  <select
                    onChange={(e) => setBattleMode(e.target.value)}
                    value={battleMode}
                    className="w-full max-w-xs p-2 text-sm border-2 rounded-lg shadow-sm border-poke-blue focus:outline-none focus:border-poke-yellow sm:p-3 sm:text-base"
                  >
                    <option value="damage">Damage-Based Battle</option>
                    <option value="stat">Stat Comparison Battle</option>
                  </select>
                </div>
                {battleMode === 'damage' && (
                  <div className="flex flex-col items-center mb-4">
                    <label className="block mb-1 text-sm font-semibold text-gray-700 sm:mb-2 sm:text-base">Select Your Move:</label>
                    <select
                      onChange={(e) => setPlayerMove(e.target.value)}
                      value={playerMove}
                      className="w-full max-w-xs p-2 text-sm border-2 rounded-lg shadow-sm border-poke-blue focus:outline-none focus:border-poke-yellow sm:p-3 sm:text-base"
                    >
                      {moves.map((move) => (
                        <option key={move.name} value={move.name}>
                          {move.name} ({move.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={startRandomBattle}
                    className="flex-1 px-4 py-2 text-sm text-white transition-colors rounded-full shadow-md sm:flex-none bg-poke-red hover:bg-poke-red-dark sm:px-6 sm:py-3 sm:text-base"
                  >
                    Random
                  </button>
                  <button
                    onClick={simulateBattle}
                    className="flex-1 px-4 py-2 text-sm text-white transition-colors rounded-full shadow-md sm:flex-none bg-poke-blue hover:bg-poke-blue-dark sm:px-6 sm:py-3 sm:text-base"
                  >
                    Start Battle
                  </button>
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex-1 px-4 py-2 text-sm text-white transition-colors rounded-full shadow-md sm:flex-none bg-poke-blue hover:bg-poke-blue-dark sm:px-6 sm:py-3 sm:text-base"
                  >
                    View History
                  </button>
                </div>
              </div>
            ) : !showHistory ? (
              <div className="text-center">
                <h3 className="mb-4 text-xl font-bold text-poke-blue sm:text-2xl">Battle Result</h3>
                {currentTurn >= battleLog.length ? (
                  <div className="mb-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-gray-100 rounded-lg shadow-md">
                        <img
                          src={battleResult.winner === pokemon1.name ? pokemon1.sprites.front_default : pokemon2.sprites.front_default}
                          alt={battleResult.winner}
                          className="w-20 h-20 mx-auto sm:w-24 sm:h-24"
                        />
                        <p className="font-semibold capitalize text-poke-blue">
                          {battleResult.winner} wins!
                        </p>
                        <p>HP: {battleResult.winner === pokemon1.name ? pokemon1.stats[0].base_stat : pokemon2.stats[0].base_stat}</p>
                        <p>Attack: {battleResult.winner === pokemon1.name ? pokemon1.stats[1].base_stat : pokemon2.stats[1].base_stat}</p>
                        <p>Speed: {battleResult.winner === pokemon1.name ? pokemon1.stats[5].base_stat : pokemon2.stats[5].base_stat}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
                      <img
                        src={pokemon1.sprites.front_default}
                        alt={pokemon1.name}
                        className={`w-20 h-20 sm:w-24 sm:h-24 ${battleMode === 'damage' && battleLog[currentTurn - 1]?.defender === pokemon1.name ? 'animate-shake' : ''}`}
                      />
                      <p className="font-semibold capitalize text-poke-blue">{pokemon1.name}</p>
                      <p>HP: {battleMode === 'damage' ? (battleLog[currentTurn - 1]?.health1 ?? pokemon1.stats[0].base_stat) : pokemon1.stats[0].base_stat}</p>
                      <p>Attack: {pokemon1.stats[1].base_stat}</p>
                      <p>Speed: {pokemon1.stats[5].base_stat}</p>
                    </div>
                    <span className="text-xl font-bold text-poke-red sm:text-2xl">VS</span>
                    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
                      <img
                        src={pokemon2.sprites.front_default}
                        alt={pokemon2.name}
                        className={`w-20 h-20 sm:w-24 sm:h-24 ${battleMode === 'damage' && battleLog[currentTurn - 1]?.defender === pokemon2.name ? 'animate-shake' : ''}`}
                      />
                      <p className="font-semibold capitalize text-poke-blue">{pokemon2.name}</p>
                      <p>HP: {battleMode === 'damage' ? (battleLog[currentTurn - 1]?.health2 ?? pokemon2.stats[0].base_stat) : pokemon2.stats[0].base_stat}</p>
                      <p>Attack: {pokemon2.stats[1].base_stat}</p>
                      <p>Speed: {pokemon2.stats[5].base_stat}</p>
                    </div>
                  </div>
                )}
                <div className="p-4 mb-4 overflow-y-auto rounded-lg shadow-inner max-h-48 bg-gray-50">
                  {battleMode === 'stat' ? (
                    battleLog.slice(0, currentTurn).map((logEntry, index) => (
                      <div key={index} className="mb-2">
                        <p className="font-semibold text-poke-blue">Round {logEntry.round}: {logEntry.stat}</p>
                        <p>{pokemon1.name}: {logEntry.value1} vs {pokemon2.name}: {logEntry.value2}</p>
                        <p>Winner: {logEntry.winner}</p>
                      </div>
                    ))
                  ) : (
                    battleLog.slice(0, currentTurn).map((logEntry, index) => (
                      <div key={index} className="mb-2">
                        <p className="font-semibold text-poke-blue">{logEntry.attacker}</p>
                        <p>{logEntry.attacker} used {logEntry.move} on {logEntry.defender}!</p>
                        <p>Dealt {logEntry.damage} damage {logEntry.effectiveness !== 1 && `(Effectiveness: ${logEntry.effectiveness}x)`}.</p>
                        <p>{logEntry.defender}'s HP: {logEntry.defender === pokemon1.name ? logEntry.health1 : logEntry.health2}</p>
                      </div>
                    ))
                  )}
                </div>
                {currentTurn >= battleLog.length && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <button
                      onClick={() => setShowHistory(true)}
                      className="flex-1 px-4 py-2 text-sm text-white transition-colors rounded-full shadow-md sm:flex-none bg-poke-blue hover:bg-poke-blue-dark sm:px-6 sm:py-3 sm:text-base"
                    >
                      View History
                    </button>
                    <button
                      onClick={closeBattleModal}
                      className="flex-1 px-4 py-2 text-sm text-white transition-colors bg-gray-500 rounded-full shadow-md sm:flex-none hover:bg-gray-600 sm:px-6 sm:py-3 sm:text-base"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="mt-4 mb-2 text-xl font-bold text-center text-poke-blue sm:mt-6 sm:text-2xl">Battle History</h3>
                {battleHistory.length === 0 ? (
                  <p className="text-center text-gray-600">No battle history available.</p>
                ) : (
                  <div className="p-4 overflow-y-auto rounded-lg shadow-inner max-h-48 bg-gray-50">
                    {battleHistory.map((battle, index) => (
                      <div key={battle.id} className="flex items-center justify-between p-2 mb-2 bg-white rounded-lg shadow-sm">
                        <div>
                          <p>{battle.pokemon1} vs {battle.pokemon2}</p>
                          <p>Mode: {battle.mode === 'stat' ? 'Stat Comparison' : 'Damage-Based'}</p>
                          <p>Winner: {battle.winner}</p>
                          <p>Date: {new Date(battle.date).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => removeFromBattleHistory(battle.id)}
                          className="px-3 py-1 text-sm text-white rounded-lg bg-poke-red hover:bg-poke-red-dark sm:px-4 sm:py-2 sm:text-base"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <button
                    onClick={() => setShowHistory(false)}
                    className="flex-1 px-4 py-2 text-sm text-white transition-colors bg-gray-500 rounded-full shadow-md sm:flex-none hover:bg-gray-600 sm:px-6 sm:py-3 sm:text-base"
                  >
                    Hide History
                  </button>
                  <button
                    onClick={closeBattleModal}
                    className="flex-1 px-4 py-2 text-sm text-white transition-colors bg-gray-500 rounded-full shadow-md sm:flex-none hover:bg-gray-600 sm:px-6 sm:py-3 sm:text-base"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
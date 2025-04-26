/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import debounce from 'lodash.debounce';
import Swal from 'sweetalert2';
import PokemonList from './components/pokemonList';
import PokemonDetails from './components/pokemonDetails';
import Team from './components/team';
import Favorites from './components/favorites';
import Battle from './components/battle';
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
  const [opponentSearch, setOpponentSearch] = useState('');
  const [battleResult, setBattleResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [battleLog, setBattleLog] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [playerMove, setPlayerMove] = useState('Tackle');
  const [battleMode, setBattleMode] = useState('damage');
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 640);
  const limit = 20;

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
      const teamRes = await axios.get(`${import.meta.env.REACT_APP_API_URL}/team`);
      const favoritesRes = await axios.get(`${import.meta.env.REACT_APP_API_URL}/favorites`);
      const battleRes = await axios.get(`${import.meta.env.REACT_APP_API_URL}/battleHistory`);
      setTeam(teamRes.data || []);
      setFavorites(favoritesRes.data || []);
      setBattleHistory(battleRes.data || []);
    } catch (error) {
      console.error('Error fetching data from backend:', error.message);
      setError(`Failed to fetch team, favorites, or battle data: ${error.message}. Ensure the backend is running at ${import.meta.env.REACT_APP_API_URL}.`);
      setLastFailedAction('fetchData');
    }
  };

  const syncStateWithServer = async () => {
    try {
      const teamRes = await axios.get(`${import.meta.env.REACT_APP_API_URL}/team`);
      const favoritesRes = await axios.get(`${import.meta.env.REACT_APP_API_URL}/favorites`);
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
      setError(`Failed to sync state: ${error.message}. Ensure the backend is running at ${import.meta.env.REACT_APP_API_URL}.`);
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
        const pokemonToAdd = { ...pokemon, pokeApiId: pokemon.id };
        delete pokemonToAdd.id;
        console.log('Adding to team with pokeApiId:', pokemonToAdd.pokeApiId, 'Name:', pokemonToAdd.name);
        const response = await axios.post(`${import.meta.env.REACT_APP_API_URL}/team`, pokemonToAdd);
        console.log('Server response after adding to team:', response.data);
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
        setError(`Failed to add to team: ${error.message}. Ensure the backend is running at ${import.meta.env.REACT_APP_API_URL}.`);
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
        const pokemonToAdd = { ...pokemon, pokeApiId: pokemon.id };
        delete pokemonToAdd.id;
        console.log('Adding to favorites with pokeApiId:', pokemonToAdd.pokeApiId, 'Name:', pokemonToAdd.name);
        const response = await axios.post(`${import.meta.env.REACT_APP_API_URL}/favorites`, pokemonToAdd);
        console.log('Server response after adding to favorites:', response.data);
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
        setError(`Failed to add to favorites: ${error.message}. Ensure the backend is running at ${import.meta.env.REACT_APP_API_URL}.`);
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
            turn++;
          }
        }

        winner = health1 > 0 ? pokemon1.name : pokemon2.name;
      }

      setBattleLog(log);
      setCurrentTurn(0);

      const battleResult = {
        pokemon1: pokemon1.name,
        pokemon2: pokemon2.name,
        winner,
        log,
        mode: battleMode,
        date: new Date().toISOString(),
      };
      setBattleResult(battleResult);

      try {
        const response = await axios.post(`${import.meta.env.REACT_APP_API_URL}/battleHistory`, battleResult);
        console.log('Battle history saved:', response.data);
        setBattleHistory([...battleHistory, response.data]);
      } catch (error) {
        console.error('Error saving battle history:', error.message);
        setError(`Failed to save battle history: ${error.message}. Ensure the backend is running at ${import.meta.env.REACT_APP_API_URL}.`);
        setLastFailedAction('simulateBattle');
      }

      Swal.fire({
        title: `Battle Result`,
        html: `<strong>${winner}</strong> wins the battle!`,
        icon: 'info',
        confirmButtonText: 'View Details',
        confirmButtonColor: '#3b4cca',
        background: '#fff',
        customClass: {
          popup: 'rounded-xl shadow-xl',
          title: 'text-poke-blue font-2p',
          htmlContainer: 'text-poke-blue',
          confirmButton: 'px-6 py-2 text-white rounded-full shadow-md hover:bg-poke-blue-dark',
        },
      }).then(() => {
        setShowHistory(true);
      });
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

  const removeFromBattleHistory = async (battleId) => {
    try {
      await axios.delete(`${import.meta.env.REACT_APP_API_URL}/battleHistory/${battleId}`);
      setBattleHistory(battleHistory.filter((battle) => battle.id !== battleId));
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
      setError(`Failed to remove battle from history: ${error.message}. Ensure the backend is running at ${import.meta.env.REACT_APP_API_URL}.`);
      setLastFailedAction('removeFromBattleHistory');
    }
  };

  const handleRetry = async () => {
    if (!lastFailedAction) return;
    setError(null);

    switch (lastFailedAction) {
      case 'fetchAllPokemon':
        await fetchAllPokemon();
        break;
      case 'fetchPokemon':
        await fetchPokemon();
        break;
      case 'fetchData':
        await fetchData();
        break;
      case 'syncStateWithServer':
        await syncStateWithServer();
        break;
      case 'addToTeam':
        if (lastFailedPokemon) await addToTeam(lastFailedPokemon);
        break;
      case 'addToFavorites':
        if (lastFailedPokemon) await addToFavorites(lastFailedPokemon);
        break;
      case 'simulateBattle':
        await simulateBattle();
        break;
      case 'removeFromBattleHistory':
        if (lastFailedPokemon) await removeFromBattleHistory(lastFailedPokemon);
        break;
      default:
        break;
    }

    setLastFailedAction(null);
    setLastFailedPokemon(null);
  };

  const handlePokemonClick = (pokemon) => {
    setSelectedPokemon(pokemon);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPokemon(null);
  };

  const handleCloseTeamModal = () => {
    setShowTeamModal(false);
  };

  const handleCloseFavoritesModal = () => {
    setShowFavoritesModal(false);
  };

  const handleCloseBattleModal = () => {
    setShowBattleModal(false);
    setPokemon1(null);
    setPokemon2(null);
    setOpponentSearch('');
    setBattleResult(null);
    setBattleLog([]);
    setCurrentTurn(0);
    setPlayerMove('Tackle');
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setBattleResult(null);
    setBattleLog([]);
    setCurrentTurn(0);
  };

  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage((prevPage) => prevPage - 1);
  };

  const handlePokemon1Select = (pokemon) => {
    setPokemon1(pokemon);
  };

  const handlePokemon2Select = (pokemon) => {
    setPokemon2(pokemon);
  };

  const handleOpponentSearch = (e) => {
    const query = e.target.value.trim();
    setOpponentSearch(query);
  };

  const handleBattleModeChange = (e) => {
    setBattleMode(e.target.value);
  };

  const handleMoveChange = (e) => {
    setPlayerMove(e.target.value);
  };

  const handleNextTurn = () => {
    if (currentTurn < battleLog.length - 1) {
      setCurrentTurn(currentTurn + 1);
    }
  };

  const handlePrevTurn = () => {
    if (currentTurn > 0) {
      setCurrentTurn(currentTurn - 1);
    }
  };

  return (
    <div className="min-h-screen bg-poke-blue-light font-2p text-poke-blue">
      <header className="p-4 text-center text-white bg-poke-blue-dark">
        <h1 className="text-4xl font-bold">Pokémon Mini Dex</h1>
        <div className="mt-2">
          <button
            onClick={() => setShowTeamModal(true)}
            className="px-4 py-2 mr-2 text-white rounded-full bg-poke-green hover:bg-poke-green-dark"
          >
            My Team ({team.length}/6)
          </button>
          <button
            onClick={() => setShowFavoritesModal(true)}
            className="px-4 py-2 mr-2 text-white rounded-full bg-poke-purple hover:bg-poke-purple-dark"
          >
            Favorites ({favorites.length})
          </button>
          <button
            onClick={() => setShowBattleModal(true)}
            className="px-4 py-2 mr-2 text-white rounded-full bg-poke-red hover:bg-poke-red-dark"
          >
            Battle
          </button>
          <button
            onClick={syncStateWithServer}
            className="px-4 py-2 text-white rounded-full bg-poke-blue hover:bg-poke-blue-dark"
          >
            Sync State
          </button>
        </div>
      </header>

      <main className="p-4">
        {error && (
          <div className="relative px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
            <span>{error}</span>
            {lastFailedAction && (
              <button
                onClick={handleRetry}
                className="px-3 py-1 ml-2 text-white bg-red-500 rounded hover:bg-red-600"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={search}
            onChange={handleSearch}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-poke-blue"
          />
        </div>

        {loading ? (
          <p className="text-center">Loading Pokémon...</p>
        ) : (
          <>
            <PokemonList
              pokemonList={pokemonList}
              onPokemonClick={handlePokemonClick}
              onAddToTeam={addToTeam}
              onAddToFavorites={addToFavorites}
              isSmallScreen={isSmallScreen}
            />
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className={`px-4 py-2 rounded ${page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-poke-blue text-white hover:bg-poke-blue-dark'}`}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                onClick={handleNextPage}
                className="px-4 py-2 text-white rounded bg-poke-blue hover:bg-poke-blue-dark"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>

      {showModal && selectedPokemon && (
        <PokemonDetails
          pokemon={selectedPokemon}
          onClose={handleCloseModal}
          onAddToTeam={addToTeam}
          onAddToFavorites={addToFavorites}
          isSmallScreen={isSmallScreen}
        />
      )}

      {showTeamModal && (
        <Team
          team={team}
          setTeam={setTeam}
          onClose={handleCloseTeamModal}
          isSmallScreen={isSmallScreen}
        />
      )}

      {showFavoritesModal && (
        <Favorites
          favorites={favorites}
          setFavorites={setFavorites}
          onClose={handleCloseFavoritesModal}
          isSmallScreen={isSmallScreen}
        />
      )}

      {showBattleModal && (
        <Battle
          allPokemon={allPokemon}
          team={team}
          onPokemon1Select={handlePokemon1Select}
          onPokemon2Select={handlePokemon2Select}
          opponentSearch={opponentSearch}
          onOpponentSearch={handleOpponentSearch}
          pokemon1={pokemon1}
          pokemon2={pokemon2}
          onBattle={simulateBattle}
          onClose={handleCloseBattleModal}
          battleMode={battleMode}
          onBattleModeChange={handleBattleModeChange}
          playerMove={playerMove}
          onMoveChange={handleMove这句话Change}
          isSmallScreen={isSmallScreen}
        />
      )}

      {showHistory && battleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-poke-blue">Battle History</h2>
            <p>
              <strong>{battleResult.pokemon1}</strong> vs <strong>{battleResult.pokemon2}</strong>
            </p>
            <p>
              <strong>Winner:</strong> {battleResult.winner}
            </p>
            <p>
              <strong>Mode:</strong> {battleResult.mode === 'stat' ? 'Stat Comparison' : 'Damage Simulation'}
            </p>
            <p>
              <strong>Date:</strong> {new Date(battleResult.date).toLocaleString()}
            </p>
            {battleLog.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Battle Log</h3>
                {battleResult.mode === 'stat' ? (
                  battleLog.map((logEntry) => (
                    <p key={logEntry.round}>
                      Round {logEntry.round} ({logEntry.stat}): {logEntry.winner} wins ({logEntry.value1} vs {logEntry.value2})
                    </p>
                  ))
                ) : (
                  <div>
                    <p>
                      Turn {battleLog[currentTurn].turn}: {battleLog[currentTurn].attacker} used {battleLog[currentTurn].move} on {battleLog[currentTurn].defender}
                    </p>
                    <p>Damage: {battleLog[currentTurn].damage}</p>
                    <p>Effectiveness: {battleLog[currentTurn].effectiveness}x</p>
                    <p>
                      Health: {battleLog[currentTurn].health1} (P1) / {battleLog[currentTurn].health2} (P2)
                    </p>
                    <div className="flex justify-between mt-2">
                      <button
                        onClick={handlePrevTurn}
                        disabled={currentTurn === 0}
                        className={`px-4 py-2 rounded ${currentTurn === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-poke-blue text-white hover:bg-poke-blue-dark'}`}
                      >
                        Previous Turn
                      </button>
                      <button
                        onClick={handleNextTurn}
                        disabled={currentTurn === battleLog.length - 1}
                        className={`px-4 py-2 rounded ${currentTurn === battleLog.length - 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-poke-blue text-white hover:bg-poke-blue-dark'}`}
                      >
                        Next Turn
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <h3 className="mt-4 text-lg font-semibold">Past Battles</h3>
            <ul className="mt-2 overflow-y-auto max-h-40">
              {battleHistory.map((battle) => (
                <li key={battle.id} className="flex items-center justify-between py-1">
                  <span>
                    {battle.pokemon1} vs {battle.pokemon2} - Winner: {battle.winner} ({battle.mode})
                  </span>
                  <button
                    onClick={() => removeFromBattleHistory(battle.id)}
                    className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={handleCloseHistory}
              className="px-4 py-2 mt-4 text-white rounded bg-poke-blue hover:bg-poke-blue-dark"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
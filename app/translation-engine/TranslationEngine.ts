// Custom Translation Engine for Game Library
// Class-based event emitter pattern with unique architecture

type LangCode = "en" | "es" | "ko";
type EventHandler = () => void;

class TranslationEngine {
  private selectedLang: LangCode = "en";
  private listeners: EventHandler[] = [];
  private storageKey = "game_library_language_preference";

  private textMappings = {
    en: {
      mainHeading: "🎮 Game Library",
      welcomeMessage:
        "Enjoy a collection of fun mini-games and challenge yourself to beat other players' scores!",
      inputPlaceholder: "Search games...",
      visitCountLabel: "Today's Visits",
      footerContent: "© 2026 Game Library. Built with Next.js",
      upDownGameTitle: "Up And Down",
      upDownGameDescription:
        "Guess the secret number with limited attempts. Can you figure it out?",
      rpsGameTitle: "Rock-Paper-Scissors",
      rpsGameDescription:
        "Play the classic game against the computer. Get consecutive wins for higher scores!",
      treasureGameTitle: "Treasure Hunt",
      treasureGameDescription:
        "Two players take turns uncovering tiles to find the hidden treasure!",
      game47Title: "47",
      game47Description:
        "A timing challenge! Stop the timer at exactly 47.0 seconds. The timer fades out after 3 seconds.",
      linkBackHome: "Back to Games",
      actionPlayAgain: "Play Again",
      actionNewGame: "New Game",
      scoreboardTitle: "Top 10 Scoreboard",
      topScoresHeading: "Top Scores",
      playerNameLabel: "Player Name",
      scoreLabel: "Score",
      searchInputLabel: "Search games...",
      searchLabel: "Search games",
      clearSearchLabel: "Clear search",
      searchingForLabel: "Searching for:",
      noResultsMessage: "No games found",
      noResultsSuggestion: "Try adjusting your search",
      namePrompt: "Enter your name",
      submitButton: "Save Score",
      dismissButton: "Skip",
      congratsMessage: "Top 10 Score!",
      achievementMessage: "You made it to the top 10!",
      scoreMessage: "You scored {{score}} points!",
      characterCountLabel: "characters",
      tagLogic: "logic",
      tagPuzzle: "puzzle",
      tagSolo: "single-player",
      tagClassic: "classic",
      tagQuick: "quick",
      tagDuo: "two-player",
      tagStrategy: "strategy",
      tagTiming: "timing",
      tagChallenge: "challenge",
      scoreboardBadgeLabel: "Scoreboard",
      languagePickerLabel: "Language",
      englishOption: "🇬🇧 English",
      spanishOption: "🇪🇸 Spanish",
      koreanOption: "🇰🇷 Korean",
      scoreboardEmptyTitle: "No scores yet!",
      scoreboardEmptySubtitle: "Be the first to play and set a record.",
      visitCountTemplateSingular: "{{count}} visit for today ({{date}})",
      visitCountTemplatePlural: "{{count}} visits for today ({{date}})",
      loadingVisitsLabel: "Loading visits...",
      upDownConfigTitle: "Configure Your Game",
      upDownConfigSubtitle:
        "Customize the difficulty by setting your preferred range and number of attempts",
      upDownMinLabel: "Minimum Number (1 - {{max}}):",
      upDownMaxLabel: "Maximum Number ({{min}} - {{max}}):",
      upDownAttemptsLabel: "Maximum Attempts (1 - {{max}}):",
      upDownStartGame: "Start Game",
      upDownRemainingAttempts: "Remaining Attempts",
      upDownRangeLabel: "Range",
      upDownGuessLabel: "Enter your guess:",
      upDownMakeGuess: "Make Guess",
      upDownLastGuess: "Last guess:",
      upDownWinTitle: "Congratulations!",
      upDownWinMessage: "You guessed the number {{number}}!",
      upDownLoseTitle: "Game Over!",
      upDownLoseMessage: "The secret number was {{number}}",
      upDownHigherHint: "Think Higher!",
      upDownLowerHint: "Think Lower!",
      upDownFirstGuess: "Make your first guess!",
      upDownLongDescription:
        "A configurable number guessing game! Set your own difficulty by choosing the number range and attempts before starting. Default: guess between {{min}} and {{max}} in {{attempts}} attempts.",
      rpsPageDescription:
        "Play against the computer and get as many consecutive wins as possible!",
      rpsConsecutiveWinsLabel: "Consecutive Wins",
      rpsYouLabel: "You",
      rpsComputerLabel: "Computer",
      rpsChooseNext: "Make your next choice:",
      rpsChooseFirst: "Choose your move:",
      rpsWinMessage: "You Win!",
      rpsLoseMessage: "You Lose!",
      rpsFinalScore: "Final Score: {{score}} consecutive wins",
      rpsDrawMessage: "Draw!",
      rpsVsLabel: "VS",
      rpsChoiceRock: "rock",
      rpsChoicePaper: "paper",
      rpsChoiceScissors: "scissors",
      treasureConfigTitle: "Game Configuration",
      treasureGridSizeLabel: "Grid Size",
      treasureGridInfo: "{{size}}×{{size}} grid = {{tiles}} tiles",
      treasurePlayerCountLabel: "Number of Players (2-{{max}})",
      treasurePlayerCountError: "Must be between 2 and {{max}}",
      treasurePlayerNamesLabel: "Player Names (max 20 characters each)",
      treasurePlayerPlaceholder: "Player {{number}}",
      treasureStartGame: "Start Game",
      treasureRulesTitle: "Game Rules:",
      treasureRuleTurns: "Players take turns clicking tiles",
      treasureRuleHidden: "One tile contains a hidden treasure 💎",
      treasureRuleWin: "The first player to find the treasure wins!",
      treasureRuleCovered: "Covered tiles show a shrub 🌳",
      treasureDescriptionConfig:
        "Configure your game and start the hunt for treasure!",
      treasureDescriptionPlay:
        "Take turns uncovering tiles to find the hidden treasure!",
      treasureWinnerMessage: "{{name}} Wins!",
      treasureTurnMessage: "{{name}}'s Turn",
      treasureTurnHint: "Click a tile to search for treasure",
      treasureNewGame: "New Game",
      treasureGridLabel: "Grid:",
      treasurePlayersLabel: "Players:",
      treasureInvalidConfig: "Invalid configuration",
      game47PageDescription:
        "A timing challenge! Stop the timer at exactly 47.0 seconds. The timer will fade out after 3 seconds—trust your instincts!",
      game47SelectDifficultyTitle: "Select Difficulty",
      game47SelectDifficultySubtitle: "Choose your target time:",
      game47ReadyTitle: "Ready to Play?",
      game47DifficultyLabel: "Difficulty: {{difficulty}}",
      game47TargetLabel: "Target: {{time}}",
      game47StopAtExact: "Stop the timer at exactly {{time}} to win!",
      game47FadeOutHint:
        "The timer will fade out after 3 seconds, so you'll need to rely on your internal sense of time.",
      game47StartTimer: "Start Timer",
      game47TimerRunning: "Timer running...",
      game47StopTimer: "Stop Timer",
      game47PerfectTitle: "Perfect!",
      game47PerfectMessage: "You stopped at exactly {{time}} seconds!",
      game47ResultTitle: "Your Result",
      game47StoppedAtMessage: "You stopped at {{time}} seconds",
      game47DifferenceLabel: "Difference from target:",
      game47StoppedLate: "(stopped late)",
      game47StoppedEarly: "(stopped early)",
      game47DifficultyEasy: "EASY",
      game47DifficultyMedium: "MEDIUM",
      game47DifficultyHard: "HARD",
      treasureMinPlayersRequired: "At least 2 players required",
      treasureMaxPlayersForGrid:
        "Maximum {{max}} players for {{size}}×{{size}} grid",
      treasurePlayOnlineMultiplayer: "🌐 Play Online Multiplayer",
      treasureLeaverGameResetMessage:
        "Game was reset to lobby. Host can start a new game.",
      onlineSessionExpired:
        "Your session has expired. Please create or join a new room.",
      onlineRoomExpired: "This room has expired or no longer exists.",
      onlineRoomClosed: "This room has been closed or expired.",
      onlineConnectionLost:
        "Lost connection to game server. Please refresh.",
      onlineEnterUsernameError: "Please enter your username",
      onlineCreateRoomError: "Failed to create room. Please try again.",
      onlineEnterRoomCodeError: "Please enter a room code",
      onlineRoomNotFound:
        "Room not found. Please check the code and try again.",
      onlineRoomFull: "This room is full. Please try a different room.",
      onlineJoinRoomError: "Failed to join room. Please try again.",
      onlineCopyCodeError: "Failed to copy room code",
      onlineCopyLinkError: "Failed to copy room link",
      onlineStartGameError: "Failed to start game. Please try again.",
      onlineUpdateGridError:
        "Failed to update grid size. Please try again.",
      onlineNotYourTurn: "It's not your turn!",
      onlineMoveError:
        "That move couldn't be completed. Please try again.",
      onlineRestartGameError: "Failed to restart game. Please try again.",
      onlineReturnToLobbyError:
        "Failed to return to lobby. Please try again.",
      onlineStopGameError: "Failed to stop game. Please try again.",
      onlineGameStoppedByHost: "The game was stopped by the host.",
      onlineStopGameConfirm:
        "Are you sure you want to stop the game? This will end the game for all players and return everyone to the lobby.",
      onlineTitleReconnecting: "Treasure Hunt - Reconnecting",
      onlineDescReconnecting:
        "Please wait while we reconnect you to your game",
      onlineTitleLanding: "Treasure Hunt - Online Multiplayer",
      onlineDescLanding:
        "Create or join a room to play with friends online",
      onlineTitleInProgress: "Treasure Hunt - Game In Progress",
      onlineDescInProgress: "Find the hidden treasure!",
      onlineTitleLobby: "Treasure Hunt - Room Lobby",
      onlineDescLobby: "Waiting for players to join",
      onlineTitleLoading: "Treasure Hunt - Loading",
      onlineDescLoading: "Loading multiplayer game...",
      onlineBackToTreasureHunt: "Back to TreasureHunt",
      onlineUsernameLabel: "Your Username",
      onlineUsernamePlaceholder: "Enter your name",
      onlineNumberOfPlayersLabel: "Number of Players",
      onlineMaxPlayersInfo:
        "Maximum {{count}} players can join this room",
      onlinePlayerCountNote:
        "The number of players cannot be changed after the room is created. The grid size can be adjusted in the lobby.",
      onlineCreateRoomTitle: "Create New Room",
      onlineCreatingLabel: "Creating...",
      onlineCreateRoomButton: "Create Room",
      onlineJoinRoomTitle: "Join Existing Room",
      onlineRoomCodePlaceholder: "Enter 6-character room code",
      onlineJoiningLabel: "Joining...",
      onlineJoinRoomButton: "Join Room",
      onlineQuickTipsTitle: "Quick Tips:",
      onlineQuickTip1: "Rooms expire after 1 hour of inactivity",
      onlineQuickTip2: "You can share room links with friends",
      onlineQuickTip3: "Your session is automatically saved",
      onlineRoomCodeLabel: "Room Code",
      onlineCopiedLabel: "✓ Copied!",
      onlineCopyCodeButton: "📋 Copy Code",
      onlineLinkCopiedLabel: "✓ Link Copied!",
      onlineShareLinkButton: "🔗 Share Link",
      onlinePlayersHeading: "Players ({{count}}/{{max}})",
      onlinePlayerLabel: "Player {{number}}:",
      onlineTurnIndicator: "(Turn)",
      onlineDisconnectedLabel: "Disconnected",
      onlineYouLabel: "(You)",
      onlineBackInLobby:
        "You are back in the lobby. Host can start a new game.",
      onlineCanBeChanged: "Can be changed",
      onlineSetAtCreation: "Set at creation",
      onlineGridSizeInfo:
        "{{size}}×{{size}} grid = {{tiles}} tiles (max {{max}} players)",
      onlineUpdatingLabel: "Updating...",
      onlineGridSizeDisplay:
        "Grid Size: {{size}}×{{size}} ({{tiles}} tiles)",
      onlineWinnerMessage: "{{name}} wins!",
      onlineFoundAfterTiles: "Found after {{count}} tiles uncovered",
      onlineYourTurnTitle: "🎯 Your Turn!",
      onlineClickTileHint: "Click a tile to uncover it",
      onlineChooseTile: "Choose a tile",
      onlineWaitingForPlayer: "Waiting for {{name}}...",
      onlineProgressLabel: "Progress: {{uncovered}}/{{total}} tiles",
      onlineStopGameButton: "Stop Game",
      onlineStopGameWarning:
        "This will end the game for all players and return everyone to the lobby",
      onlineLeavingWarning: "Leaving will end the game for all players",
      onlineStartingLabel: "Starting...",
      onlineBackToLobbyButton: "Back to Lobby",
      onlineReturningLabel: "Returning...",
      onlineWaitingForHostLabel: "Waiting for host...",
      onlineOnlyHostCanReturn: "Only the host can return to the lobby",
      onlineWaitingForAtLeastTwoPlayers:
        "Waiting for at least 2 players...",
      onlineLeaveRoomButton: "Leave Room",
      onlineWaitingForHostToStart:
        "Waiting for host to start the game...",
      onlineLoadingLabel: "Loading...",
      onlineReconnectingLabel: "Reconnecting...",
      onlineStoppingLabel: "Stopping...",
      onlineShareTitle: "Join my Treasure Hunt game!",
      onlineShareText: "Join my game with room code: {{code}}",
    },
    es: {
      mainHeading: "🎮 Biblioteca de Juegos",
      welcomeMessage:
        "¡Disfruta de una colección de minijuegos divertidos y desafíate a superar las puntuaciones de otros jugadores!",
      inputPlaceholder: "Buscar juegos...",
      visitCountLabel: "Visitas de Hoy",
      footerContent: "© 2026 Biblioteca de Juegos. Creado con Next.js",
      upDownGameTitle: "Arriba y Abajo",
      upDownGameDescription:
        "¡Adivina el número secreto con intentos limitados. ¿Puedes resolverlo?",
      rpsGameTitle: "Piedra-Papel-Tijeras",
      rpsGameDescription:
        "¡Juega el juego clásico contra la computadora. Consigue victorias consecutivas para obtener puntuaciones más altas!",
      treasureGameTitle: "Búsqueda del Tesoro",
      treasureGameDescription:
        "¡Dos jugadores se turnan para descubrir fichas y encontrar el tesoro escondido!",
      game47Title: "47",
      game47Description:
        "¡Un desafío de tiempo! Detén el temporizador exactamente a los 47.0 segundos. El temporizador se desvanece después de 3 segundos.",
      linkBackHome: "Volver a los Juegos",
      actionPlayAgain: "Jugar de Nuevo",
      actionNewGame: "Nuevo Juego",
      scoreboardTitle: "Tabla de Puntuaciones Top 10",
      topScoresHeading: "Mejores Puntuaciones",
      playerNameLabel: "Nombre del Jugador",
      scoreLabel: "Puntuación",
      searchInputLabel: "Buscar juegos...",
      searchLabel: "Buscar juegos",
      clearSearchLabel: "Borrar búsqueda",
      searchingForLabel: "Buscando:",
      noResultsMessage: "No se encontraron juegos",
      noResultsSuggestion: "Intenta ajustar tu búsqueda",
      namePrompt: "Ingresa tu nombre",
      submitButton: "Guardar puntuación",
      dismissButton: "Omitir",
      congratsMessage: "¡Puntuación Top 10!",
      achievementMessage: "¡Llegaste al top 10!",
      scoreMessage: "¡Lograste {{score}} puntos!",
      characterCountLabel: "caracteres",
      tagLogic: "lógica",
      tagPuzzle: "rompecabezas",
      tagSolo: "un jugador",
      tagClassic: "clásico",
      tagQuick: "rápido",
      tagDuo: "dos jugadores",
      tagStrategy: "estrategia",
      tagTiming: "tiempo",
      tagChallenge: "desafío",
      scoreboardBadgeLabel: "Tabla de puntuaciones",
      languagePickerLabel: "Idioma",
      englishOption: "🇬🇧 Inglés",
      spanishOption: "🇪🇸 Español",
      koreanOption: "🇰🇷 한국어",
      scoreboardEmptyTitle: "¡Aún no hay puntuaciones!",
      scoreboardEmptySubtitle: "Sé el primero en jugar y establecer un récord.",
      visitCountTemplateSingular: "{{count}} visita de hoy ({{date}})",
      visitCountTemplatePlural: "{{count}} visitas de hoy ({{date}})",
      loadingVisitsLabel: "Cargando visitas...",
      upDownConfigTitle: "Configura tu juego",
      upDownConfigSubtitle:
        "Personaliza la dificultad configurando tu rango preferido y número de intentos",
      upDownMinLabel: "Número mínimo (1 - {{max}}):",
      upDownMaxLabel: "Número máximo ({{min}} - {{max}}):",
      upDownAttemptsLabel: "Intentos máximos (1 - {{max}}):",
      upDownStartGame: "Iniciar juego",
      upDownRemainingAttempts: "Intentos restantes",
      upDownRangeLabel: "Rango",
      upDownGuessLabel: "Ingresa tu intento:",
      upDownMakeGuess: "Hacer intento",
      upDownLastGuess: "Último intento:",
      upDownWinTitle: "¡Felicitaciones!",
      upDownWinMessage: "¡Adivinaste el número {{number}}!",
      upDownLoseTitle: "¡Juego terminado!",
      upDownLoseMessage: "El número secreto era {{number}}",
      upDownHigherHint: "¡Más alto!",
      upDownLowerHint: "¡Más bajo!",
      upDownFirstGuess: "¡Haz tu primer intento!",
      upDownLongDescription:
        "¡Un juego de adivinanza configurable! Ajusta la dificultad eligiendo el rango de números y los intentos antes de empezar. Por defecto: adivina entre {{min}} y {{max}} en {{attempts}} intentos.",
      rpsPageDescription:
        "¡Juega contra la computadora y consigue tantas victorias consecutivas como puedas!",
      rpsConsecutiveWinsLabel: "Victorias consecutivas",
      rpsYouLabel: "Tú",
      rpsComputerLabel: "Computadora",
      rpsChooseNext: "Elige tu siguiente jugada:",
      rpsChooseFirst: "Elige tu jugada:",
      rpsWinMessage: "¡Ganaste!",
      rpsLoseMessage: "¡Perdiste!",
      rpsFinalScore: "Puntuación final: {{score}} victorias consecutivas",
      rpsDrawMessage: "¡Empate!",
      rpsVsLabel: "VS",
      rpsChoiceRock: "piedra",
      rpsChoicePaper: "papel",
      rpsChoiceScissors: "tijeras",
      treasureConfigTitle: "Configuración del juego",
      treasureGridSizeLabel: "Tamaño de la cuadrícula",
      treasureGridInfo: "Cuadrícula {{size}}×{{size}} = {{tiles}} casillas",
      treasurePlayerCountLabel: "Número de jugadores (2-{{max}})",
      treasurePlayerCountError: "Debe estar entre 2 y {{max}}",
      treasurePlayerNamesLabel:
        "Nombres de jugadores (máx. 20 caracteres cada uno)",
      treasurePlayerPlaceholder: "Jugador {{number}}",
      treasureStartGame: "Iniciar juego",
      treasureRulesTitle: "Reglas del juego:",
      treasureRuleTurns:
        "Los jugadores se turnan para hacer clic en las casillas",
      treasureRuleHidden: "Una casilla contiene un tesoro oculto 💎",
      treasureRuleWin: "¡El primer jugador que encuentre el tesoro gana!",
      treasureRuleCovered: "Las casillas cubiertas muestran un arbusto 🌳",
      treasureDescriptionConfig:
        "¡Configura tu juego y empieza la búsqueda del tesoro!",
      treasureDescriptionPlay:
        "¡Tomen turnos para descubrir casillas y encontrar el tesoro oculto!",
      treasureWinnerMessage: "¡{{name}} gana!",
      treasureTurnMessage: "Turno de {{name}}",
      treasureTurnHint: "Haz clic en una casilla para buscar el tesoro",
      treasureNewGame: "Nuevo juego",
      treasureGridLabel: "Cuadrícula:",
      treasurePlayersLabel: "Jugadores:",
      treasureInvalidConfig: "Configuración inválida",
      game47PageDescription:
        "¡Un desafío de tiempo! Detén el temporizador exactamente a los 47.0 segundos. El temporizador se desvanecerá después de 3 segundos—confía en tu instinto.",
      game47SelectDifficultyTitle: "Seleccionar dificultad",
      game47SelectDifficultySubtitle: "Elige tu tiempo objetivo:",
      game47ReadyTitle: "¿Listo para jugar?",
      game47DifficultyLabel: "Dificultad: {{difficulty}}",
      game47TargetLabel: "Objetivo: {{time}}",
      game47StopAtExact:
        "Detén el temporizador exactamente en {{time}} para ganar!",
      game47FadeOutHint:
        "El temporizador se desvanecerá después de 3 segundos, así que tendrás que confiar en tu sentido interno del tiempo.",
      game47StartTimer: "Iniciar temporizador",
      game47TimerRunning: "Temporizador en marcha...",
      game47StopTimer: "Detener temporizador",
      game47PerfectTitle: "¡Perfecto!",
      game47PerfectMessage: "¡Te detuviste exactamente en {{time}} segundos!",
      game47ResultTitle: "Tu resultado",
      game47StoppedAtMessage: "Te detuviste en {{time}} segundos",
      game47DifferenceLabel: "Diferencia con el objetivo:",
      game47StoppedLate: "(te detuviste tarde)",
      game47StoppedEarly: "(te detuviste temprano)",
      game47DifficultyEasy: "FÁCIL",
      game47DifficultyMedium: "MEDIO",
      game47DifficultyHard: "DIFÍCIL",
      treasureMinPlayersRequired: "Se requieren al menos 2 jugadores",
      treasureMaxPlayersForGrid:
        "Máximo {{max}} jugadores para cuadrícula {{size}}×{{size}}",
      treasurePlayOnlineMultiplayer: "🌐 Jugar Multijugador en Línea",
      treasureLeaverGameResetMessage:
        "El juego fue reiniciado al vestíbulo. El anfitrión puede iniciar un nuevo juego.",
      onlineSessionExpired:
        "Tu sesión ha expirado. Por favor crea o únete a una nueva sala.",
      onlineRoomExpired: "Esta sala ha expirado o ya no existe.",
      onlineRoomClosed: "Esta sala ha sido cerrada o ha expirado.",
      onlineConnectionLost:
        "Conexión perdida con el servidor. Por favor actualiza la página.",
      onlineEnterUsernameError: "Por favor ingresa tu nombre de usuario",
      onlineCreateRoomError:
        "No se pudo crear la sala. Por favor inténtalo de nuevo.",
      onlineEnterRoomCodeError: "Por favor ingresa un código de sala",
      onlineRoomNotFound:
        "Sala no encontrada. Por favor verifica el código e inténtalo de nuevo.",
      onlineRoomFull:
        "Esta sala está llena. Por favor intenta con una sala diferente.",
      onlineJoinRoomError:
        "No se pudo unir a la sala. Por favor inténtalo de nuevo.",
      onlineCopyCodeError: "Error al copiar el código de sala",
      onlineCopyLinkError: "Error al copiar el enlace de sala",
      onlineStartGameError:
        "No se pudo iniciar el juego. Por favor inténtalo de nuevo.",
      onlineUpdateGridError:
        "No se pudo actualizar la cuadrícula. Por favor inténtalo de nuevo.",
      onlineNotYourTurn: "¡No es tu turno!",
      onlineMoveError:
        "No se pudo completar el movimiento. Por favor inténtalo de nuevo.",
      onlineRestartGameError:
        "No se pudo reiniciar el juego. Por favor inténtalo de nuevo.",
      onlineReturnToLobbyError:
        "No se pudo volver al vestíbulo. Por favor inténtalo de nuevo.",
      onlineStopGameError:
        "No se pudo detener el juego. Por favor inténtalo de nuevo.",
      onlineGameStoppedByHost: "El juego fue detenido por el anfitrión.",
      onlineStopGameConfirm:
        "¿Estás seguro de que quieres detener el juego? Esto terminará el juego para todos los jugadores y los devolverá al vestíbulo.",
      onlineTitleReconnecting: "Búsqueda del Tesoro - Reconectando",
      onlineDescReconnecting:
        "Por favor espera mientras te reconectamos a tu juego",
      onlineTitleLanding: "Búsqueda del Tesoro - Multijugador en Línea",
      onlineDescLanding:
        "Crea o únete a una sala para jugar con amigos en línea",
      onlineTitleInProgress: "Búsqueda del Tesoro - Juego en Progreso",
      onlineDescInProgress: "¡Encuentra el tesoro escondido!",
      onlineTitleLobby: "Búsqueda del Tesoro - Sala de Espera",
      onlineDescLobby: "Esperando a que se unan los jugadores",
      onlineTitleLoading: "Búsqueda del Tesoro - Cargando",
      onlineDescLoading: "Cargando juego multijugador...",
      onlineBackToTreasureHunt: "Volver a Búsqueda del Tesoro",
      onlineUsernameLabel: "Tu Nombre de Usuario",
      onlineUsernamePlaceholder: "Ingresa tu nombre",
      onlineNumberOfPlayersLabel: "Número de Jugadores",
      onlineMaxPlayersInfo:
        "Máximo {{count}} jugadores pueden unirse a esta sala",
      onlinePlayerCountNote:
        "El número de jugadores no se puede cambiar después de crear la sala. El tamaño de la cuadrícula se puede ajustar en el vestíbulo.",
      onlineCreateRoomTitle: "Crear Nueva Sala",
      onlineCreatingLabel: "Creando...",
      onlineCreateRoomButton: "Crear Sala",
      onlineJoinRoomTitle: "Unirse a Sala Existente",
      onlineRoomCodePlaceholder: "Ingresa el código de 6 caracteres",
      onlineJoiningLabel: "Uniéndose...",
      onlineJoinRoomButton: "Unirse a la Sala",
      onlineQuickTipsTitle: "Consejos Rápidos:",
      onlineQuickTip1:
        "Las salas expiran después de 1 hora de inactividad",
      onlineQuickTip2:
        "Puedes compartir enlaces de sala con amigos",
      onlineQuickTip3: "Tu sesión se guarda automáticamente",
      onlineRoomCodeLabel: "Código de Sala",
      onlineCopiedLabel: "✓ ¡Copiado!",
      onlineCopyCodeButton: "📋 Copiar Código",
      onlineLinkCopiedLabel: "✓ ¡Enlace Copiado!",
      onlineShareLinkButton: "🔗 Compartir Enlace",
      onlinePlayersHeading: "Jugadores ({{count}}/{{max}})",
      onlinePlayerLabel: "Jugador {{number}}:",
      onlineTurnIndicator: "(Turno)",
      onlineDisconnectedLabel: "Desconectado",
      onlineYouLabel: "(Tú)",
      onlineBackInLobby:
        "Estás de vuelta en el vestíbulo. El anfitrión puede iniciar un nuevo juego.",
      onlineCanBeChanged: "Se puede cambiar",
      onlineSetAtCreation: "Definido en la creación",
      onlineGridSizeInfo:
        "Cuadrícula {{size}}×{{size}} = {{tiles}} casillas (máx. {{max}} jugadores)",
      onlineUpdatingLabel: "Actualizando...",
      onlineGridSizeDisplay:
        "Cuadrícula: {{size}}×{{size}} ({{tiles}} casillas)",
      onlineWinnerMessage: "¡{{name}} gana!",
      onlineFoundAfterTiles:
        "Encontrado después de {{count}} casillas descubiertas",
      onlineYourTurnTitle: "🎯 ¡Tu Turno!",
      onlineClickTileHint: "Haz clic en una casilla para descubrirla",
      onlineChooseTile: "Elige una casilla",
      onlineWaitingForPlayer: "Esperando a {{name}}...",
      onlineProgressLabel: "Progreso: {{uncovered}}/{{total}} casillas",
      onlineStopGameButton: "Detener Juego",
      onlineStopGameWarning:
        "Esto terminará el juego para todos los jugadores y los devolverá al vestíbulo",
      onlineLeavingWarning:
        "Salir terminará el juego para todos los jugadores",
      onlineStartingLabel: "Iniciando...",
      onlineBackToLobbyButton: "Volver al Vestíbulo",
      onlineReturningLabel: "Volviendo...",
      onlineWaitingForHostLabel: "Esperando al anfitrión...",
      onlineOnlyHostCanReturn:
        "Solo el anfitrión puede volver al vestíbulo",
      onlineWaitingForAtLeastTwoPlayers:
        "Esperando al menos 2 jugadores...",
      onlineLeaveRoomButton: "Salir de la Sala",
      onlineWaitingForHostToStart:
        "Esperando que el anfitrión inicie el juego...",
      onlineLoadingLabel: "Cargando...",
      onlineReconnectingLabel: "Reconectando...",
      onlineStoppingLabel: "Deteniendo...",
      onlineShareTitle: "¡Únete a mi juego de Búsqueda del Tesoro!",
      onlineShareText: "Únete a mi juego con el código de sala: {{code}}",
    },
    ko: {
      mainHeading: "🎮 게임 라이브러리",
      welcomeMessage:
        "재미있는 미니게임 모음을 즐기고 다른 플레이어의 점수를 이기는 도전을 해보세요!",
      inputPlaceholder: "게임 검색...",
      visitCountLabel: "오늘의 방문",
      footerContent: "© 2026 게임 라이브러리. Next.js로 제작",
      upDownGameTitle: "업 앤 다운",
      upDownGameDescription:
        "제한된 시도로 숨겨진 숫자를 맞춰보세요. 알아낼 수 있을까요?",
      rpsGameTitle: "가위바위보",
      rpsGameDescription:
        "컴퓨터와 고전 게임을 플레이하세요. 연속 승리로 더 높은 점수를 얻으세요!",
      treasureGameTitle: "보물 찾기",
      treasureGameDescription:
        "두 플레이어가 번갈아 타일을 공개하여 숨겨진 보물을 찾습니다!",
      game47Title: "47",
      game47Description:
        "타이밍 챌린지! 정확히 47.0초에 타이머를 멈추세요. 타이머는 3초 후 사라집니다.",
      linkBackHome: "게임 목록으로",
      actionPlayAgain: "다시 플레이",
      actionNewGame: "새 게임",
      scoreboardTitle: "상위 10 점수판",
      topScoresHeading: "최고 점수",
      playerNameLabel: "플레이어 이름",
      scoreLabel: "점수",
      searchInputLabel: "게임 검색...",
      searchLabel: "게임 검색",
      clearSearchLabel: "검색 지우기",
      searchingForLabel: "검색어:",
      noResultsMessage: "게임을 찾을 수 없습니다",
      noResultsSuggestion: "검색어를 수정해 보세요",
      namePrompt: "이름을 입력하세요",
      submitButton: "점수 저장",
      dismissButton: "건너뛰기",
      congratsMessage: "상위 10 점수!",
      achievementMessage: "상위 10위에 진입했습니다!",
      scoreMessage: "{{score}}점을 획득했습니다!",
      characterCountLabel: "자",
      tagLogic: "논리",
      tagPuzzle: "퍼즐",
      tagSolo: "1인용",
      tagClassic: "클래식",
      tagQuick: "빠른",
      tagDuo: "2인용",
      tagStrategy: "전략",
      tagTiming: "타이밍",
      tagChallenge: "도전",
      scoreboardBadgeLabel: "점수판",
      languagePickerLabel: "언어",
      englishOption: "🇬🇧 English",
      spanishOption: "🇪🇸 Español",
      koreanOption: "🇰🇷 한국어",
      scoreboardEmptyTitle: "아직 점수가 없습니다!",
      scoreboardEmptySubtitle: "가장 먼저 플레이하고 기록을 세워보세요.",
      visitCountTemplateSingular: "오늘 방문 {{count}}회 ({{date}})",
      visitCountTemplatePlural: "오늘 방문 {{count}}회 ({{date}})",
      loadingVisitsLabel: "방문 수 불러오는 중...",
      upDownConfigTitle: "게임 설정",
      upDownConfigSubtitle:
        "선호하는 범위와 시도 횟수를 설정해 난이도를 조절하세요",
      upDownMinLabel: "최소 숫자 (1 - {{max}}):",
      upDownMaxLabel: "최대 숫자 ({{min}} - {{max}}):",
      upDownAttemptsLabel: "최대 시도 횟수 (1 - {{max}}):",
      upDownStartGame: "게임 시작",
      upDownRemainingAttempts: "남은 시도",
      upDownRangeLabel: "범위",
      upDownGuessLabel: "추측 숫자를 입력하세요:",
      upDownMakeGuess: "추측하기",
      upDownLastGuess: "마지막 추측:",
      upDownWinTitle: "축하합니다!",
      upDownWinMessage: "{{number}}을(를) 맞췄습니다!",
      upDownLoseTitle: "게임 오버!",
      upDownLoseMessage: "정답은 {{number}}였습니다",
      upDownHigherHint: "더 높게!",
      upDownLowerHint: "더 낮게!",
      upDownFirstGuess: "첫 번째 추측을 해보세요!",
      upDownLongDescription:
        "숫자 맞추기 게임! 범위와 시도 횟수를 설정해 난이도를 조절하세요. 기본값: {{min}}부터 {{max}}까지 {{attempts}}번 안에 맞추기.",
      rpsPageDescription:
        "컴퓨터와 대결하고 연속 승리를 최대한 많이 쌓아보세요!",
      rpsConsecutiveWinsLabel: "연속 승리",
      rpsYouLabel: "당신",
      rpsComputerLabel: "컴퓨터",
      rpsChooseNext: "다음 선택을 하세요:",
      rpsChooseFirst: "수 선택:",
      rpsWinMessage: "승리!",
      rpsLoseMessage: "패배!",
      rpsFinalScore: "최종 점수: 연속 승리 {{score}}회",
      rpsDrawMessage: "무승부!",
      rpsVsLabel: "VS",
      rpsChoiceRock: "바위",
      rpsChoicePaper: "보",
      rpsChoiceScissors: "가위",
      treasureConfigTitle: "게임 설정",
      treasureGridSizeLabel: "격자 크기",
      treasureGridInfo: "{{size}}×{{size}} 격자 = {{tiles}}칸",
      treasurePlayerCountLabel: "플레이어 수 (2-{{max}})",
      treasurePlayerCountError: "2에서 {{max}} 사이여야 합니다",
      treasurePlayerNamesLabel: "플레이어 이름 (각 20자 이내)",
      treasurePlayerPlaceholder: "플레이어 {{number}}",
      treasureStartGame: "게임 시작",
      treasureRulesTitle: "게임 규칙:",
      treasureRuleTurns: "플레이어가 번갈아 타일을 선택합니다",
      treasureRuleHidden: "한 타일에 보물이 숨겨져 있습니다 💎",
      treasureRuleWin: "보물을 먼저 찾는 플레이어가 승리합니다!",
      treasureRuleCovered: "덮인 타일은 나무 🌳 로 표시됩니다",
      treasureDescriptionConfig: "게임을 설정하고 보물 찾기를 시작하세요!",
      treasureDescriptionPlay: "번갈아 타일을 공개하여 숨겨진 보물을 찾으세요!",
      treasureWinnerMessage: "{{name}} 승리!",
      treasureTurnMessage: "{{name}}의 차례",
      treasureTurnHint: "타일을 눌러 보물을 찾으세요",
      treasureNewGame: "새 게임",
      treasureGridLabel: "격자:",
      treasurePlayersLabel: "플레이어:",
      treasureInvalidConfig: "잘못된 설정입니다",
      game47PageDescription:
        "타이밍 챌린지! 정확히 47.0초에 타이머를 멈추세요. 타이머는 3초 후 사라집니다—감각을 믿어보세요.",
      game47SelectDifficultyTitle: "난이도 선택",
      game47SelectDifficultySubtitle: "목표 시간을 선택하세요:",
      game47ReadyTitle: "플레이 준비됐나요?",
      game47DifficultyLabel: "난이도: {{difficulty}}",
      game47TargetLabel: "목표: {{time}}",
      game47StopAtExact: "정확히 {{time}}에 타이머를 멈추면 승리!",
      game47FadeOutHint:
        "타이머는 3초 후 사라지므로, 시간 감각에 의존해야 합니다.",
      game47StartTimer: "타이머 시작",
      game47TimerRunning: "타이머 작동 중...",
      game47StopTimer: "타이머 정지",
      game47PerfectTitle: "완벽해요!",
      game47PerfectMessage: "{{time}}초에 정확히 멈췄습니다!",
      game47ResultTitle: "결과",
      game47StoppedAtMessage: "{{time}}초에 멈췄습니다",
      game47DifferenceLabel: "목표와의 차이:",
      game47StoppedLate: "(늦게 멈춤)",
      game47StoppedEarly: "(일찍 멈춤)",
      game47DifficultyEasy: "쉬움",
      game47DifficultyMedium: "보통",
      game47DifficultyHard: "어려움",
      treasureMinPlayersRequired: "최소 2명의 플레이어가 필요합니다",
      treasureMaxPlayersForGrid:
        "{{size}}×{{size}} 격자의 최대 플레이어 수는 {{max}}명입니다",
      treasurePlayOnlineMultiplayer: "🌐 온라인 멀티플레이어",
      treasureLeaverGameResetMessage:
        "게임이 로비로 재설정되었습니다. 호스트가 새 게임을 시작할 수 있습니다.",
      onlineSessionExpired:
        "세션이 만료되었습니다. 새 방을 만들거나 참가하세요.",
      onlineRoomExpired: "이 방은 만료되었거나 더 이상 존재하지 않습니다.",
      onlineRoomClosed: "이 방은 닫혔거나 만료되었습니다.",
      onlineConnectionLost:
        "게임 서버와의 연결이 끊어졌습니다. 새로고침하세요.",
      onlineEnterUsernameError: "사용자 이름을 입력하세요",
      onlineCreateRoomError:
        "방을 만들지 못했습니다. 다시 시도해 주세요.",
      onlineEnterRoomCodeError: "방 코드를 입력하세요",
      onlineRoomNotFound:
        "방을 찾을 수 없습니다. 코드를 확인하고 다시 시도하세요.",
      onlineRoomFull: "이 방이 꽉 찼습니다. 다른 방을 시도해 보세요.",
      onlineJoinRoomError:
        "방에 참가하지 못했습니다. 다시 시도해 주세요.",
      onlineCopyCodeError: "방 코드 복사에 실패했습니다",
      onlineCopyLinkError: "방 링크 복사에 실패했습니다",
      onlineStartGameError:
        "게임을 시작하지 못했습니다. 다시 시도해 주세요.",
      onlineUpdateGridError:
        "격자 크기 업데이트에 실패했습니다. 다시 시도해 주세요.",
      onlineNotYourTurn: "당신의 차례가 아닙니다!",
      onlineMoveError:
        "이동을 완료하지 못했습니다. 다시 시도해 주세요.",
      onlineRestartGameError:
        "게임을 재시작하지 못했습니다. 다시 시도해 주세요.",
      onlineReturnToLobbyError:
        "로비로 돌아가지 못했습니다. 다시 시도해 주세요.",
      onlineStopGameError:
        "게임을 중지하지 못했습니다. 다시 시도해 주세요.",
      onlineGameStoppedByHost: "호스트가 게임을 중지했습니다.",
      onlineStopGameConfirm:
        "게임을 중지하시겠습니까? 모든 플레이어의 게임이 종료되고 로비로 돌아갑니다.",
      onlineTitleReconnecting: "보물 찾기 - 재연결 중",
      onlineDescReconnecting:
        "게임에 재연결하는 동안 잠시 기다려 주세요",
      onlineTitleLanding: "보물 찾기 - 온라인 멀티플레이어",
      onlineDescLanding:
        "방을 만들거나 참가하여 친구들과 온라인으로 플레이하세요",
      onlineTitleInProgress: "보물 찾기 - 게임 진행 중",
      onlineDescInProgress: "숨겨진 보물을 찾으세요!",
      onlineTitleLobby: "보물 찾기 - 대기실",
      onlineDescLobby: "플레이어들이 참가하기를 기다리는 중",
      onlineTitleLoading: "보물 찾기 - 로딩 중",
      onlineDescLoading: "멀티플레이어 게임 로딩 중...",
      onlineBackToTreasureHunt: "보물 찾기로 돌아가기",
      onlineUsernameLabel: "사용자 이름",
      onlineUsernamePlaceholder: "이름을 입력하세요",
      onlineNumberOfPlayersLabel: "플레이어 수",
      onlineMaxPlayersInfo: "최대 {{count}}명이 이 방에 참가할 수 있습니다",
      onlinePlayerCountNote:
        "방 생성 후 플레이어 수를 변경할 수 없습니다. 격자 크기는 로비에서 조정할 수 있습니다.",
      onlineCreateRoomTitle: "새 방 만들기",
      onlineCreatingLabel: "만드는 중...",
      onlineCreateRoomButton: "방 만들기",
      onlineJoinRoomTitle: "기존 방 참가",
      onlineRoomCodePlaceholder: "6자리 방 코드 입력",
      onlineJoiningLabel: "참가 중...",
      onlineJoinRoomButton: "방 참가",
      onlineQuickTipsTitle: "빠른 팁:",
      onlineQuickTip1: "방은 1시간 비활성 후 만료됩니다",
      onlineQuickTip2: "친구들과 방 링크를 공유할 수 있습니다",
      onlineQuickTip3: "세션이 자동으로 저장됩니다",
      onlineRoomCodeLabel: "방 코드",
      onlineCopiedLabel: "✓ 복사됨!",
      onlineCopyCodeButton: "📋 코드 복사",
      onlineLinkCopiedLabel: "✓ 링크 복사됨!",
      onlineShareLinkButton: "🔗 링크 공유",
      onlinePlayersHeading: "플레이어 ({{count}}/{{max}})",
      onlinePlayerLabel: "플레이어 {{number}}:",
      onlineTurnIndicator: "(차례)",
      onlineDisconnectedLabel: "연결 끊김",
      onlineYouLabel: "(나)",
      onlineBackInLobby:
        "로비로 돌아왔습니다. 호스트가 새 게임을 시작할 수 있습니다.",
      onlineCanBeChanged: "변경 가능",
      onlineSetAtCreation: "생성 시 설정됨",
      onlineGridSizeInfo:
        "{{size}}×{{size}} 격자 = {{tiles}}칸 (최대 {{max}}명)",
      onlineUpdatingLabel: "업데이트 중...",
      onlineGridSizeDisplay: "격자: {{size}}×{{size}} ({{tiles}}칸)",
      onlineWinnerMessage: "{{name}} 승리!",
      onlineFoundAfterTiles: "{{count}}개의 타일을 공개한 후 발견",
      onlineYourTurnTitle: "🎯 당신의 차례!",
      onlineClickTileHint: "타일을 눌러 공개하세요",
      onlineChooseTile: "타일 선택",
      onlineWaitingForPlayer: "{{name}} 대기 중...",
      onlineProgressLabel: "진행: {{uncovered}}/{{total}} 타일",
      onlineStopGameButton: "게임 중지",
      onlineStopGameWarning:
        "모든 플레이어의 게임이 종료되고 로비로 돌아갑니다",
      onlineLeavingWarning: "나가면 모든 플레이어의 게임이 종료됩니다",
      onlineStartingLabel: "시작 중...",
      onlineBackToLobbyButton: "로비로 돌아가기",
      onlineReturningLabel: "돌아가는 중...",
      onlineWaitingForHostLabel: "호스트 대기 중...",
      onlineOnlyHostCanReturn: "호스트만 로비로 돌아갈 수 있습니다",
      onlineWaitingForAtLeastTwoPlayers: "최소 2명의 플레이어를 기다리는 중...",
      onlineLeaveRoomButton: "방 나가기",
      onlineWaitingForHostToStart:
        "호스트가 게임을 시작하기를 기다리는 중...",
      onlineLoadingLabel: "로딩 중...",
      onlineReconnectingLabel: "재연결 중...",
      onlineStoppingLabel: "중지 중...",
      onlineShareTitle: "보물 찾기 게임에 참가하세요!",
      onlineShareText: "방 코드로 게임에 참가하세요: {{code}}",
    },
  };

  constructor() {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem(this.storageKey);
      if (savedLang === "es" || savedLang === "ko") {
        this.selectedLang = savedLang;
      }
    }
  }

  getActiveLanguage(): LangCode {
    return this.selectedLang;
  }

  changeLanguage(newLang: LangCode): void {
    if (this.selectedLang !== newLang) {
      this.selectedLang = newLang;
      if (typeof window !== "undefined") {
        localStorage.setItem(this.storageKey, newLang);
      }
      this.notifyAllListeners();
    }
  }

  getTranslations() {
    return this.textMappings[this.selectedLang];
  }

  attachListener(handler: EventHandler): () => void {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter((h) => h !== handler);
    };
  }

  private notifyAllListeners(): void {
    this.listeners.forEach((handler) => handler());
  }
}

export const translationEngine = new TranslationEngine();
export type TextMapping = ReturnType<typeof translationEngine.getTranslations>;

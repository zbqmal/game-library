// Custom Translation Engine for Game Library
// Class-based event emitter pattern with unique architecture

type LangCode = 'en' | 'es' | 'ko';
type EventHandler = () => void;

class TranslationEngine {
  private selectedLang: LangCode = 'en';
  private listeners: EventHandler[] = [];
  private storageKey = 'game_library_language_preference';
  
  private textMappings = {
    en: {
      mainHeading: '🎮 Game Library',
      welcomeMessage: 'Enjoy a collection of fun mini-games and challenge yourself to beat other players\' scores!',
      inputPlaceholder: 'Search games...',
      visitCountLabel: 'Today\'s Visits',
      footerContent: '© 2026 Game Library. Built with Next.js',
      upDownGameTitle: 'Up And Down',
      upDownGameDescription: 'Guess the secret number with limited attempts. Can you figure it out?',
      rpsGameTitle: 'Rock-Paper-Scissors',
      rpsGameDescription: 'Play the classic game against the computer. Get consecutive wins for higher scores!',
      treasureGameTitle: 'Treasure Hunt',
      treasureGameDescription: 'Two players take turns uncovering tiles to find the hidden treasure!',
      game47Title: '47',
      game47Description: 'A timing challenge! Stop the timer at exactly 47.0 seconds. The timer fades out after 3 seconds.',
      linkBackHome: 'Back to Home',
      actionPlayAgain: 'Play Again',
      actionNewGame: 'New Game',
      scoreboardTitle: 'Scoreboard',
      topScoresHeading: 'Top Scores',
      playerNameLabel: 'Player Name',
      scoreLabel: 'Score',
      searchInputLabel: 'Search games...',
      noResultsMessage: 'No games found',
      namePrompt: 'Enter your name',
      submitButton: 'Save',
      dismissButton: 'Cancel',
      congratsMessage: 'Congratulations!',
      achievementMessage: 'You made it to the top 10!',
      tagLogic: 'logic',
      tagPuzzle: 'puzzle',
      tagSolo: 'single-player',
      tagClassic: 'classic',
      tagQuick: 'quick',
      tagDuo: 'two-player',
      tagStrategy: 'strategy',
      tagTiming: 'timing',
      tagChallenge: 'challenge',
      languagePickerLabel: 'Language',
      englishOption: 'English',
      spanishOption: 'Spanish',
      koreanOption: 'Korean',
    },
    es: {
      mainHeading: '🎮 Biblioteca de Juegos',
      welcomeMessage: '¡Disfruta de una colección de minijuegos divertidos y desafíate a superar las puntuaciones de otros jugadores!',
      inputPlaceholder: 'Buscar juegos...',
      visitCountLabel: 'Visitas de Hoy',
      footerContent: '© 2026 Biblioteca de Juegos. Creado con Next.js',
      upDownGameTitle: 'Arriba y Abajo',
      upDownGameDescription: '¡Adivina el número secreto con intentos limitados. ¿Puedes resolverlo?',
      rpsGameTitle: 'Piedra-Papel-Tijeras',
      rpsGameDescription: '¡Juega el juego clásico contra la computadora. Consigue victorias consecutivas para obtener puntuaciones más altas!',
      treasureGameTitle: 'Búsqueda del Tesoro',
      treasureGameDescription: '¡Dos jugadores se turnan para descubrir fichas y encontrar el tesoro escondido!',
      game47Title: '47',
      game47Description: '¡Un desafío de tiempo! Detén el temporizador exactamente a los 47.0 segundos. El temporizador se desvanece después de 3 segundos.',
      linkBackHome: 'Volver al Inicio',
      actionPlayAgain: 'Jugar de Nuevo',
      actionNewGame: 'Nuevo Juego',
      scoreboardTitle: 'Tabla de Puntuaciones',
      topScoresHeading: 'Mejores Puntuaciones',
      playerNameLabel: 'Nombre del Jugador',
      scoreLabel: 'Puntuación',
      searchInputLabel: 'Buscar juegos...',
      noResultsMessage: 'No se encontraron juegos',
      namePrompt: 'Ingresa tu nombre',
      submitButton: 'Guardar',
      dismissButton: 'Cancelar',
      congratsMessage: '¡Felicitaciones!',
      achievementMessage: '¡Llegaste al top 10!',
      tagLogic: 'lógica',
      tagPuzzle: 'rompecabezas',
      tagSolo: 'un jugador',
      tagClassic: 'clásico',
      tagQuick: 'rápido',
      tagDuo: 'dos jugadores',
      tagStrategy: 'estrategia',
      tagTiming: 'tiempo',
      tagChallenge: 'desafío',
      languagePickerLabel: 'Idioma',
      englishOption: 'Inglés',
      spanishOption: 'Español',
      koreanOption: '한국어',
    },
    ko: {
      mainHeading: '🎮 게임 라이브러리',
      welcomeMessage: '재미있는 미니게임 모음을 즐기고 다른 플레이어의 점수를 이기는 도전을 해보세요!',
      inputPlaceholder: '게임 검색...',
      visitCountLabel: '오늘의 방문',
      footerContent: '© 2026 게임 라이브러리. Next.js로 제작',
      upDownGameTitle: '업 앤 다운',
      upDownGameDescription: '제한된 시도로 숨겨진 숫자를 맞춰보세요. 알아낼 수 있을까요?',
      rpsGameTitle: '가위바위보',
      rpsGameDescription: '컴퓨터와 고전 게임을 플레이하세요. 연속 승리로 더 높은 점수를 얻으세요!',
      treasureGameTitle: '보물 찾기',
      treasureGameDescription: '두 플레이어가 번갈아 타일을 공개하여 숨겨진 보물을 찾습니다!',
      game47Title: '47',
      game47Description: '타이밍 챌린지! 정확히 47.0초에 타이머를 멈추세요. 타이머는 3초 후 사라집니다.',
      linkBackHome: '홈으로 돌아가기',
      actionPlayAgain: '다시 플레이',
      actionNewGame: '새 게임',
      scoreboardTitle: '점수판',
      topScoresHeading: '최고 점수',
      playerNameLabel: '플레이어 이름',
      scoreLabel: '점수',
      searchInputLabel: '게임 검색...',
      noResultsMessage: '게임을 찾을 수 없습니다',
      namePrompt: '이름을 입력하세요',
      submitButton: '저장',
      dismissButton: '취소',
      congratsMessage: '축하합니다!',
      achievementMessage: '상위 10위에 진입했습니다!',
      tagLogic: '논리',
      tagPuzzle: '퍼즐',
      tagSolo: '1인용',
      tagClassic: '클래식',
      tagQuick: '빠른',
      tagDuo: '2인용',
      tagStrategy: '전략',
      tagTiming: '타이밍',
      tagChallenge: '도전',
      languagePickerLabel: '언어',
      englishOption: 'English',
      spanishOption: 'Español',
      koreanOption: '한국어',
    },
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(this.storageKey);
      if (savedLang === 'es' || savedLang === 'ko') {
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
      if (typeof window !== 'undefined') {
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
      this.listeners = this.listeners.filter(h => h !== handler);
    };
  }

  private notifyAllListeners(): void {
    this.listeners.forEach(handler => handler());
  }
}

export const translationEngine = new TranslationEngine();
export type TextMapping = ReturnType<typeof translationEngine.getTranslations>;

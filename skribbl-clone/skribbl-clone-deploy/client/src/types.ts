export interface AvatarConfig {
  color: string;
  eyes: number;
  mouth: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: AvatarConfig;
  score: number;
  turnScore: number;
  guessed: boolean;
  rank: number;
  isHost: boolean;
  isDrawing: boolean;
}

export interface RoomSettings {
  maxPlayers: number;
  drawTime: number;
  rounds: number;
  wordCount: number;
  hints: number;
  customWords: string[];
}

export type GameState = 'LOBBY' | 'CHOOSING_WORD' | 'DRAWING' | 'TURN_END' | 'GAME_OVER';

export interface RoomState {
  id: string;
  isPrivate: boolean;
  settings: RoomSettings;
  state: GameState;
  currentRound: number;
  currentDrawerId: string | null;
  wordOptions: string[];
  displayWord: string;
  wordLength: number;
  timeRemaining: number;
  turnReason: string;
  players: Player[];
}

export interface ChatMessage {
  id?: string;
  type: 'user' | 'system';
  subType?: 'join' | 'leave' | 'correct_guess' | 'close_guess' | 'turn_start' | 'info';
  senderName?: string;
  playerId?: string;
  text: string;
  isGuessedChat?: boolean;
}

export interface DrawStroke {
  prevX: number;
  prevY: number;
  x: number;
  y: number;
  color: string;
  size: number;
  isEnd: boolean;
}

export interface FillCommand {
  x: number;
  y: number;
  color: string;
}

export type HistoryItem =
  | { type: 'stroke'; data: DrawStroke }
  | { type: 'fill'; data: FillCommand }
  | { type: 'clear' };

import { useGameStore } from './engine/gameStore';
import { Menu } from './ui/Menu';
import { WorldSelect } from './ui/WorldSelect';
import { GameScreen } from './ui/GameScreen';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  switch (phase) {
    case 'MENU':
      return <Menu />;
    case 'WORLD_SELECT':
      return <WorldSelect />;
    case 'PLAYING':
    case 'DISCOVERY':
    case 'DEATH':
    case 'RESULT':
      return <GameScreen />;
    default:
      return <Menu />;
  }
}

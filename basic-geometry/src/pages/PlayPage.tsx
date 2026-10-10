import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GameBoard } from '../components/game/GameBoard';
import { GameMenu } from '../components/game/GameMenu';
import { ReviewScreen } from '../components/game/ReviewScreen';
import { getLevel, getMode, type ModeId } from '../data/levels';
import { useGameSession } from '../lib/useGameSession';

/**
 * /play — menu → game → review. Deep links: /play?mode=mistakes, /play?mode=area,
 * /play?level=2 start a round straight away.
 */
export function PlayPage() {
  const session = useGameSession();
  const [params, setParams] = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const mode = params.get('mode');
    const level = Number(params.get('level'));
    if (mode && getMode(mode)) session.start(mode as ModeId, getLevel(level) ? level : undefined);
    else if (getLevel(level)) session.start('levels', level);
    if (mode || params.get('level')) setParams({}, { replace: true });
  }, [params, session, setParams]);

  const { game } = session;
  if (!game) return <GameMenu onStart={session.start} />;
  if (game.status === 'playing') return <GameBoard game={game} onSelect={session.select} onChoose={session.choose} onEndEarly={session.endEarly} onQuit={session.quit} />;
  return <ReviewScreen game={game} onStart={session.start} onMenu={session.quit} />;
}

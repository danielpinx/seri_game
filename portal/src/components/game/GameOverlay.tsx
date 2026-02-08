interface StartOverlayProps {
  type: "start";
  gameName: string;
  gpCost: number;
  insufficientGp: boolean;
  onAction: () => void;
  score?: never;
}

interface GameOverOverlayProps {
  type: "gameover";
  score: number;
  gpCost: number;
  insufficientGp: boolean;
  onAction: () => void;
  gameName?: never;
}

type Props = StartOverlayProps | GameOverOverlayProps;

export function GameOverlay(props: Props) {
  const { type, gpCost, insufficientGp, onAction } = props;

  return (
    <div className="absolute inset-0 bg-bg-primary/85 backdrop-blur-sm flex items-center justify-center rounded-2xl">
      <div className="text-center">
        {type === "start" && (
          <>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              {props.gameName}
            </h2>
            <p className="text-text-secondary text-sm mb-8">
              <span className="text-gold font-semibold">{gpCost} GP</span>{" "}
              per play
            </p>
          </>
        )}

        {type === "gameover" && (
          <>
            <p className="text-text-muted text-xs uppercase tracking-widest mb-1">
              Game Over
            </p>
            <p className="text-3xl font-bold text-text-primary mb-8">
              {props.score.toLocaleString()}
              <span className="text-sm text-text-muted font-normal ml-2">pts</span>
            </p>
          </>
        )}

        {insufficientGp ? (
          <div className="glass rounded-xl px-6 py-4">
            <p className="text-danger text-sm font-medium mb-1">
              Not enough GP
            </p>
            <p className="text-text-muted text-xs">
              Come back tomorrow for 100 free GP
            </p>
          </div>
        ) : (
          <button
            onClick={onAction}
            className="group relative px-8 py-3 rounded-xl bg-gradient-to-r from-accent to-cyan text-white text-sm font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(108,92,231,0.4)] hover:scale-105 active:scale-95"
          >
            {type === "start" ? "Start Game" : "Play Again"}
          </button>
        )}
      </div>
    </div>
  );
}

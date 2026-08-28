import { TETROMINOES, TetrominoType } from './tetrisEngine'

interface TetrisPiecePreviewProps {
  type: TetrominoType | null
  label: string
  size?: number
}

export function TetrisPiecePreview({ type, label, size = 18 }: TetrisPiecePreviewProps) {
  const pieceInfo = type ? TETROMINOES[type] : null

  return (
    <div className="tetris-preview-card">
      <span className="preview-label">{label}</span>
      <div
        className="preview-grid-box"
        style={{
          width: `${size * 4}px`,
          height: `${size * 4}px`
        }}
      >
        {pieceInfo && (
          <div
            className="piece-matrix"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${pieceInfo.shape[0].length}, ${size}px)`,
              gap: '1px'
            }}
          >
            {pieceInfo.shape.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: cell ? pieceInfo.color : 'transparent',
                    boxShadow: cell ? `0 0 6px ${pieceInfo.color}` : 'none',
                    borderRadius: cell ? '2px' : '0'
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

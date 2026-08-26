import './Reservatorio.css'

function Reservatorio({ percentual }) {
  const alturaMaxima = 125
  const alturaLiquido = alturaMaxima * (percentual / 100)
  const yLiquido = 158 - alturaLiquido

  return (
    <div className="reservatorio-svg-wrapper">
      <svg
        viewBox="0 0 180 210"
        className="reservatorio-svg"
      >
        <defs>
          <linearGradient id="agua" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#54c7ee" />
            <stop offset="100%" stopColor="#0a9bd4" />
          </linearGradient>

          <clipPath id={`clip-${percentual}`}>
            <rect
              x="35"
              y="30"
              width="110"
              height="140"
              rx="4"
            />
          </clipPath>
        </defs>

        {/* corpo do cilindro */}
        <rect
          x="35"
          y="30"
          width="110"
          height="140"
          fill="#eef7fd"
          stroke="#073b75"
          strokeWidth="5"
        />

        {/* líquido */}
        <g clipPath={`url(#clip-${percentual})`}>
          <rect
            x="35"
            y={yLiquido}
            width="110"
            height={alturaLiquido + 10}
            fill="url(#agua)"
          />

          <ellipse
            cx="90"
            cy={yLiquido}
            rx="55"
            ry="6"
            fill="#62cef1"
          />
        </g>

        {/* topo oval */}
        <ellipse
          cx="90"
          cy="30"
          rx="55"
          ry="11"
          fill="#dceefa"
          stroke="#073b75"
          strokeWidth="5"
        />

        {/* base oval */}
        <ellipse
          cx="90"
          cy="170"
          rx="60"
          ry="10"
          fill="#234b88"
          stroke="#073b75"
          strokeWidth="5"
        />

        {/* percentual */}
        <text
          x="90"
          y="105"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="25"
          fontWeight="700"
          fill="#073b75"
        >
          {percentual}%
        </text>
      </svg>
    </div>
  )
}

export default Reservatorio
export function CapybaraOnsen({ width = 320 }: { width?: number }) {
  return (
    <svg
      viewBox="0 0 360 260"
      width={width}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="bathWater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C76A" />
          <stop offset="60%" stopColor="#D9A94A" />
          <stop offset="100%" stopColor="#B8863A" />
        </linearGradient>
        <linearGradient id="tubWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9C6E48" />
          <stop offset="100%" stopColor="#6E4A30" />
        </linearGradient>
        <linearGradient id="tubRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C99A6E" />
          <stop offset="100%" stopColor="#A07550" />
        </linearGradient>
        <linearGradient id="furGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A87555" />
          <stop offset="100%" stopColor="#8B5A3D" />
        </linearGradient>
        <radialGradient id="yuzu" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#FBE889" />
          <stop offset="60%" stopColor="#F4C95D" />
          <stop offset="100%" stopColor="#D89A2A" />
        </radialGradient>
        <radialGradient id="steam" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFDF7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFDF7" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g opacity="0.9">
        <ellipse cx="80" cy="40" rx="34" ry="22" fill="url(#steam)" />
        <ellipse cx="130" cy="22" rx="40" ry="20" fill="url(#steam)" />
        <ellipse cx="200" cy="32" rx="46" ry="24" fill="url(#steam)" />
        <ellipse cx="270" cy="48" rx="38" ry="22" fill="url(#steam)" />
        <ellipse cx="310" cy="28" rx="30" ry="18" fill="url(#steam)" />
      </g>

      <ellipse cx="180" cy="125" rx="158" ry="32" fill="url(#tubRim)" />
      <ellipse cx="180" cy="120" rx="150" ry="26" fill="#7A5236" />

      <ellipse cx="180" cy="155" rx="92" ry="48" fill="url(#furGrad)" />

      <ellipse cx="180" cy="135" rx="150" ry="22" fill="url(#bathWater)" />
      <ellipse cx="180" cy="135" rx="150" ry="22" fill="none" stroke="#F0D778" strokeWidth="1.5" opacity="0.5" />
      <path
        d="M 60 138 Q 90 134, 120 138 T 180 138 T 240 138 T 300 138"
        stroke="#F4DA85"
        strokeWidth="1.2"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M 80 144 Q 110 141, 140 144 T 200 144 T 260 144"
        stroke="#F4DA85"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />

      <g>
        <ellipse cx="110" cy="132" rx="22" ry="12" fill="#9C6A4B" />
        <ellipse cx="250" cy="132" rx="22" ry="12" fill="#9C6A4B" />

        <path
          d="M 120 110
             Q 120 65, 180 62
             Q 240 65, 240 110
             Q 240 130, 215 134
             Q 180 138, 145 134
             Q 120 130, 120 110 Z"
          fill="url(#furGrad)"
        />

        <ellipse cx="180" cy="118" rx="38" ry="20" fill="#B98264" />

        <ellipse cx="138" cy="72" rx="11" ry="9" fill="#8B5A3D" />
        <ellipse cx="138" cy="73" rx="6" ry="5" fill="#5E3A26" />
        <ellipse cx="222" cy="72" rx="11" ry="9" fill="#8B5A3D" />
        <ellipse cx="222" cy="73" rx="6" ry="5" fill="#5E3A26" />

        <path
          d="M 155 95 Q 162 88, 169 95"
          stroke="#2A1B12"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 191 95 Q 198 88, 205 95"
          stroke="#2A1B12"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        <ellipse cx="148" cy="112" rx="8" ry="5" fill="#E89B7E" opacity="0.6" />
        <ellipse cx="212" cy="112" rx="8" ry="5" fill="#E89B7E" opacity="0.6" />

        <ellipse cx="180" cy="113" rx="5" ry="3.5" fill="#2A1B12" />

        <path
          d="M 174 124 Q 180 128, 186 124"
          stroke="#2A1B12"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      <g transform="translate(180 56)">
        <ellipse cx="0" cy="4" rx="20" ry="6" fill="#000" opacity="0.12" />
        <circle cx="0" cy="0" r="17" fill="url(#yuzu)" />
        <circle cx="-6" cy="-4" r="1.2" fill="#C99124" opacity="0.5" />
        <circle cx="5" cy="-2" r="1" fill="#C99124" opacity="0.5" />
        <circle cx="-2" cy="5" r="1" fill="#C99124" opacity="0.5" />
        <circle cx="7" cy="4" r="1.2" fill="#C99124" opacity="0.5" />
        <ellipse cx="-6" cy="-7" rx="4" ry="2.5" fill="#FFF4C2" opacity="0.7" />
        <path d="M 2 -16 Q 10 -22, 14 -18 Q 8 -14, 2 -14 Z" fill="#7A8F45" />
        <path d="M 2 -16 Q 8 -17, 13 -19" stroke="#5E7034" strokeWidth="0.6" fill="none" />
        <path d="M 1 -17 Q 1 -19, 3 -20" stroke="#5E3A26" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>

      {[
        { x: 70, y: 138, r: 11 },
        { x: 105, y: 145, r: 9 },
        { x: 255, y: 142, r: 10 },
        { x: 295, y: 138, r: 12 },
        { x: 322, y: 148, r: 8 },
        { x: 50, y: 148, r: 8 },
      ].map((yz, i) => (
        <g key={i} transform={`translate(${yz.x} ${yz.y})`}>
          <ellipse cx="0" cy={yz.r * 0.4} rx={yz.r + 2} ry="2" fill="#000" opacity="0.1" />
          <circle cx="0" cy="0" r={yz.r} fill="url(#yuzu)" />
          <ellipse
            cx={-yz.r * 0.3}
            cy={-yz.r * 0.4}
            rx={yz.r * 0.35}
            ry={yz.r * 0.2}
            fill="#FFF4C2"
            opacity="0.7"
          />
          <path
            d={`M ${-yz.r * 0.2} ${-yz.r} Q 2 ${-yz.r - 4}, ${yz.r * 0.5} ${-yz.r - 2}`}
            stroke="#7A8F45"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}

      <path
        d="M 22 140
           Q 22 175, 60 195
           Q 120 215, 180 215
           Q 240 215, 300 195
           Q 338 175, 338 140
           L 338 148
           Q 338 184, 300 204
           Q 240 224, 180 224
           Q 120 224, 60 204
           Q 22 184, 22 148 Z"
        fill="url(#tubWood)"
      />
      <g opacity="0.35" stroke="#3D2814" strokeWidth="1" fill="none">
        <path d="M 60 148 Q 64 180, 80 200" />
        <path d="M 110 154 Q 112 188, 124 210" />
        <path d="M 180 156 L 180 218" />
        <path d="M 250 154 Q 248 188, 236 210" />
        <path d="M 300 148 Q 296 180, 280 200" />
      </g>
      <ellipse cx="180" cy="142" rx="156" ry="6" fill="#D4A878" opacity="0.5" />
    </svg>
  );
}

export function CapybaraGlassScene({ width = 360 }: { width?: number }) {
  return (
    <svg
      viewBox="0 0 390 310"
      width={width}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="glassSceneSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DDF3F0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFF4D6" stopOpacity="0.58" />
        </linearGradient>
        <linearGradient id="glassSceneMain" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F8F5D7" stopOpacity="0.88" />
          <stop offset="44%" stopColor="#BFE6DD" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#D7C7F4" stopOpacity="0.78" />
        </linearGradient>
        <linearGradient id="glassSceneWarm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF1B7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F0B9BE" stopOpacity="0.74" />
        </linearGradient>
        <radialGradient id="glassSceneGlow" cx="0.5" cy="0.5" r="0.64">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.86" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <filter id="glassSceneSoft" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
          <feOffset dy="5" result="offset" />
          <feColorMatrix
            in="offset"
            type="matrix"
            values="0 0 0 0 0.26 0 0 0 0 0.34 0 0 0 0 0.28 0 0 0 0.18 0"
          />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="390" height="310" fill="url(#glassSceneSky)" opacity="0.4" />

      <g opacity="0.58">
        <ellipse cx="54" cy="74" rx="38" ry="18" fill="url(#glassSceneGlow)" />
        <ellipse cx="168" cy="52" rx="48" ry="20" fill="url(#glassSceneGlow)" />
        <ellipse cx="298" cy="70" rx="54" ry="22" fill="url(#glassSceneGlow)" />
      </g>

      <g filter="url(#glassSceneSoft)">
        <path
          d="M-18 194 C34 138, 88 132, 136 184 C178 226, 223 226, 274 178 C318 136, 358 150, 412 204 L412 322 L-18 322 Z"
          fill="url(#glassSceneMain)"
          opacity="0.52"
          stroke="#FFFFFF"
          strokeOpacity="0.46"
          strokeWidth="2"
        />
        <path
          d="M-16 226 C38 190, 102 184, 164 218 C224 250, 294 226, 406 236 L406 322 L-16 322 Z"
          fill="#FFF8E6"
          opacity="0.54"
        />
      </g>

      <g opacity="0.62">
        <ellipse cx="82" cy="218" rx="76" ry="22" fill="url(#glassSceneMain)" />
        <ellipse cx="184" cy="226" rx="92" ry="25" fill="url(#glassSceneMain)" />
        <ellipse cx="306" cy="218" rx="82" ry="24" fill="url(#glassSceneMain)" />
      </g>

      <g filter="url(#glassSceneSoft)">
        <ellipse
          cx="196"
          cy="244"
          rx="146"
          ry="36"
          fill="#F7C7C9"
          opacity="0.52"
          stroke="#FFFFFF"
          strokeOpacity="0.48"
          strokeWidth="2"
        />
        <path
          d="M52 244 C96 234, 128 253, 174 243 C226 232, 270 253, 337 240"
          stroke="#FFFDF7"
          strokeOpacity="0.66"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      <g filter="url(#glassSceneSoft)" transform="translate(220 127)">
        <ellipse cx="46" cy="106" rx="80" ry="24" fill="#5C6E3E" opacity="0.1" />
        <path
          d="M-2 92 C4 46, 41 23, 90 32 C134 40, 157 74, 146 108 C136 138, 91 148, 48 139 C15 132,-7 118,-2 92Z"
          fill="url(#glassSceneMain)"
          opacity="0.9"
          stroke="#FFFFFF"
          strokeOpacity="0.58"
          strokeWidth="2.4"
        />
        <circle cx="32" cy="50" r="15" fill="url(#glassSceneMain)" opacity="0.82" />
        <circle cx="105" cy="51" r="15" fill="url(#glassSceneMain)" opacity="0.82" />
        <ellipse cx="71" cy="92" rx="42" ry="24" fill="url(#glassSceneWarm)" opacity="0.68" />
        <path
          d="M44 74 Q50 67 57 75M91 75 Q97 67 104 75"
          stroke="#5B4A36"
          strokeOpacity="0.76"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="72" cy="88" rx="6" ry="4.2" fill="#5B4A36" opacity="0.75" />
        <path
          d="M64 104 Q72 110 81 104"
          stroke="#5B4A36"
          strokeOpacity="0.7"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="38" cy="96" rx="10" ry="6" fill="#F6AEB4" opacity="0.44" />
        <ellipse cx="107" cy="96" rx="10" ry="6" fill="#F6AEB4" opacity="0.44" />
        <circle cx="72" cy="28" r="17" fill="url(#glassSceneWarm)" opacity="0.82" />
        <path
          d="M75 12 Q86 2 95 9 Q86 17 75 17Z"
          fill="url(#glassSceneMain)"
          opacity="0.82"
          stroke="#FFFFFF"
          strokeOpacity="0.52"
        />
      </g>

      <g opacity="0.68">
        {[
          { x: 42, y: 202, r: 8 },
          { x: 78, y: 234, r: 10 },
          { x: 138, y: 214, r: 7 },
          { x: 332, y: 238, r: 9 },
        ].map((item, index) => (
          <circle
            key={index}
            cx={item.x}
            cy={item.y}
            r={item.r}
            fill="url(#glassSceneWarm)"
            stroke="#FFFFFF"
            strokeOpacity="0.52"
            strokeWidth="1.4"
          />
        ))}
      </g>

      <g opacity="0.58" fill="#FFFFFF">
        <circle cx="70" cy="126" r="2.2" />
        <circle cx="132" cy="94" r="1.8" />
        <circle cx="326" cy="118" r="2.1" />
        <circle cx="292" cy="92" r="1.7" />
      </g>
    </svg>
  );
}

export function CapybaraHead({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} style={{ display: "block" }} aria-hidden>
      <defs>
        <linearGradient id="miniFur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B07959" />
          <stop offset="100%" stopColor="#8B5A3D" />
        </linearGradient>
        <radialGradient id="miniYuzu" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#FBE889" />
          <stop offset="100%" stopColor="#E8B43A" />
        </radialGradient>
      </defs>
      <ellipse cx="15" cy="20" rx="5" ry="4" fill="#8B5A3D" />
      <ellipse cx="45" cy="20" rx="5" ry="4" fill="#8B5A3D" />
      <path
        d="M 10 32 Q 10 18, 30 17 Q 50 18, 50 32 Q 50 44, 30 45 Q 10 44, 10 32 Z"
        fill="url(#miniFur)"
      />
      <ellipse cx="30" cy="36" rx="12" ry="6" fill="#C28A6C" />
      <path d="M 21 28 Q 24 25, 27 28" stroke="#2A1B12" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 33 28 Q 36 25, 39 28" stroke="#2A1B12" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <ellipse cx="30" cy="34" rx="1.6" ry="1.2" fill="#2A1B12" />
      <path d="M 27 39 Q 30 41, 33 39" stroke="#2A1B12" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="12" r="6.5" fill="url(#miniYuzu)" />
      <ellipse cx="28" cy="10" rx="1.5" ry="1" fill="#FFF4C2" opacity="0.8" />
      <path d="M 30 6 Q 33 3, 35 5" stroke="#7A8F45" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function YuzuIcon({ size = 16 }: { size?: number }) {
  const id = `yuzuIcon-${size}`;
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} style={{ display: "block" }} aria-hidden>
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#FBE889" />
          <stop offset="100%" stopColor="#E8B43A" />
        </radialGradient>
      </defs>
      <circle cx="10" cy="11" r="7.5" fill={`url(#${id})`} />
      <ellipse cx="7.5" cy="8.5" rx="2.2" ry="1.3" fill="#FFF4C2" opacity="0.8" />
      <path d="M 10 4 Q 13 1, 15 3" stroke="#7A8F45" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

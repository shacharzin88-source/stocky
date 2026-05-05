// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
export const T = {
  purple:      "#8B6FD4",
  purpleLight: "#F0ECFB",
  purpleMid:   "#A389DF",
  purpleDark:  "#6B52B5",
  green:       "#3D9970",
  greenLight:  "#E8F7F1",
  greenMid:    "#5BB38A",
  red:         "#C4605A",
  redLight:    "#FAEAE9",
  amber:       "#C49A3C",
  amberLight:  "#FBF4E3",
  orange:      "#C47B4A",
  orangeLight: "#FAF0E6",
  blue:        "#5B7EC4",
  blueLight:   "#EAF0FB",
  bg:          "#F7F5FC",
  surface:     "#FFFFFF",
  border:      "#EAE6F4",
  text:        "#2D2A45",
  textMuted:   "#7A748F",
  textFaint:   "#ABA7C0",
  radius:      "16px",
  radiusSm:    "10px",
  radiusLg:    "20px",
};

// Colour helpers
export const cc  = v => parseFloat(v) >= 0 ? T.green : T.red;
export const ccBg = v => parseFloat(v) >= 0 ? T.greenLight : T.redLight;
export const cs  = v => parseFloat(v) >= 0 ? "+" : "";

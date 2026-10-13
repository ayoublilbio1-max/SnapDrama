import Svg, { Circle, Ellipse, Path } from "react-native-svg";

/**
 * Custom tab icons (react-native-svg), drawn to match the SnapDrama tab design:
 * inactive = outline (stroke), active = solid white with small details in the brand violet.
 * Later these can be swapped for PNG/WebP files in assets/icons — JS only.
 */
export type TabIconName = "home" | "shorts" | "rewards" | "mylist" | "profile";

type Props = {
  name: TabIconName;
  active: boolean;
  size?: number;
  color: string; // outline colour (inactive) or solid colour (active)
  cutout: string; // detail colour inside the solid icon
};

const SW = 1.8; // stroke width

export function TabIcon({ name, active, size = 24, color, cutout }: Props) {
  const fill = active ? color : "none";
  const line = active ? cutout : color;
  const common = {
    stroke: color,
    strokeWidth: SW,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "home" && (
        <>
          <Path
            d="M12 3.4 L20.6 9.7 V18.4 A2.1 2.1 0 0 1 18.5 20.5 H5.5 A2.1 2.1 0 0 1 3.4 18.4 V9.7 Z"
            fill={fill}
            {...common}
          />
          <Path
            d="M9.6 16.4 H14.4"
            stroke={line}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        </>
      )}

      {name === "shorts" && (
        <>
          <Path d="M8.6 3.8 H15.4" {...common} />
          <Path d="M6.4 6.6 H17.6" {...common} />
          <Path
            d="M4.8 9.5 H19.2 V18.4 A2.1 2.1 0 0 1 17.1 20.5 H6.9 A2.1 2.1 0 0 1 4.8 18.4 Z"
            fill={fill}
            {...common}
          />
          <Path
            d="M10.6 12.4 V17.3 L14.6 14.85 Z"
            fill={line}
            stroke={line}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </>
      )}

      {name === "rewards" && (
        <>
          <Path
            d="M4.6 10.4 H19.4 V18.4 A2.1 2.1 0 0 1 17.3 20.5 H6.7 A2.1 2.1 0 0 1 4.6 18.4 Z"
            fill={fill}
            {...common}
          />
          <Path d="M3.6 7.2 H20.4 V10.4 H3.6 Z" fill={fill} {...common} />
          <Path d="M12 7.2 C10.6 3.6 6.6 3.9 8.2 7.2" fill="none" {...common} />
          <Path
            d="M12 7.2 C13.4 3.6 17.4 3.9 15.8 7.2"
            fill="none"
            {...common}
          />
          <Path
            d="M12 11.2 V19.7"
            stroke={line}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        </>
      )}

      {name === "mylist" && (
        <>
          <Path
            d="M6 5.6 A2.1 2.1 0 0 1 8.1 3.5 H15.9 A2.1 2.1 0 0 1 18 5.6 V20.2 L12 15.8 L6 20.2 Z"
            fill={fill}
            {...common}
          />
          <Path
            d="M10 7.6 H14"
            stroke={line}
            strokeWidth={SW}
            strokeLinecap="round"
          />
        </>
      )}

      {name === "profile" && (
        <>
          <Circle cx={12} cy={7.6} r={3.6} fill={fill} {...common} />
          <Ellipse
            cx={12}
            cy={17.2}
            rx={6.6}
            ry={3.4}
            fill={fill}
            {...common}
          />
        </>
      )}
    </Svg>
  );
}

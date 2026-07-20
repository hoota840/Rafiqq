import { useWindowDimensions } from "react-native";

export const TABLET_BREAKPOINT = 700;
const CONTENT_MAX_WIDTH = 640;

/** Screen-size info shared by every screen so cards/lists cap their width and
 * center on tablets/web instead of stretching edge-to-edge. */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isTablet: width >= TABLET_BREAKPOINT,
    contentMaxWidth: CONTENT_MAX_WIDTH,
  };
}

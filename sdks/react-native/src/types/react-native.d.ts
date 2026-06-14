/**
 * Minimal ambient declarations for `react-native`.
 *
 * The real `react-native` types ship with the host app. We declare only the
 * symbols this SDK touches, typed loosely but usefully, so that `tsc --noEmit`
 * stays green without forcing a heavy `react-native` install at SDK build time.
 *
 * At runtime the host app's actual `react-native` is resolved via the peer
 * dependency — these shapes never override it.
 */
declare module "react-native" {
  import type * as React from "react";

  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const Image: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const Pressable: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const ActivityIndicator: React.ComponentType<any>;

  /** Loose style object. The real RN types are far richer; `any` keeps us light. */
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;

  export const StyleSheet: {
    /** Identity at runtime; we keep the literal type so style keys stay typed. */
    create<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(
      styles: T
    ): T;
    /** Combine styles; loosely typed. */
    flatten(style?: any): any;
    readonly hairlineWidth: number;
    readonly absoluteFill: any;
  };

  export const Linking: {
    openURL(url: string): Promise<any>;
    canOpenURL(url: string): Promise<boolean>;
  };

  export const Platform: {
    OS: "ios" | "android" | "windows" | "macos" | "web";
    select<T>(spec: { ios?: T; android?: T; default?: T; native?: T }): T;
  };

  export type ColorSchemeName = "light" | "dark" | null | undefined;
  export function useColorScheme(): ColorSchemeName;

  export const Dimensions: {
    get(dim: "window" | "screen"): {
      width: number;
      height: number;
      scale: number;
      fontScale: number;
    };
  };
}

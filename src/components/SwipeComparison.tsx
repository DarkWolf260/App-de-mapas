import React from "react";
import { MapSwipeControl } from "./MapSwipeControl";

export interface SwipeComparisonProps {
  position?: number;
  onPositionChange?: (pos: number) => void;
  onClose?: () => void;
  [key: string]: any;
}

export const SwipeComparison: React.FC<SwipeComparisonProps> = ({
  position = 50,
  onPositionChange = () => {},
  onClose = () => {},
}) => {
  return (
    <MapSwipeControl
      position={position}
      onPositionChange={onPositionChange}
      onClose={onClose}
    />
  );
};

export default SwipeComparison;

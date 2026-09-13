import React from 'react';
import { getBorderById } from '../../utils/borders';

const BorderFrame = ({ borderSvg, borderId = 'none' }) => {
  if (borderId === 'none' || borderSvg === '') {
    return null;
  }

  // If a raw SVG string was explicitly passed and is not empty
  if (borderSvg) {
    return (
      <div
        className="a4-border-layer"
        dangerouslySetInnerHTML={{ __html: borderSvg }}
      />
    );
  }

  // Otherwise resolve from borderId
  const borderObj = getBorderById(borderId);
  if (!borderObj || borderObj.borderId === 'none' || !borderObj.svgPattern) {
    return null;
  }

  return (
    <div
      className="a4-border-layer"
      dangerouslySetInnerHTML={{ __html: borderObj.svgPattern }}
    />
  );
};

export default BorderFrame;

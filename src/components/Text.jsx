import React from 'react';
import { Text } from 'react-konva';

const TextComponent = ({ shapes }) => {
  // console.log(shapes[0].x());

  return (
    <React.Fragment>
      {shapes.map((shape, index) => {
        // console.log(shape.x());
        console.log(shape.width());

        const isCircle = shape.radius !== undefined; // Check if the shape has a radius pr
        const centerX = shape.x() + (isCircle ? 0 : shape.width() / 3);
        const centerY = shape.y() + (isCircle ? 0 : shape.height() / 2);

        return (
          <React.Fragment key={index}>

            {isCircle ? (
              // If it's a circle, display the radius
              <Text
                x={centerX} // Positioning text relative to the circle
                y={centerY}
                text={`R: ${Math.round(shape.attrs.radius)}`} // Display radius
                fontSize={13}
                fill="gray"
              />
            ) : (
              // If it's a rectangle, display width, height, and perimeter
              <>
                <Text
                  x={shape.x() + shape.width() / 2 - 40}
                  y={shape.y() - 20}
                  text={`Width: ${Math.abs(Math.round(shape.width()))}`}
                  fontSize={13}
                  fill="gray"
                />
                <Text
                  x={shape.x() + shape.width() + 10}
                  y={shape.y() + shape.height() / 2 - 10}
                  text={`Height: ${Math.abs(Math.round(shape.height()))}`}
                  fontSize={13}
                  fill="gray"
                />
                <Text
                  x={centerX}
                  y={centerY}
                  text={`Perimetr: ${Math.round(
                    2 * (Math.abs(shape.width()) + Math.abs(shape.height()))
                  )}`}
                  fontSize={13}
                  fill="gray"
                />
              </>
            )}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
};

export default TextComponent;

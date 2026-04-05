import Group7 from "../../imports/Group7/Group7";

interface PigMascotProps {
  width?: number;
  className?: string;
}

/**
 * Scalable wrapper for the piggy.ai mascot logo imported from Figma.
 * The original SVG canvas is 944.33 × 914 px; we scale it down to any desired width.
 */
export function PigMascot({ width = 280, className }: PigMascotProps) {
  const origW = 944.33;
  const origH = 914;
  const scale = width / origW;
  const height = origH * scale;

  return (
    <div
      className={className}
      style={{ width, height, position: 'relative', overflow: 'visible', flexShrink: 0 }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: origW,
          height: origH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        {/* Group7 is `relative size-full` – it fills its 944×914 parent correctly */}
        <div style={{ width: origW, height: origH, position: 'relative' }}>
          <Group7 />
        </div>
      </div>
    </div>
  );
}

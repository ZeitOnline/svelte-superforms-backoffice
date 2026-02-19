<script lang="ts">
  type PathCell = {
    x: number;
    y: number;
    letter?: string;
  };

  type ColoredPath = {
    id: string;
    points: string;
    fill: string;
    stroke: string;
    cells: PathCell[];
    start?: PathCell;
    end?: PathCell;
  };

  const GRID_CELL_SIZE = 40;
  const GRID_WIDTH_PX = GRID_CELL_SIZE * 6;
  const GRID_HEIGHT_PX = GRID_CELL_SIZE * 8;

  type Props = {
    coloredPaths: ColoredPath[];
    generatedGridRows: string[][];
  };

  let { coloredPaths, generatedGridRows }: Props = $props();

  const toGermanUpperWithEszett = (value: string) =>
    Array.from(value)
      .map(char => (char === 'ß' ? 'ẞ' : char.toLocaleUpperCase('de-DE')))
      .join('');

  const toDisplayLetter = (cell: string) => (cell === '\u00A0' ? '' : toGermanUpperWithEszett(cell));
</script>

<div class="flex items-center flex-col text-center">
  <div class="font-bold mb-z-ds-8">Gitter (6 x 8)</div>
  <div
    class="border border-black w-fit relative overflow-hidden"
    style={`height: ${GRID_HEIGHT_PX}px;`}
  >
    <svg
      class="absolute inset-0 pointer-events-none z-0"
      width={GRID_WIDTH_PX}
      height={GRID_HEIGHT_PX}
      viewBox={`0 0 ${GRID_WIDTH_PX} ${GRID_HEIGHT_PX}`}
    >
      <defs>
        {#each coloredPaths as path (path.id)}
          <marker
            id={`arrow-${path.id}`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 z" fill={path.stroke} />
          </marker>
        {/each}
      </defs>
      {#each coloredPaths as path (path.id)}
        <polyline
          points={path.points}
          fill="none"
          stroke={path.stroke}
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          marker-end={`url(#arrow-${path.id})`}
          opacity="0.9"
        />
        {#each path.cells as cell, cellIndex (`${path.id}-${cellIndex}`)}
          <circle
            cx={cell.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2}
            cy={cell.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2}
            r="16"
            fill={path.fill}
            stroke={path.stroke}
            stroke-width="2"
            opacity="0.95"
          />
        {/each}
        {#if path.start}
          <circle
            cx={path.start.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2}
            cy={path.start.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2}
            r="5"
            stroke={path.stroke}
            stroke-width="12"
          />
        {/if}
        {#if path.end}
          <circle
            cx={path.end.x * GRID_CELL_SIZE + GRID_CELL_SIZE / 2}
            cy={path.end.y * GRID_CELL_SIZE + GRID_CELL_SIZE / 2}
            r="6"
            stroke={path.stroke}
            stroke-width="5"
            opacity="0.3"
          />
        {/if}
      {/each}
    </svg>
    <table class="text-center border-collapse table-fixed relative z-10 bg-transparent">
      <tbody>
        {#each generatedGridRows as row, rowIndex (rowIndex)}
          <tr>
            {#each row as cell, columnIndex (rowIndex * 10 + columnIndex)}
              <td
                class="w-10 h-10 p-0 leading-none align-middle box-border border border-black text-lg font-semibold font-mono"
              >
                {toDisplayLetter(cell)}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="text-xs mt-z-ds-8 text-z-ds-color-text-700 text-balance max-w-60">
    Richtung: Großer Punkt = Start, kleiner Punkt = Ende, Pfeil = Leserichtung.
  </p>
</div>

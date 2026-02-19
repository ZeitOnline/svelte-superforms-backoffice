import type { WortgeflechtLetterRow } from '$lib/games/wortgeflecht';

const GRID_WIDTH = 6;
const GRID_HEIGHT = 8;
const GRID_SIZE = GRID_WIDTH * GRID_HEIGHT;

type NodeId = `p${number}${number}`;
type GraphNode = {
  neighbors: NodeId[];
};
type Graph = {
  nodes: Record<NodeId, GraphNode>;
  visited: NodeId[];
  words: Record<string, NodeId[]>;
  longest?: Record<NodeId, number>;
};

export type WortgeflechtPathCell = {
  x: number;
  y: number;
  letter: string;
};

export type WortgeflechtWordPath = {
  word: string;
  cells: WortgeflechtPathCell[];
};

const normalizeWordKey = (value: string) => value.trim().toLocaleLowerCase('de-DE');

const EDGE_DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

const EMPTY_GRID = Array<string>(GRID_SIZE).fill('\u00A0');

const nodeId = (x: number, y: number) => `p${x}${y}` as NodeId;

const inBounds = (x: number, y: number) => x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;

const toIndex = (node: NodeId) => Number(node[1]) + Number(node[2]) * GRID_WIDTH;

const randomInt = (maxExclusive: number) => Math.floor(Math.random() * maxExclusive);

const randomFrom = <T>(arr: T[]) => (arr.length ? arr[randomInt(arr.length)] : undefined);

const shuffle = <T>(arr: T[]) => {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const unique = <T>(arr: T[]) => Array.from(new Set(arr));

const difference = <T>(source: T[], ...others: T[][]) => {
  const blocked = new Set(others.flat());
  return source.filter(v => !blocked.has(v));
};

const intersection = <T>(a: T[], b: T[]) => {
  const bSet = new Set(b);
  return a.filter(v => bSet.has(v));
};

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

const createGraph = (): Graph => {
  const graph: Graph = {
    nodes: {} as Record<NodeId, GraphNode>,
    visited: [],
    words: {},
  };

  const removeDiagonal = (x: number, y: number) => {
    const removeForward = randomInt(2) === 0;
    const x1 = removeForward ? x : x + 1;
    const x2 = removeForward ? x + 1 : x;
    const n1 = nodeId(x1, y);
    const n2 = nodeId(x2, y - 1);
    graph.nodes[n1].neighbors = graph.nodes[n1].neighbors.filter(n => n !== n2);
    graph.nodes[n2].neighbors = graph.nodes[n2].neighbors.filter(n => n !== n1);
  };

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const neighbors: NodeId[] = [];
      for (const [dx, dy] of EDGE_DIRS) {
        const nx = x + dx;
        const ny = y + dy;
        if (inBounds(nx, ny)) {
          neighbors.push(nodeId(nx, ny));
        }
      }
      graph.nodes[nodeId(x, y)] = { neighbors };
    }
    if (y > 0) {
      for (let x = 0; x < GRID_WIDTH - 1; x++) {
        removeDiagonal(x, y);
      }
    }
  }

  return graph;
};

const findMaxPathLen = (nodes: Record<NodeId, GraphNode>, src: NodeId) => {
  let maxLen = Number.MIN_VALUE;
  const dfs = (node: NodeId, prevLen: number, visited: Set<NodeId>) => {
    visited.add(node);
    let currentLen = 0;
    for (const adjacent of nodes[node].neighbors) {
      if (!visited.has(adjacent)) {
        currentLen = prevLen + 1;
        dfs(adjacent, currentLen, visited);
      }
      if (maxLen < currentLen) {
        maxLen = currentLen;
      }
      currentLen = 0;
    }
  };
  dfs(src, 1, new Set<NodeId>());
  return maxLen;
};

const getLongestPaths = (graph: Graph): Record<NodeId, number> => {
  const longest = {} as Record<NodeId, number>;
  for (const key of Object.keys(graph.nodes) as NodeId[]) {
    longest[key] = findMaxPathLen(graph.nodes, key);
  }
  return longest;
};

const getFreeSubsets = (graph: Graph) => {
  const subsets: NodeId[][] = [];
  const allNodes = Object.keys(graph.nodes) as NodeId[];
  const available = new Set(difference(allNodes, graph.visited));
  while (available.size) {
    const first = available.values().next().value as NodeId;
    const queue: NodeId[] = [first];
    const visited = new Set<NodeId>();
    const subset: NodeId[] = [];
    while (queue.length) {
      const current = queue.shift() as NodeId;
      if (visited.has(current) || !available.has(current)) continue;
      visited.add(current);
      subset.push(current);
      for (const neighbor of graph.nodes[current].neighbors) {
        if (available.has(neighbor) && !visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
    subsets.push(subset);
    for (const n of subset) {
      available.delete(n);
    }
  }
  return subsets;
};

const getFreeNeighbors = (idx: number, used: number[]) => {
  let directions = [-6, 6];
  if (idx % GRID_WIDTH !== 0) {
    directions = directions.concat([-7, -1, 5]);
  }
  if (idx % GRID_WIDTH !== GRID_WIDTH - 1) {
    directions = directions.concat([-5, 1, 7]);
  }
  const usedSet = new Set(used);
  return directions
    .map(direction => idx + direction)
    .filter(next => next >= 0 && next < GRID_SIZE && !usedSet.has(next));
};

const traceWord = (
  grid: string[],
  start: number,
  path: number[] | null,
  paths: number[][],
  letters: string[],
): void => {
  const workPath = path ?? [];
  if (grid[start] !== letters[0]) return;
  workPath.push(start);
  if (letters.length === 1) {
    paths.push(workPath.slice());
    workPath.pop();
    return;
  }
  for (const neighbor of getFreeNeighbors(start, workPath)) {
    traceWord(grid, neighbor, workPath, paths, letters.slice(1));
  }
  workPath.pop();
};

const findWord = (grid: string[], word: string) => {
  const locations: number[][] = [];
  const letters = Array.from(word.trim());
  for (let pos = 0; pos < grid.length; pos++) {
    traceWord(grid, pos, null, locations, letters);
  }
  return locations;
};

const sameCells = (locs: number[][]) => {
  const len = locs[0]?.length ?? 0;
  const allNodes = unique(locs.flat());
  return len === allNodes.length;
};

const isWordPlacementUnique = (grid: string[], words: string[]) => {
  for (const word of words) {
    if (!word) continue;
    const locations = findWord(grid, word);
    if (locations.length === 1) continue;
    if (locations.length > 1 && sameCells(locations)) continue;
    return false;
  }
  return true;
};

const gridFromWords = (wordPaths: Record<string, NodeId[]>) => {
  const grid = EMPTY_GRID.slice();
  for (const [word, path] of Object.entries(wordPaths)) {
    path.forEach((node, idx) => {
      const letter = word[idx] ?? '\u00A0';
      grid[toIndex(node)] = letter;
    });
  }
  return grid;
};

const placeWord = (word: string, path: NodeId[], graph: Graph): NodeId[] | false => {
  const availableNodes = difference(Object.keys(graph.nodes) as NodeId[], graph.visited, path);
  let neighbors: NodeId[] = [];
  if (path.length === 0) {
    const possible = availableNodes.filter(n => (graph.longest?.[n] ?? 0) >= word.length);
    const candidate = randomFrom(possible);
    if (!candidate) return false;
    neighbors.push(candidate);
  } else {
    const last = path[path.length - 1] as NodeId;
    neighbors = shuffle(intersection(graph.nodes[last].neighbors, availableNodes));
    if (neighbors.length === 0) return false;
  }

  while (neighbors.length > 0) {
    const next = neighbors.shift() as NodeId;
    path.push(next);
    if (word.length === 1) return path;
    const ret = placeWord(word.slice(1), path, graph);
    if (ret) return ret;
    path.pop();
  }
  return false;
};

const combinations = (arr: string[]) =>
  arr.reduce<string[][]>(
    (subsets, value) => subsets.concat(subsets.map(set => [value, ...set])),
    [[]],
  );

const graphFromIsland = (island: NodeId[], graph: Graph): Graph => {
  const islandSet = new Set(island);
  const nodes = {} as Record<NodeId, GraphNode>;
  for (const key of island) {
    nodes[key] = {
      neighbors: graph.nodes[key].neighbors.filter(n => islandSet.has(n)),
    };
  }
  const subsetGraph: Graph = { nodes, visited: [], words: {} };
  subsetGraph.longest = getLongestPaths(subsetGraph);
  return subsetGraph;
};

const placeWordsSubsets = (words: string[], graph: Graph | null = null): Graph | false => {
  if (!graph) {
    graph = createGraph();
  }
  if (words.length === 0) return graph;

  const islands = getFreeSubsets(graph);
  if (islands.length === 0) return false;

  const wordLengths = words.map(w => w.length);
  const islandSizes = islands.map(island => island.length);
  const minIsland = Math.min(...islandSizes);
  const maxIsland = Math.max(...islandSizes);
  const minWord = Math.min(...wordLengths);
  const maxWord = Math.max(...wordLengths);
  if (minIsland < minWord || maxWord > maxIsland) {
    return false;
  }

  for (let i = 0; i < islands.length; i++) {
    const island = islands[i];
    const islandSize = island.length;
    const wordCombs = combinations(words)
      .slice(1)
      .map(combo => ({ words: combo, len: sum(combo.map(w => w.length)) }));
    const matched = wordCombs.filter(combo => combo.len === islandSize);
    if (matched.length === 0) {
      return false;
    }

    const selected = randomFrom(matched);
    if (!selected || selected.words.length === 0) return false;
    const firstWord = selected.words[0] as string;
    const islandGraph = graphFromIsland(island, graph);
    let result: Graph | false = false;
    let tries = 0;
    while (!result && tries < 50) {
      tries++;
      const path = placeWord(firstWord, [], islandGraph);
      if (!path) return false;
      islandGraph.words[firstWord] = path;
      islandGraph.visited = unique([...islandGraph.visited, ...path]);

      const candidateWords = { ...graph.words, ...islandGraph.words };
      const valid = isWordPlacementUnique(gridFromWords(candidateWords), Object.keys(candidateWords));
      if (valid) {
        result = placeWordsSubsets(shuffle(selected.words.slice(1)), islandGraph);
      }

      if (!valid || !result) {
        delete islandGraph.words[firstWord];
        islandGraph.visited = difference(islandGraph.visited, path);
      } else {
        graph.words = { ...graph.words, ...result.words, ...islandGraph.words };
        graph.visited = unique([...graph.visited, ...result.visited, ...islandGraph.visited]);
      }
    }
    if (!result) return false;

    const placed = new Set(Object.keys(result.words));
    words = words.filter(word => !placed.has(word));
  }

  return graph;
};

const parseWords = (input: string) =>
  input
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

export const parseWortgeflechtWords = (input: string) => {
  const words = parseWords(input);
  const invalid = words.filter(word => !/^[A-Za-zÄÖÜäöüẞß]+$/u.test(word));
  return {
    words,
    totalLetters: sum(words.map(word => word.length)),
    invalidWords: invalid,
  };
};

export const generateWortgeflechtLayout = ({
  words,
  attempts = 50,
}: {
  words: string[];
  attempts?: number;
}) => {
  for (let i = 0; i < attempts; i++) {
    const graph = placeWordsSubsets(shuffle(words.slice()));
    if (!graph) continue;
    const grid = gridFromWords(graph.words);
    const rows: WortgeflechtLetterRow[] = [];
    const paths: WortgeflechtWordPath[] = [];
    for (const [word, path] of Object.entries(graph.words)) {
      const cells: WortgeflechtPathCell[] = [];
      path.forEach((node, idx) => {
        const x = Number(node[1]);
        const y = Number(node[2]);
        const letter = word[idx] ?? '';
        rows.push({
          word,
          letter,
          cx: y + 1,
          cy: x + 1,
        });
        cells.push({
          x,
          y,
          letter,
        });
      });
      paths.push({ word, cells });
    }

    const orderedPaths = words
      .map(word => paths.find(path => path.word === word))
      .filter((value): value is WortgeflechtWordPath => !!value);

    if (orderedPaths.length !== words.length) {
      continue;
    }

    return { grid, rows, paths: orderedPaths };
  }
  return null;
};

export const toGridRows = (grid: string[]) => {
  const rows: string[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: string[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push(grid[y * GRID_WIDTH + x] ?? '\u00A0');
    }
    rows.push(row);
  }
  return rows;
};

const isAdjacent = (a: number, b: number) => {
  const ax = a % GRID_WIDTH;
  const ay = Math.floor(a / GRID_WIDTH);
  const bx = b % GRID_WIDTH;
  const by = Math.floor(b / GRID_WIDTH);
  return Math.abs(ax - bx) <= 1 && Math.abs(ay - by) <= 1 && !(ax === bx && ay === by);
};

export const buildWortgeflechtPreviewFromRows = (rows: WortgeflechtLetterRow[]) => {
  const grid = EMPTY_GRID.slice();
  const wordOrderKeys: string[] = [];
  const indexSetByWordKey = new Map<string, Set<number>>();
  const displayWordByKey = new Map<string, string>();

  for (const row of rows) {
    const word = (row.word ?? '').trim();
    const wordKey = normalizeWordKey(word);
    const letter = (row.letter ?? '').trim();
    const x = Number(row.cy) - 1;
    const y = Number(row.cx) - 1;
    if (!wordKey || !letter) continue;
    if (!inBounds(x, y)) continue;
    const idx = y * GRID_WIDTH + x;
    grid[idx] = letter[0] ?? '\u00A0';
    if (!indexSetByWordKey.has(wordKey)) {
      indexSetByWordKey.set(wordKey, new Set<number>());
      displayWordByKey.set(wordKey, word);
      wordOrderKeys.push(wordKey);
    }
    indexSetByWordKey.get(wordKey)?.add(idx);
  }

  const paths: WortgeflechtWordPath[] = [];

  for (const wordKey of wordOrderKeys) {
    const targetSet = indexSetByWordKey.get(wordKey);
    const displayWord = displayWordByKey.get(wordKey) ?? wordKey;
    if (!targetSet || targetSet.size === 0) continue;
    const candidates = findWord(grid, displayWord);
    let chosen = candidates.find(path => {
      if (path.length !== targetSet.size) return false;
      return path.every(idx => targetSet.has(idx));
    });

    if (!chosen && candidates.length > 0) {
      chosen = candidates[0];
    }

    if (!chosen) {
      const fallback = Array.from(targetSet).sort((a, b) => {
        const ay = Math.floor(a / GRID_WIDTH);
        const by = Math.floor(b / GRID_WIDTH);
        if (ay !== by) return ay - by;
        return (a % GRID_WIDTH) - (b % GRID_WIDTH);
      });
      chosen = fallback;
      for (let i = 1; i < chosen.length; i++) {
        if (!isAdjacent(chosen[i - 1], chosen[i])) {
          chosen = [];
          break;
        }
      }
      if (chosen.length !== targetSet.size) continue;
    }

    paths.push({
      word: displayWord,
      cells: chosen.map(idx => ({
        x: idx % GRID_WIDTH,
        y: Math.floor(idx / GRID_WIDTH),
        letter: grid[idx] ?? '',
      })),
    });
  }

  return { grid, paths };
};

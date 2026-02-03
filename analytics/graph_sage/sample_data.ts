/**
 * GraphSAGE Sample Data Generator for 4D Flow MRI
 * Generates vessel network graph data with node features and edge connections
 */

export interface NodeFeature {
  id: number;
  position: [number, number, number];
  velocity: [number, number, number];
  pressure: number;
  diameter: number;
  wallShearStress: number;
  flowRate: number;
}

export interface Edge {
  source: number;
  target: number;
  weight: number;
}

export interface GraphData {
  nodes: NodeFeature[];
  edges: Edge[];
  adjacencyList: Map<number, number[]>;
}

/**
 * Generate sample vessel network graph
 * Creates a realistic vessel tree structure with bifurcations
 */
export class GraphSageSampleDataGenerator {
  private nodeCount: number;
  private maxDepth: number;

  constructor(nodeCount: number = 50, maxDepth: number = 4) {
    this.nodeCount = nodeCount;
    this.maxDepth = maxDepth;
  }

  /**
   * Generate complete graph data
   */
  generate(): GraphData {
    const nodes = this.generateNodes();
    const edges = this.generateEdges(nodes);
    const adjacencyList = this.buildAdjacencyList(edges);

    return { nodes, edges, adjacencyList };
  }

  /**
   * Generate vessel nodes with realistic features
   */
  private generateNodes(): NodeFeature[] {
    const nodes: NodeFeature[] = [];
    let currentId = 0;

    // Generate vessel tree structure
    const queue: Array<{ id: number; depth: number; parentPos: [number, number, number] }> = [
      { id: currentId++, depth: 0, parentPos: [0, 0, 0] }
    ];

    while (queue.length > 0 && currentId < this.nodeCount) {
      const { id, depth, parentPos } = queue.shift()!;

      // Calculate position along vessel path
      const position = this.calculateNodePosition(parentPos, depth);
      
      // Generate realistic hemodynamic features
      const velocity = this.calculateVelocity(depth, position);
      const diameter = this.calculateDiameter(depth);
      const pressure = this.calculatePressure(depth);
      const wallShearStress = this.calculateWSS(velocity, diameter);
      const flowRate = this.calculateFlowRate(velocity, diameter);

      nodes.push({
        id,
        position,
        velocity,
        pressure,
        diameter,
        wallShearStress,
        flowRate
      });

      // Create bifurcations (vessel branching)
      if (depth < this.maxDepth && currentId < this.nodeCount) {
        const branchCount = Math.random() > 0.5 ? 2 : 1; // Bifurcation or continuation
        
        for (let i = 0; i < branchCount && currentId < this.nodeCount; i++) {
          queue.push({
            id: currentId++,
            depth: depth + 1,
            parentPos: position
          });
        }
      }
    }

    return nodes;
  }

  /**
   * Generate edges based on vessel connectivity
   */
  private generateEdges(nodes: NodeFeature[]): Edge[] {
    const edges: Edge[] = [];
    const processedNodes = new Set<number>();
    processedNodes.add(0);

    // Create tree structure edges
    for (let i = 1; i < nodes.length; i++) {
      // Find nearest unprocessed parent node
      let minDist = Infinity;
      let parentId = 0;

      for (let j = 0; j < i; j++) {
        if (processedNodes.has(j)) {
          const dist = this.calculateDistance(nodes[i].position, nodes[j].position);
          if (dist < minDist) {
            minDist = dist;
            parentId = j;
          }
        }
      }

      // Calculate edge weight based on flow similarity
      const weight = this.calculateEdgeWeight(nodes[parentId], nodes[i]);
      
      edges.push({
        source: parentId,
        target: i,
        weight
      });

      processedNodes.add(i);
    }

    // Add some cross-connections (anastomoses)
    const crossConnectionCount = Math.floor(nodes.length * 0.05);
    for (let i = 0; i < crossConnectionCount; i++) {
      const source = Math.floor(Math.random() * nodes.length);
      const target = Math.floor(Math.random() * nodes.length);
      
      if (source !== target && !this.edgeExists(edges, source, target)) {
        const weight = this.calculateEdgeWeight(nodes[source], nodes[target]);
        edges.push({ source, target, weight });
      }
    }

    return edges;
  }

  /**
   * Build adjacency list for efficient neighbor lookup
   */
  private buildAdjacencyList(edges: Edge[]): Map<number, number[]> {
    const adjacencyList = new Map<number, number[]>();

    edges.forEach(edge => {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, []);
      }
      if (!adjacencyList.has(edge.target)) {
        adjacencyList.set(edge.target, []);
      }

      adjacencyList.get(edge.source)!.push(edge.target);
      adjacencyList.get(edge.target)!.push(edge.source); // Undirected graph
    });

    return adjacencyList;
  }

  /**
   * Calculate node position along vessel path
   */
  private calculateNodePosition(
    parentPos: [number, number, number],
    depth: number
  ): [number, number, number] {
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * Math.PI / 4;
    const distance = 5 + Math.random() * 3;

    return [
      parentPos[0] + distance * Math.cos(angle) * Math.cos(elevation),
      parentPos[1] + distance * Math.sin(angle) * Math.cos(elevation),
      parentPos[2] + distance * Math.sin(elevation)
    ];
  }

  /**
   * Calculate blood velocity (decreases with depth/distance)
   */
  private calculateVelocity(
    depth: number,
    position: [number, number, number]
  ): [number, number, number] {
    const baseMagnitude = 100 * Math.exp(-depth * 0.3); // cm/s
    const direction = this.normalizeVector(position);
    
    return [
      direction[0] * baseMagnitude + (Math.random() - 0.5) * 10,
      direction[1] * baseMagnitude + (Math.random() - 0.5) * 10,
      direction[2] * baseMagnitude + (Math.random() - 0.5) * 10
    ];
  }

  /**
   * Calculate vessel diameter (decreases with branching)
   */
  private calculateDiameter(depth: number): number {
    const baseDiameter = 10; // mm
    return baseDiameter * Math.exp(-depth * 0.4) + Math.random() * 0.5;
  }

  /**
   * Calculate blood pressure (decreases along vessel tree)
   */
  private calculatePressure(depth: number): number {
    const baselinePressure = 100; // mmHg
    return baselinePressure - depth * 15 + (Math.random() - 0.5) * 5;
  }

  /**
   * Calculate wall shear stress
   */
  private calculateWSS(velocity: [number, number, number], diameter: number): number {
    const velocityMag = Math.sqrt(
      velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2
    );
    const viscosity = 0.04; // Blood viscosity (Poise)
    return (4 * viscosity * velocityMag) / diameter;
  }

  /**
   * Calculate flow rate (Q = v * A)
   */
  private calculateFlowRate(velocity: [number, number, number], diameter: number): number {
    const velocityMag = Math.sqrt(
      velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2
    );
    const area = Math.PI * (diameter / 2) ** 2;
    return velocityMag * area;
  }

  /**
   * Calculate edge weight based on hemodynamic similarity
   */
  private calculateEdgeWeight(node1: NodeFeature, node2: NodeFeature): number {
    const pressureDiff = Math.abs(node1.pressure - node2.pressure);
    const flowDiff = Math.abs(node1.flowRate - node2.flowRate);
    
    // Normalize and combine features
    const weight = 1 / (1 + pressureDiff / 100 + flowDiff / 1000);
    return weight;
  }

  /**
   * Calculate Euclidean distance between positions
   */
  private calculateDistance(
    pos1: [number, number, number],
    pos2: [number, number, number]
  ): number {
    return Math.sqrt(
      (pos1[0] - pos2[0]) ** 2 +
      (pos1[1] - pos2[1]) ** 2 +
      (pos1[2] - pos2[2]) ** 2
    );
  }

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vec: [number, number, number]): [number, number, number] {
    const mag = Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
    if (mag === 0) return [0, 0, 1];
    return [vec[0] / mag, vec[1] / mag, vec[2] / mag];
  }

  /**
   * Check if edge already exists
   */
  private edgeExists(edges: Edge[], source: number, target: number): boolean {
    return edges.some(
      e => (e.source === source && e.target === target) ||
           (e.source === target && e.target === source)
    );
  }
}

/**
 * Export sample data for testing
 */
export function generateSampleGraphData(
  nodeCount: number = 50,
  maxDepth: number = 4
): GraphData {
  const generator = new GraphSageSampleDataGenerator(nodeCount, maxDepth);
  return generator.generate();
}

/**
 * Export sample data to JSON format
 */
export function exportToJSON(data: GraphData): string {
  return JSON.stringify({
    nodes: data.nodes,
    edges: data.edges,
    adjacencyList: Array.from(data.adjacencyList.entries())
  }, null, 2);
}
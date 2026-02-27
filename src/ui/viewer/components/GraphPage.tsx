import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'session' | 'file' | 'concept';
  val: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

interface GraphPageProps {
  onNodeClick?: (query: string) => void;
}

export function GraphPage({ onNodeClick }: GraphPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [repulsionStrength, setRepulsionStrength] = useState(1000);
  const simulationRef = useRef<any>(null);

  // Fetch graph data
  useEffect(() => {
    fetch('/api/graph?limit=50')
      .then(res => res.json())
      .then(data => {
        // Initialize positions
        const width = window.innerWidth;
        const height = window.innerHeight;
        const processedNodes = data.nodes.map((n: any) => ({
          ...n,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 0,
          vy: 0
        }));
        setNodes(processedNodes);
        setEdges(data.edges);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load graph:', err);
        setLoading(false);
      });
  }, []);

  // Physics Simulation & Rendering
  useEffect(() => {
    if (loading || nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let draggingNode: Node | null = null;

    // Physics parameters
    const repulsion = repulsionStrength;
    const attraction = 0.05;
    const damping = 0.85;
    const centerForce = 0.01;

    const render = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Physics Step

      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x! - n2.x!;
          const dy = n1.y! - n2.y!;
          const distSq = dx * dx + dy * dy + 0.1; // Avoid divide by zero
          const force = repulsion / distSq;
          const fx = (dx / Math.sqrt(distSq)) * force;
          const fy = (dy / Math.sqrt(distSq)) * force;

          n1.vx! += fx;
          n1.vy! += fy;
          n2.vx! -= fx;
          n2.vy! -= fy;
        }
      }

      // Attraction (Edges)
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const force = (dist - 100) * attraction; // Rest length 100
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          source.vx! += fx;
          source.vy! += fy;
          target.vx! -= fx;
          target.vy! -= fy;
        }
      });

      // Center Gravity & Update Position
      nodes.forEach(node => {
        if (node === draggingNode) return;

        // Pull to center
        node.vx! += (centerX - node.x!) * centerForce;
        node.vy! += (centerY - node.y!) * centerForce;

        // Apply velocity
        node.vx! *= damping;
        node.vy! *= damping;
        node.x! += node.vx!;
        node.y! += node.vy!;

        // Bounds check (bounce)
        if (node.x! < 0 || node.x! > width) { node.vx! *= -1; node.x! = Math.max(0, Math.min(width, node.x!)); }
        if (node.y! < 0 || node.y! > height) { node.vy! *= -1; node.y! = Math.max(0, Math.min(height, node.y!)); }
      });

      // 2. Render Step
      ctx.clearRect(0, 0, width, height);

      // Draw Edges
      ctx.lineWidth = 1;
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
          ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
          ctx.beginPath();
          ctx.moveTo(source.x!, source.y!);
          ctx.lineTo(target.x!, target.y!);
          ctx.stroke();
        }
      });

      // Draw Nodes
      nodes.forEach(node => {
        // Skip if filtered out
        if (filterType && node.type !== filterType) {
          ctx.globalAlpha = 0.1;
        } else {
          ctx.globalAlpha = 1.0;
        }

        ctx.beginPath();
        const radius = node.type === 'session' ? 8 : (node.type === 'file' ? 5 : 4);
        ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);

        if (node.type === 'session') ctx.fillStyle = '#D97757'; // Accent Primary
        else if (node.type === 'file') ctx.fillStyle = '#4A90E2'; // Blue
        else ctx.fillStyle = '#50E3C2'; // Green/Teal (Concepts)

        ctx.fill();

        // Highlight hover
        if (node === hoveredNode) {
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw label
          ctx.fillStyle = 'var(--color-text-primary)';
          ctx.font = '12px sans-serif';
          ctx.fillText(node.label, node.x! + 12, node.y! + 4);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    // Resize handler
    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = 600; // Fixed height for now
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse Interaction Handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let found: Node | null = null;
      for (const node of nodes) {
        const dx = node.x! - x;
        const dy = node.y! - y;
        if (dx * dx + dy * dy < 100) { // 10px radius squared
          found = node;
          break;
        }
      }
      setHoveredNode(found);

      if (draggingNode) {
        draggingNode.x = x;
        draggingNode.y = y;
        draggingNode.vx = 0;
        draggingNode.vy = 0;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (hoveredNode) {
        draggingNode = hoveredNode;
      }
    };

    const handleMouseUp = () => {
      draggingNode = null;
    };

    const handleClick = (e: MouseEvent) => {
      if (hoveredNode && onNodeClick) {
        if (hoveredNode.type === 'file') {
          onNodeClick(`file:${hoveredNode.label}`);
        } else if (hoveredNode.type === 'concept') {
          onNodeClick(`concept:${hoveredNode.label}`);
        } else if (hoveredNode.type === 'session') {
          // Extract session ID from label "Session 123"
          const sessionId = hoveredNode.label.split(' ')[1];
          onNodeClick(`session:${sessionId}`);
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('mouseup', handleMouseUp);

    // Start loop
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [loading, nodes, edges, hoveredNode, filterType, repulsionStrength]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading graph...</div>;

  return (
    <div style={{ padding: '20px', height: 'calc(100vh - 80px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-header)' }}>Knowledge Graph</h2>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Node Filter */}
          <select
            value={filterType || ''}
            onChange={(e) => setFilterType(e.target.value || null)}
            style={{ fontSize: '12px', padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)' }}
          >
            <option value="">All Types</option>
            <option value="session">Sessions Only</option>
            <option value="file">Files Only</option>
            <option value="concept">Concepts Only</option>
          </select>

          {/* Physics Toggle */}
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Spread:</span>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={repulsionStrength}
              onChange={(e) => setRepulsionStrength(Number(e.target.value))}
              style={{ width: '80px' }}
            />
          </div>

          {/* Legend */}
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97757' }}></span> Session</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4A90E2' }}></span> File</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#50E3C2' }}></span> Concept</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, border: '1px solid var(--color-border-primary)', borderRadius: '8px', overflow: 'hidden', background: 'var(--color-bg-card)' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );
}

"""
Graph Analytics Engine
Uses NetworkX for:
1. Supply chain network topology mapping
2. Carousel trade detection (cycle detection)
3. Community detection for relationship gap analysis
4. Centrality-based risk scoring
"""

from typing import List, Dict, Tuple, Set
import networkx as nx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Entity, Invoice, SupplyChainEdge, FraudFlag,
    FraudType, AlertSeverity,
)
from app.schemas import NetworkGraph, NetworkNode, NetworkEdge


async def build_network(session: AsyncSession) -> nx.DiGraph:
    """Build a directed graph from supply chain edges."""
    G = nx.DiGraph()

    # Add nodes
    entities_result = await session.execute(select(Entity))
    entities = entities_result.scalars().all()
    for entity in entities:
        G.add_node(entity.id, **{
            "name": entity.name,
            "entity_type": entity.entity_type,
            "tier": entity.tier.value if entity.tier else None,
            "risk_score": entity.risk_score,
            "annual_revenue": entity.annual_revenue,
        })

    # Add edges
    edges_result = await session.execute(select(SupplyChainEdge))
    edges = edges_result.scalars().all()
    for edge in edges:
        G.add_edge(edge.source_id, edge.target_id, **{
            "relationship_type": edge.relationship_type,
            "total_volume": edge.total_volume,
            "transaction_count": edge.transaction_count,
            "risk_score": edge.risk_score,
        })

    return G


async def get_network_data(session: AsyncSession) -> NetworkGraph:
    """Return the full network for visualization."""
    G = await build_network(session)

    nodes = []
    for node_id, data in G.nodes(data=True):
        nodes.append(NetworkNode(
            id=node_id,
            name=data.get("name", ""),
            entity_type=data.get("entity_type", ""),
            tier=data.get("tier"),
            risk_score=data.get("risk_score", 0),
            size=max(10, min(50, data.get("annual_revenue", 0) / 1_000_000)),
        ))

    edges = []
    for source, target, data in G.edges(data=True):
        edges.append(NetworkEdge(
            source=source,
            target=target,
            relationship_type=data.get("relationship_type"),
            volume=data.get("total_volume", 0),
            risk_score=data.get("risk_score", 0),
        ))

    # Community detection (undirected)
    UG = G.to_undirected()
    communities = []
    if len(UG.nodes) > 0:
        try:
            from networkx.algorithms.community import greedy_modularity_communities
            comms = greedy_modularity_communities(UG)
            communities = [list(c) for c in comms]
        except Exception:
            communities = [list(nx.connected_components(UG))]

    # Carousel cycle detection
    carousel_cycles = detect_carousel_cycles(G)

    return NetworkGraph(
        nodes=nodes,
        edges=edges,
        communities=communities,
        carousel_cycles=carousel_cycles,
    )


def detect_carousel_cycles(G: nx.DiGraph) -> List[List[int]]:
    """Find cycles in the supply chain that could indicate carousel trades."""
    cycles = []
    try:
        all_cycles = list(nx.simple_cycles(G))
        # Only keep cycles of length 3-6 (typical carousel patterns)
        for cycle in all_cycles:
            if 3 <= len(cycle) <= 6:
                cycles.append(cycle)
    except Exception:
        pass
    return cycles


async def detect_carousel_fraud(session: AsyncSession) -> List[FraudFlag]:
    """Flag invoices involved in carousel trade cycles."""
    flags: List[FraudFlag] = []

    G = await build_network(session)
    cycles = detect_carousel_cycles(G)

    for cycle in cycles:
        # Find invoices between entities in this cycle
        cycle_set = set(cycle)
        for i, node_id in enumerate(cycle):
            next_node = cycle[(i + 1) % len(cycle)]

            inv_result = await session.execute(
                select(Invoice)
                .where(Invoice.supplier_id == node_id)
                .where(Invoice.buyer_id == next_node)
            )
            invoices = inv_result.scalars().all()

            for inv in invoices:
                existing = await session.execute(
                    select(FraudFlag)
                    .where(FraudFlag.invoice_id == inv.id)
                    .where(FraudFlag.fraud_type == FraudType.carousel_trade)
                )
                if existing.scalar_one_or_none():
                    continue

                entity_names = []
                for nid in cycle:
                    e = await session.get(Entity, nid)
                    if e:
                        entity_names.append(e.name)

                flags.append(FraudFlag(
                    invoice_id=inv.id,
                    fraud_type=FraudType.carousel_trade,
                    confidence=0.85,
                    severity=AlertSeverity.critical,
                    description=(
                        f"Carousel trade cycle detected: "
                        f"{' → '.join(entity_names)} → {entity_names[0]}. "
                        f"Invoice ${inv.amount:,.0f} is part of a circular trading pattern."
                    ),
                    engine="graph_analytics",
                ))

    return flags


async def compute_risk_scores(session: AsyncSession) -> Dict[int, float]:
    """Compute risk scores for entities based on graph metrics."""
    G = await build_network(session)

    risk_scores = {}

    if len(G.nodes) == 0:
        return risk_scores

    # PageRank (entities receiving lots of money may be higher risk)
    try:
        pagerank = nx.pagerank(G)
    except Exception:
        pagerank = {n: 1.0 / len(G.nodes) for n in G.nodes}

    # Betweenness centrality (brokers/intermediaries)
    try:
        betweenness = nx.betweenness_centrality(G)
    except Exception:
        betweenness = {n: 0 for n in G.nodes}

    max_pr = max(pagerank.values()) if pagerank else 1
    max_bc = max(betweenness.values()) if betweenness and max(betweenness.values()) > 0 else 1

    for node_id in G.nodes:
        pr_norm = pagerank.get(node_id, 0) / max_pr * 50
        bc_norm = betweenness.get(node_id, 0) / max_bc * 30

        # Check if in a cycle
        in_cycle = any(node_id in cycle for cycle in detect_carousel_cycles(G))
        cycle_penalty = 20 if in_cycle else 0

        risk_scores[node_id] = min(round(pr_norm + bc_norm + cycle_penalty, 1), 100)

    return risk_scores

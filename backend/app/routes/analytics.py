"""Graph analytics routes."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Entity
from app.schemas import NetworkGraph, EntityOut
from app.engines.graph_analytics import get_network_data, compute_risk_scores

router = APIRouter()


@router.get("/network", response_model=NetworkGraph)
async def get_network(db: AsyncSession = Depends(get_db)):
    """Get the full supply chain network for visualization."""
    return await get_network_data(db)


@router.get("/entities", response_model=List[EntityOut])
async def list_entities(db: AsyncSession = Depends(get_db)):
    """List all entities with risk scores."""
    result = await db.execute(
        select(Entity).order_by(Entity.risk_score.desc())
    )
    return [EntityOut.model_validate(e) for e in result.scalars().all()]


@router.post("/risk-scores")
async def update_risk_scores(db: AsyncSession = Depends(get_db)):
    """Recompute entity risk scores using graph analytics."""
    scores = await compute_risk_scores(db)

    for entity_id, score in scores.items():
        entity = await db.get(Entity, entity_id)
        if entity:
            entity.risk_score = score

    await db.commit()

    return {"updated": len(scores), "scores": scores}

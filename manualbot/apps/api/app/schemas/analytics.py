"""Analytics schemas."""
from typing import List, Optional
from pydantic import BaseModel


class TopQuestion(BaseModel):
    question: str
    count: int


class AnalyticsOverviewResponse(BaseModel):
    docs_uploaded: int
    chunks_indexed: int
    chats_today: int
    chats_total: int
    active_bots: int
    top_questions: List[TopQuestion] = []
    unresolved_count: int = 0
    avg_response_time_ms: Optional[float] = None


class DailyChartPoint(BaseModel):
    date: str
    chats: int
    resolved: int


class BotAnalyticsResponse(BaseModel):
    bot_id: str
    bot_name: str
    chats_today: int
    chats_total: int
    docs_count: int
    chunks_count: int
    top_questions: List[TopQuestion] = []
    daily_chart: List[DailyChartPoint] = []

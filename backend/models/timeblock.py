from pydantic import BaseModel

class TimeBlock(BaseModel):
    title: str
    start_time: str
    end_time: str
    completed: bool = False
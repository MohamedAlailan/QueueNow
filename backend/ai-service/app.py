from typing import Literal
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI(title="QueueNow Waiting Time", version="2.0")

class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    queue_length_before: int = Field(ge=0)
    avg_service_time: float = Field(gt=0)
    available_staff: int = Field(ge=1)
    previous_waiting_time: float = Field(ge=0)
    hour: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    service_type: Literal["consultation", "checkup", "lab_test", "payment"]

@app.get("/health")
def health():
    # Liveness only; artifact loading is exercised by /predict.
    return {"status": "ok"}

@app.post("/predict")
def predict(data: PredictionRequest):
    try:
        from predict import predict_waiting_time
        return {"predicted_waiting_time_minutes": predict_waiting_time(data.model_dump())}
    except Exception as error:
        raise HTTPException(status_code=503, detail="Prediction unavailable") from error

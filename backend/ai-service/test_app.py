import sys
import types
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)
VALID = dict(queue_length_before=2, avg_service_time=12, available_staff=1,
             previous_waiting_time=15, hour=11, day_of_week=0, service_type='consultation')

def test_prediction_preserves_contract(monkeypatch):
    received = []
    monkeypatch.setitem(sys.modules, 'predict', types.SimpleNamespace(
        predict_waiting_time=lambda data: received.append(data) or 7.5))
    response = client.post('/predict', json=VALID)
    assert response.status_code == 200
    assert response.json()['predicted_waiting_time_minutes'] == 7.5
    assert received == [VALID]

def test_invalid_features_are_rejected():
    for field, value in [('queue_length_before', -1), ('available_staff', 0),
                         ('avg_service_time', 0), ('previous_waiting_time', -1),
                         ('hour', 24), ('day_of_week', 7), ('service_type', 'dental')]:
        assert client.post('/predict', json={**VALID, field: value}).status_code == 422
    assert client.post('/predict', json={**VALID, 'unknown': 2}).status_code == 422

def test_inference_failure_does_not_leak_details(monkeypatch):
    def fail(data):
        raise RuntimeError('private artifact path')
    monkeypatch.setitem(sys.modules, 'predict', types.SimpleNamespace(predict_waiting_time=fail))
    response = client.post('/predict', json=VALID)
    assert response.status_code == 503
    assert response.json() == {'detail': 'Prediction unavailable'}

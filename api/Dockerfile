
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create data directory for SQLite
RUN mkdir -p /app/data

COPY . .

# Make sure the application uses environment variables
ENV PYTHONUNBUFFERED=1
ENV DB_FILE=/app/data/vm_captain.db

# Run with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--log-level", "info", "app:app"]

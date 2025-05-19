FROM python:3.10


# Set working directory to the root
WORKDIR /
# Install requirements first (for better caching)
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN pip install watchfiles  

# We don't need to copy anything here as it will be mounted by docker-compose
# COPY . .

# Set Python path to include the app directory
ENV PYTHONPATH=/


#!/bin/bash
# Run Redis cache tests

echo "Running Redis cache tests..."
cd $(dirname "$0")/../
python -m pytest tests/test_redis_cache.py -v

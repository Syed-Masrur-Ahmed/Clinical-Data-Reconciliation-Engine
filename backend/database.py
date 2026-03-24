"""
In-memory storage for optional data persistence and API response caching.
"""

# Stores results of reconciliation requests keyed by a hash of the input payload.
reconciliation_cache: dict[str, dict] = {}

# Stores results of data quality validation requests keyed by a hash of the input payload.
validation_cache: dict[str, dict] = {}

# Optional audit log of all requests processed in the current session.
audit_log: list[dict] = []

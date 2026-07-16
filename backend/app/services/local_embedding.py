"""Local embedding service using sentence-transformers.

Provides a lightweight alternative to remote embedding APIs when no
embedding-capable cloud model is available.  Uses a CPU-friendly
model by default.
"""

from __future__ import annotations

from functools import lru_cache
from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    import numpy as np


class LocalEmbeddingService:
    """Sentence-transformers based embedding with lazy model loading.

    The model is loaded once and cached in-process.  Memory footprint is
    roughly 100-500 MB depending on the chosen model.

    Usage::

        svc = LocalEmbeddingService()
        vectors = svc.embed(["def foo(): pass", "def bar(): pass"])
        # → list[list[float]] each of length *settings.embedding_dimensions*
    """

    # Lightweight model (~130 MB) with 384-dim output — fast on CPU,
    # reasonable retrieval quality.  Swap to "all-MiniLM-L6-v2" for
    # even smaller footprint (80 MB / 384 dims).
    _DEFAULT_MODEL: str = "all-MiniLM-L6-v2"

    def __init__(self, model_name: str | None = None) -> None:
        self._model_name: str = model_name or settings.local_embedding_model or self._DEFAULT_MODEL
        self._expected_dims: int = settings.embedding_dimensions
        self._model: object | None = None

    # -- Public API ----------------------------------------------------------

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Return normalised embedding vectors for *texts*."""
        if not texts:
            return []
        model = self._get_model()
        # sentence-transformers returns numpy arrays
        embeddings: np.ndarray = model.encode(  # type: ignore[union-attr]
            texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        # Pad or truncate to expected dimensions if model output differs
        if embeddings.shape[1] != self._expected_dims:
            embeddings = self._resize(embeddings, self._expected_dims)
        return [row.tolist() for row in embeddings]

    def embed_query(self, text: str) -> list[float]:
        return self.embed([text])[0]

    # -- Internal ------------------------------------------------------------

    def _get_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self._model_name)
        return self._model

    @staticmethod
    def _resize(vectors: "np.ndarray", target_dim: int) -> "np.ndarray":
        """Pad with zeros or truncate to *target_dim*."""
        import numpy as np

        current_dim = vectors.shape[1]
        if current_dim == target_dim:
            return vectors
        if current_dim < target_dim:
            padded = np.zeros((vectors.shape[0], target_dim), dtype=vectors.dtype)
            padded[:, :current_dim] = vectors
            return padded
        return vectors[:, :target_dim]


# ---------------------------------------------------------------------------
# Module-level factory — used by EmbeddingService to decide whether to
# fall back or use a local model.
# ---------------------------------------------------------------------------

_local_instance: LocalEmbeddingService | None = None


def get_local_embedding_service() -> LocalEmbeddingService | None:
    """Return a cached ``LocalEmbeddingService``, or ``None`` if unavailable."""
    global _local_instance
    if not settings.local_embedding_enabled:
        return None
    if _local_instance is None:
        try:
            _local_instance = LocalEmbeddingService()
        except ImportError:
            return None
    return _local_instance

# Bake the mediamtx config into an image so config edits are picked up by a
# rebuild (`make build && make up`), the same as backend/frontend. (A bind
# mount would silently keep the old in-memory config until the container is
# manually restarted.)
FROM bluenviron/mediamtx:latest
COPY mediamtx.yml /mediamtx.yml

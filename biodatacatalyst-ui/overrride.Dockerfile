# By breaking out the overrides dockerfile we can re-use it for all BDC UI Overrides in the future.
# All BDC overrides should share the same base image, so we can use this to pass the specific directories.
# If you are overriding the BDC UI you can add this Dockerfile to your project
# and pass the BASE_DIR argument to point to your projects base dir.
FROM biodatacatalyst:latest AS base

ARG BASE_DIR
ENV BASE_DIR=${BASE_DIR}

# The build will fail if any directories are missing from the override UI
COPY ${BASE_DIR}/ui/src/main/picsureui/ /usr/local/apache2/htdocs/picsureui/
COPY ${BASE_DIR}/ui/src/main/psamaui/ /usr/local/apache2/htdocs/picsureui/psamaui/
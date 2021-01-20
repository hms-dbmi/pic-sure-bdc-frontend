#!/bin/bash

DOCKER_IMAGE=markhobson/maven-chrome

docker pull $DOCKER_IMAGE
#docker run -it -v "$PWD":/usr/src -w /usr/src $DOCKER_IMAGE mvn clean verify
docker run -it -v "$PWD":/usr/src -w /usr/src $DOCKER_IMAGE mvn test -Dpathtoconfigtest="src/test/resources/" -Dusername="$1" -Dpassword="$2"
